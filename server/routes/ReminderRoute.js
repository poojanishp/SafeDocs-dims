import { Router } from "express";
import { addReminder, getReminders, deleteReminder, deleteRemindersByDoc } from "../controllers/ReminderController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const ReminderRoute = Router();

ReminderRoute.post("/add", verifyToken, addReminder);
ReminderRoute.get("/all", verifyToken, getReminders);
ReminderRoute.delete("/delete/:id", verifyToken, deleteReminder);
ReminderRoute.delete("/delete-by-doc/:docId", verifyToken, deleteRemindersByDoc);

export default ReminderRoute;
