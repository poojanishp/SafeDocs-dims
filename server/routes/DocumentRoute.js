import { Router } from "express";
import {
  uploadDocument,
  getDocuments,
  getSharedDocuments,
  deleteDocument,
  renameDocument,
} from "../controllers/DocumentController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../middlewares/uploadConfig.js";

const DocumentRoute = Router();

DocumentRoute.post("/upload", verifyToken, upload.single("file"), uploadDocument);
DocumentRoute.get("/all", verifyToken, getDocuments);
DocumentRoute.get("/shared", verifyToken, getSharedDocuments);
DocumentRoute.delete("/delete/:id", verifyToken, deleteDocument);
DocumentRoute.put("/rename/:id", verifyToken, renameDocument);

export default DocumentRoute;
