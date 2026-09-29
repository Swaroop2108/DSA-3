const errorHandler = (err, req, res, next) => {
  console.error('❌ Server Error:', err.stack || err.message || err);

  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || (statusCode === 500 ? 'Server encountered an error. Please check backend logs.' : 'An error occurred');

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = errorHandler;
