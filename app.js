// app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import https from "https";

import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configuración CORS mejorada
app.use(cors({
  origin: ["https://www.nwfg.net", "https://nwfg.net", "http://localhost:3000", "https://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400 // 24 horas en segundos - mejora rendimiento
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

// Configurar HTTPS con certificados SSL de Let's Encrypt
const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/nwfg.net/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/nwfg.net/fullchain.pem"),
};

// Puerto
const PORT = process.env.PORT || 3003;

// Crear servidor HTTPS con mejor gestión de errores
const server = https.createServer(options, app);

server.on("clientError", (err, socket) => {
  console.warn("⚠️ Error de cliente:", err.message);
  socket.destroy();
});

server.on("error", (err) => {
  console.error("🔴 Error del servidor:", err.message);
});

server.listen(PORT, () => {
  console.log(`🔥 BACKEND CORRECTO EN /api/auth/listo en https://nwfg.net:${PORT}`);
});
