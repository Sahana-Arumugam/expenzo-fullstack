import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../config/db.js";
import userRoutes from "../routes/userRoutes.js";
import expenseRoutes from "../routes/expenseRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ⭐ FIXED CORS ⭐
app.use(
  cors({
    origin: [
      "http://localhost:5173",   // Vite frontend
      "http://localhost:3000",   // optional older React
      process.env.FRONTEND_URL   // for Vercel deploy
    ],
    methods: "GET,POST,PUT,DELETE,PATCH",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/expenzo/users", userRoutes);
app.use("/api/expenzo/expenses", expenseRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend working ✔ (Local + Vercel ready)");
});

// ⭐ LOCAL ONLY ⭐
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// ⭐ VERCEL NEEDS THIS ⭐
export default app;
