import { Router } from "express";
import {
  addEmergencyContact,
  getEmergencyContacts,
  deleteEmergencyContact,
  triggerSOS,
  sendEmergencyContactOtp,
  addEmergencyContactFromFamily,
} from "../controllers/EmergencyController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const EmergencyRoute = Router();

EmergencyRoute.post("/send-otp", verifyToken, sendEmergencyContactOtp);
EmergencyRoute.post("/add", verifyToken, addEmergencyContact);
EmergencyRoute.post("/add-from-family/:familyMemberId", verifyToken, addEmergencyContactFromFamily);
EmergencyRoute.get("/all", verifyToken, getEmergencyContacts);
EmergencyRoute.delete("/delete/:id", verifyToken, deleteEmergencyContact);
EmergencyRoute.post("/sos", verifyToken, triggerSOS);

export default EmergencyRoute;
