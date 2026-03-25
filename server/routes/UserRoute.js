"use strict";
import { Router } from "express";
import {
  register,
  verifyOtp,
  login,
  logout,
  getUser,
  sendForgotPasswordOtp,
  loginWithOtp,
  resetPasswordWithOtp,
  sendDeleteAccountOtp,
  deleteAccountWithOtp,
  updateProfile,
  changePassword,
} from "../controllers/UserController.js";
import { verifyToken } from "../middlewares/verifyToken.js";


const UserRoute = Router();
UserRoute.post("/register", register)
UserRoute.post("/verify-otp", verifyOtp);
UserRoute.post("/login", login);
UserRoute.post("/forgot-password/send-otp", sendForgotPasswordOtp);
UserRoute.post("/login-with-otp", loginWithOtp);
UserRoute.post("/reset-password-with-otp", resetPasswordWithOtp);
UserRoute.post("/delete-account/send-otp", verifyToken, sendDeleteAccountOtp);
UserRoute.post("/delete-account/confirm", verifyToken, deleteAccountWithOtp);
UserRoute.put("/profile", verifyToken, updateProfile);
UserRoute.post("/change-password", verifyToken, changePassword);
UserRoute.post("/logout", logout);
UserRoute.get("/profile", verifyToken, getUser);



export default UserRoute;
