import { Router } from "express";
import { addPassword, getPasswords, deletePassword } from "../controllers/PasswordController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const PasswordRoute = Router();

PasswordRoute.post("/add", verifyToken, addPassword);
PasswordRoute.get("/all", verifyToken, getPasswords);
PasswordRoute.delete("/delete/:id", verifyToken, deletePassword);

export default PasswordRoute;
