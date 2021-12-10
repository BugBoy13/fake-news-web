const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const catchAsync = require('../utils/catchAsync');

const signToken = (id) =>
    jwt.sign(
        {
            id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN,
        }
    );

const createAndSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() +
                process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        secure: req.secure || req.headers('x-forwarded-proto') === 'https',
        httpOnly: true,
    };

    // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    // if (req.secure || req.headers('x-forwarded-proto') === 'https')
    //     cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from response body
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.signup = catchAsync(async (req, res) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();

    createAndSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1. Check if email and password exists

    if (!email || !password) {
        return next(new AppError(`Please provide email and password`, 400));
    }

    // 2. Check if user exists and password is correct
    const user = await User.findOne({
        email,
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3. If everything ok, send token in result
    createAndSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        status: 'success',
    });
};

exports.protect = catchAsync(async (req, res, next) => {
    // 1. Getting token and check if exists

    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('You are not logged in.', 401));
    }

    // 2. Verifying the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError('The user no longer exists', 401));
    }

    // 4. Check if user changed password after token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User changed password', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;
    res.locals.user = freshUser; // response.locals available in all templates
    next();
});

// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1. Verifies the token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2. Check if user still exists
            const freshUser = await User.findById(decoded.id);
            if (!freshUser) {
                return next();
            }

            // 3. Check if user changed password after token was issued
            if (freshUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = freshUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

// Middleware for passing argument
exports.restrictTo =
    (...roles) =>
    (req, res, next) => {
        // roles is an array ['admin', 'lead-guide']

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            );
        }

        next();
    };

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on posted email

    const user = await User.findOne({
        email: req.body.email,
    });

    if (!user) {
        return next(new AppError('There is no user with this email', 404));
    }

    // 2. Generate the random token
    const resetToken = user.createPasswordResetToken();

    await user.save({
        validateBeforeSave: false,
    });

    // 3. Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password: ${resetURL}`;

    try {
        // await sendEmail({
        //     email: user.email,
        //     subject: `Your password reset token (valid for 10 mins)`,
        //     message,
        // });

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'token sent to email',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({
            validateBeforeSave: false,
        });

        return next(new AppError('Error sending email. Try again later', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
            $gt: Date.now(),
        },
    });

    // 2. If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 3. Update changedPasswordAt property for the user
    // 4. Log the user in, send JWT

    createAndSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1. Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2. Check if posted password is correct
    if (
        !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
        return next(new AppError('Your current password is wrong', 400));
    }
    // 3. If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // Why not findAndUpdate --> No validation works, password encrypt middleware will not work

    // 4. Log user in, sent JWT
    createAndSendToken(user, 201, req, res);
});