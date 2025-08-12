import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { AuthService } from "./auth.service";
import {
  formatApiResponse,
  formatErrorResponse,
} from "../../shared/utils/helpers";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;
      const result = await AuthService.registerUser({ email, password, name });

      res
        .status(201)
        .json(formatApiResponse(true, result, "User created successfully"));
    } catch (error) {
      console.error("Registration error:", error);
      if (
        error instanceof Error &&
        error.message === "User already exists with this email"
      ) {
        return res.status(400).json(formatErrorResponse(error.message));
      }
      res.status(500).json(formatErrorResponse("Internal server error"));
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await AuthService.loginUser({ email, password });

      res.json(formatApiResponse(true, result, "Login successful"));
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error && error.message === "Invalid credentials") {
        return res.status(401).json(formatErrorResponse(error.message));
      }
      res.status(500).json(formatErrorResponse("Internal server error"));
    }
  }
}
