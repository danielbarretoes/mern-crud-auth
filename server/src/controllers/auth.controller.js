import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TOKEN_SECRET } from "../config.js";
import { createAccessToken } from "../lib/jwt.js";

export const register = async (req, res) => {
  try {
    // obtener parametros del req.
    const { username, email, password } = req.body;

    // verificar si ya se ha registrado el email.
    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.status(400).json({
        message: ["The email is already in use"],
      });
    }

    // hashing the password.
    const passwordHash = await bcrypt.hash(password, 10);

    // creating the user.
    const newUser = new User({
      username,
      email,
      password: passwordHash,
    });

    // saving the user in the database.
    const userSaved = await newUser.save();

    // create access token.
    const token = await createAccessToken({
      id: userSaved._id,
    });

    // Token cookie.
    res.cookie("token", token, {
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
    });

    // json de respuesta al cliente.
    res.json({
      id: userSaved._id,
      username: userSaved.username,
      email: userSaved.email,
      createdAt: userSaved.createdAt,
      updatedAt: userSaved.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    // obtener parametros del req.
    const { email, password } = req.body;

    // verificar si ya se ha registrado el email.
    const userFound = await User.findOne({ email });
    if (!userFound) {
      // si no coincide, responder al cliente el error.
      return res.status(400).json({
        message: ["The email does not exist"],
      });
    }

    // desencriptando la contraseña y comparandola con la dada en req.
    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      // si no coincide, responder al cliente el error.
      return res.status(400).json({
        message: ["The password is incorrect"],
      });
    }

    const token = await createAccessToken({
      id: userFound._id,
      username: userFound.username,
    });

    // Token cookie.
    res.cookie("token", token, {
      httpOnly: process.env.NODE_ENV !== "development",
      secure: true,
      sameSite: "none",
    });

    // json de respuesta al cliente.
    res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyToken = async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.send(false);

  jwt.verify(token, TOKEN_SECRET, async (error, user) => {
    if (error) return res.sendStatus(401);

    const userFound = await User.findById(user.id);
    if (!userFound) return res.sendStatus(401);

    return res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
    });
  });
};

export const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    expires: new Date(0),
  });
  return res.sendStatus(200).json({ message: "logout" });
};
