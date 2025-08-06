// controllers/authController.js
import jwt from "jsonwebtoken";
import { db } from "../config.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email y contraseña son requeridos",
        code: "MISSING_CREDENTIALS"
      });
    }

    // Buscar usuario en la base de datos - traer TODAS las columnas
    const [userRows] = await db.execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ 
        message: "Credenciales inválidas",
        code: "INVALID_CREDENTIALS"
      });
    }

    const user = userRows[0];

    // Verificar contraseña ANTES de cualquier otra validación
    const isPasswordValid = password === user.password;
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Credenciales inválidas",
        code: "INVALID_CREDENTIALS"
      });
    }

    // ⚠️ VALIDACIÓN TEMPRANA: Verificar estado ANTES de generar el token
    if (user.STATUS_OF_AGENT !== 'active') {
      return res.status(403).json({ 
        message: "Tu cuenta está inactiva. Contacta al administrador.",
        code: "ACCOUNT_INACTIVE",
        status: user.STATUS_OF_AGENT
      });
    }

    // Solo si llegamos aquí (credenciales válidas Y usuario activo) generamos el token
    const token = jwt.sign(
      { 
        id: user.id, 
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        centro: user.centro
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    // Configurar cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    // Crear copia del usuario sin la contraseña para la respuesta
    const { password: _, ...userWithoutPassword } = user;

    // Respuesta exitosa (sin enviar la contraseña)
    res.status(200).json({
      message: "Login exitoso",
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      code: "SERVER_ERROR"
    });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({ 
      message: "Logout exitoso",
      code: "LOGOUT_SUCCESS"
    });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      code: "SERVER_ERROR"
    });
  }
};

// Función para verificar estatus actual del usuario
export const checkUserStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [userRows] = await db.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ 
        message: "Usuario no encontrado",
        code: "USER_NOT_FOUND"
      });
    }

    const user = userRows[0];
    
    // Crear copia del usuario sin la contraseña para la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Error al verificar estatus:", error);
    res.status(500).json({ 
      message: "Error interno del servidor",
      code: "SERVER_ERROR"
    });
  }
};