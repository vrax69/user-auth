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
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://www.nwfg.net",
      "https://nwfg.net",
      "http://localhost:3000",
      "https://localhost:3000",
    ];

    // Permitir dinámicamente ngrok solo en desarrollo
    if (origin && origin.includes("ngrok-free.app")) {
      allowedOrigins.push(origin);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS no permitido para este origen: " + origin));
    }
  },
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

// Puerto
const PORT = process.env.PORT || 3003;

if (process.env.NODE_ENV === "production") {
  // Producción: HTTPS con certificados reales
  const options = {
    key: fs.readFileSync("/etc/letsencrypt/live/nwfg.net/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/nwfg.net/fullchain.pem"),
  };

  const server = https.createServer(options, app);

  server.on("clientError", (err, socket) => {
    console.warn("⚠️ Error de cliente:", err.message);
    socket.destroy();
  });

  server.on("error", (err) => {
    console.error("🔴 Error del servidor:", err.message);
  });

  server.listen(PORT, () => {
    console.log(`🔥 BACKEND EN PRODUCCIÓN /api/auth/ en https://nwfg.net:${PORT}`);
  });
} else {
  // Desarrollo local: HTTP plano
  app.listen(PORT, () => {
    console.log(`🔥 BACKEND EN DEV /api/auth/ en http://localhost:${PORT}`);
  });
}
