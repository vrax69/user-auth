// middleware/envGuard.js
import dotenv from "dotenv";
dotenv.config();

/**
 * Detecta y expone el modo de ejecución actual
 * - development → desactiva autenticación, logs verbosos
 * - staging → logs moderados, auth opcional
 * - production → modo seguro
 */

export const envGuard = {
  env: process.env.NODE_ENV || "development",
  isDev() {
    return this.env === "development" || process.env.SKIP_AUTH === "1";
  },
  isProd() {
    return this.env === "production" && process.env.SKIP_AUTH !== "1";
  },
  logMode() {
    console.log(`🌎 Environment: ${this.env} | SKIP_AUTH=${process.env.SKIP_AUTH}`);
  },
};
