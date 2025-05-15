// controllers/authController.js
import jwt from "jsonwebtoken";
import { db } from "../config.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ message: "Usuario no encontrado" });

    const user = rows[0];

    if (password !== user.password) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.rol,
          nombre: user.nombre,
          centro: user.centro
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
    const origin = req.headers.origin || "";
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,             // ngrok es HTTPS → obligatorio
      sameSite: "none",         // obligatorio si usas dominios cruzados
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    
    
    res.json({ message: "Login exitoso", user: { id: user.id, nombre: user.nombre, email: user.email, role: user.rol } });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

// LOGOUT
export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Sesión cerrada" });
};
