import { Router } from "express";
import { createSharedLink, viewSharedDocument, getMyLinks } from "../controllers/ShareController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const ShareRoute = Router();

// Protected routes (require login)
ShareRoute.post("/create", verifyToken, createSharedLink);
ShareRoute.get("/mylinks", verifyToken, getMyLinks);

// Public route (accessed via link)
ShareRoute.get("/view/:token", viewSharedDocument);

export default ShareRoute;
