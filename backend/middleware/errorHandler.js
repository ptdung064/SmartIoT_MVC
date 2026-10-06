function notFound(req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`
        }
    });
}

function errorHandler(error, req, res, next) {
    console.error('[ERROR]', error);

    if (res.headersSent) return next(error);

    res.status(error.status || 500).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Lỗi máy chủ'
        }
    });
}

module.exports = { notFound, errorHandler };
