import crypto from "crypto";
import jwt from "jsonwebtoken";

let devFallbackSecret;

export function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  if (!devFallbackSecret) {
    devFallbackSecret = crypto.randomBytes(32).toString("hex");
  }
  return devFallbackSecret;
}

export function generateToken(userId) {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: "7d",
  });
}
