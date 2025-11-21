import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";

const router = express.Router();

//  User routes
router.post("/register", registerUser);
router.post("/login", loginUser);
console.log("✅ userRoutes file loaded successfully");
export default router;
