// routes/authRoutes.js
import express from "express";
import { login, logout, checkUserStatus } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rutas públicas
router.post("/login", login);
router.post("/logout", logout);

// Rutas protegidas (requieren autenticación)
router.get("/status", verifyToken, checkUserStatus);

// Ruta para verificar si el token es válido
router.get("/verify", verifyToken, (req, res) => {
  res.status(200).json({
    message: "Token válido",
    user: {
      id: req.user.id,
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol,
      centro: req.user.centro,
      status: req.user.status
    }
  });
});

export default router;