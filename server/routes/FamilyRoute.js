import { Router } from "express";
import {
  addFamilyMember,
  getFamilyMembers,
  deleteFamilyMember,
  sendFamilyMemberOtp,
} from "../controllers/FamilyController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const FamilyRoute = Router();

FamilyRoute.post("/send-otp", verifyToken, sendFamilyMemberOtp);
FamilyRoute.post("/add", verifyToken, addFamilyMember);
FamilyRoute.get("/all", verifyToken, getFamilyMembers);
FamilyRoute.delete("/delete/:id", verifyToken, deleteFamilyMember);

export default FamilyRoute;
