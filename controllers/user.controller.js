import { User } from "../model/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config.js";

export const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      return res.status(401).json({ message: "User already exists" });
    }
    const hashPassword = await bcrypt.hash(password, 7);
    const newuser = new User({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });
    await newuser.save();
    return res.status(201).json({ message: "Signup succeeded" });
  } catch (error) {
    console.log("Error in signup:", error);
    return res.status(500).json({ errors: "Error in signup" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    
    // Check user exists FIRST
    if (!user) {
      return res.status(403).json({ message: "Invalid credentials" });
    }

    // Then compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(403).json({ message: "Invalid credentials" });
    }

    // JWT signing key — critical fix below ⬇️
    const token = jwt.sign({ id: user._id }, config.JWT_USER_PASSWORD, {
      expiresIn: "1d",
    });

    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };

    res.cookie("jwt", token, cookieOptions);
    return res.status(200).json({
      message: "Login succeeded",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("jwt");
    return res.status(200).json({ message: "Logout succeeded" });
  } catch (error) {
    console.log("Error in logout:", error);
    return res.status(500).json({ errors: "Error in logout" });
  }
};
