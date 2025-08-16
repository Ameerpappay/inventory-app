import dotenv from "dotenv";
import path from "path";

/**
 * Load environment variables based on NODE_ENV
 * Uses standard dotenv library with environment-specific files
 */
export function loadEnvConfig() {
  const nodeEnv = process.env.NODE_ENV || "development";

  // Load environment-specific .env file
  const envFile =
    nodeEnv === "production" ? ".env.production" : ".env.development";
  const envPath = path.resolve(process.cwd(), envFile);

  try {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded environment config from ${envFile}`);
  } catch (error) {
    console.warn(`⚠️  Could not load ${envFile}, falling back to .env`);
    // Fallback to default .env file
    dotenv.config();
  }

  // Load local overrides (highest priority)
  dotenv.config({
    path: path.resolve(process.cwd(), ".env.local"),
    override: true,
  });

  // Validate required environment variables
  validateRequiredEnvVars();
}

/**
 * Validate that all required environment variables are set
 */
function validateRequiredEnvVars() {
  const required = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "JWT_SECRET",
    "FRONTEND_URL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:", missing);
    process.exit(1);
  }

  // Validate JWT_SECRET length in production
  if (
    process.env.NODE_ENV === "production" &&
    process.env.JWT_SECRET!.length < 32
  ) {
    console.error("❌ JWT_SECRET must be at least 32 characters in production");
    process.exit(1);
  }

  console.log("✅ All required environment variables are set");
}

/**
 * Get current environment configuration summary
 */
export function getEnvSummary() {
  return {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    frontendUrl: process.env.FRONTEND_URL,
    databaseHost:
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "unknown",
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    debugMode: process.env.DEBUG === "true",
  };
}
