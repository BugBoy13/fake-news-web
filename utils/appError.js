class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${
            statusCode.toString().startsWith('4') ? 'failure' : 'error'
        }`;
        this.isOperational = true; // the error we are creating ourself

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
