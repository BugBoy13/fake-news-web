const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};
const handleDuplicateFieldDB = (err) => {
    // const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const value = err.keyValue.name;
    const message = `Duplicate field value: ${value}`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors.map((val) => val.message));

    const message = `Invalid input data: ${errors.join(`. `)}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token', 401);

const handleJWTExpiredError = () => new AppError('Token expired', 401);

const sendDevError = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    // Rendered website
    res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message,
    });
};

const sendProdError = (err, req, res) => {
    // A. API
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted error send back to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        // Programming or other unknown error: dont leak error details
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        });
    }
    // B. Rendered website
    // Operational, trusted error send back to client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message,
        });
    }
    // Programming or other unknown error: dont leak error details
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: 'Please try again later',
    });
};

module.exports = (err, req, res, next) => {
    console.error(err);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendDevError(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldDB(error);
        if (error.name === 'ValidatorError')
            // condition is always false
            error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
        if (error.name === 'TokenExpiredError')
            error = handleJWTExpiredError(error);

        sendProdError(error, req, res);
    }
};
