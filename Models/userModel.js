const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, `Please tell us your name`],
    },
    email: {
        type: String,
        required: [true, `Please provide your email`],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, `Please provide a valid email`],
    },
    photo: {
        type: String,
        default: 'default.jpg',
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, `Please provide a password`],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // this only works on CREATE and SAVE!!
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not same',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpired: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        // if password is modified
        return next();
    }

    this.password = await bcrypt.hash(this.password, 12);

    // deleting the field
    this.passwordConfirm = undefined; // passwordConfirm is required (required to input, not to persist)
    next();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }

    this.passwordChangedAt = Date.now() - 1000; // subtract 1s because creating jwt takes time, to ensure token is always created after the password is changed
    next();
});

userSchema.pre(/^find/, function (next) {
    // this points to current query
    this.find({ active: { $ne: false } });
    next();
});

// available on all documents, instance method
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }

    // false --> not changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpired = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
