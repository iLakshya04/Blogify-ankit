import multer from "multer";

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = err.keyPattern?.email
      ? "An account with this email already exists"
      : "Duplicate field value";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(". ");
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be smaller than 5MB"
        : err.message;
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Not authorized, invalid or expired token";
  }

  const response = { message };
  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
