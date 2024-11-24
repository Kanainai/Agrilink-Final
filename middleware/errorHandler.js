const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.type === 'auth') {
        return res.status(401).json({
            error: 'Authentication failed',
            details: err.message
        });
    }

    if (err.type === 'validation') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.message
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

module.exports = errorHandler;
