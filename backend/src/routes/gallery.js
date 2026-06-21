import express from "express";
import { getGallery, deleteGeneration } from "../controllers/galleryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get(   "/",    protect, getGallery);
router.delete("/:id", protect, deleteGeneration);

export default router;