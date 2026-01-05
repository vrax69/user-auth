// app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("🌍 Origin recibido:", req.headers.origin);
  next();
});

// Configuración CORS con múltiples orígenes desde .env
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

console.log("allowedOrigins:", allowedOrigins); // Para debug

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sin origen (ejemplo: Postman/curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("No permitido por CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

app.use(express.json());
app.use(cookieParser());

// Middleware para errores de JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error("JSON malformado:", err.message);
    return res.status(400).json({ message: "JSON inválido" });
  }
  next(err);
});

// Rutas
app.use("/api/auth", authRoutes);

// Ruta de prueba simple
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Servidor funcionando correctamente" });
});

// Puerto
const PORT = process.env.PORT || 3003;

/**
 * NOTA DE IMPLEMENTACIÓN:
 * En producción, Nginx actúa como Reverse Proxy manejando el SSL (HTTPS).
 * Por lo tanto, la aplicación Node.js siempre debe escuchar en HTTP plano
 * para comunicarse correctamente con el upstream de Nginx.
 */
app.listen(PORT, () => {
  const mode = process.env.NODE_ENV === "production" ? "PRODUCCIÓN" : "DESARROLLO";
  const protocol = "http"; // Nginx se encarga del https hacia afuera
  console.log(`🔥 BACKEND EN ${mode} activo en ${protocol}://localhost:${PORT}`);
});