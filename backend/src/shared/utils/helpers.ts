import jwt, { SignOptions } from "jsonwebtoken";

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }

  const payload = { userId };
  const options: SignOptions = {
    expiresIn: "7d", // Use string literal instead of environment variable
  };

  return jwt.sign(payload, secret, options);
};

export const formatApiResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  total?: number
) => {
  return {
    success,
    ...(data && { data }),
    ...(message && { message }),
    ...(total !== undefined && { total }),
  };
};

export const formatErrorResponse = (error: string, statusCode?: number) => {
  return {
    success: false,
    error,
    ...(statusCode && { statusCode }),
  };
};
