const Tour = require('../Models/tourModel');
const User = require('../Models/userModel');
const Booking = require('../Models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.alerts = (req, res, next) => {
    const { alert } = req.query;
    if (alert === 'booking') {
        res.locals.alert = `Your booking is successful`;
    }
    next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1. Get tour data from collection
    const tours = await Tour.find();

    // 2. Build templates
    // 3. Render the template using tour data
    res.status(200).render('overview', {
        title: 'All Tours',
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1. get the data for requested tour, including reviews and guides
    const tour = await Tour.findOne({
        slug: req.params.slug,
    }).populate({
        path: 'reviews',
        fields: 'review rating user',
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }

    // 2. Build template
    // 3. Render template using the data

    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' https://*.mapbox.com https://js.stripe.com/ ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com/v3/ 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('tour', {
            title: `${tour.name} Tour`,
            tour,
        });
});

exports.getLoginForm = (req, res) => {
    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('login', {
            title: 'Login',
        });
};

exports.getAccount = (req, res) => {
    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('account', {
            title: 'Your account',
        });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1. Find all bookings
    const bookings = await Booking.find({
        user: req.user.id,
    });
    // 2. Find tours with return IDs
    const tourIDs = bookings.map((el) => el.tour); // tour is already an ID
    const tours = await Tour.find({
        _id: {
            $in: tourIDs,
        },
    });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email,
        },
        {
            new: true, // get new object
            runValidators: true,
        }
    );

    res.status(200)
        .set(
            'Content-Security-Policy',
            "default-src 'self' ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
        )
        .render('account', {
            title: 'Your account',
            user: updatedUser,
        });
});
