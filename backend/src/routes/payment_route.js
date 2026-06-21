import express from "express";
import { createOrder, verifyPayment, paymentHistory } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-order", protect, createOrder);
router.post("/verify",       protect, verifyPayment);
router.get( "/history",      protect, paymentHistory);

export default router;