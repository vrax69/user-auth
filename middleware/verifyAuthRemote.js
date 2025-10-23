import axios from "axios";
import { envGuard } from "./envGuard.js";

export const verifyAuthRemote = async (req, res, next) => {
  if (envGuard.isDev()) {
    console.log("⚙️ [AUTH] Modo desarrollo: autenticación deshabilitada");
    req.user = { id: 1, nombre: "Dev User", rol: "Administrador" };
    return next();
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token no proporcionado" });

  try {
    const response = await axios.get(process.env.AUTH_SERVICE_URL, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 3000,
      validateStatus: () => true,
    });

    if (response.status !== 200)
      return res.status(403).json({ message: "Token inválido o expirado" });

    req.user = response.data.user;
    next();
  } catch (err) {
    console.error("❌ Error validando token remoto:", err.message);
    return res.status(500).json({ message: "Error al validar token remoto" });
  }
};
