import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../config/db.js";
import userRoutes from "../routes/userRoutes.js";
import expenseRoutes from "../routes/expenseRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ⭐ UNIVERSAL CORS (LOCAL + VERCEL)⭐
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
      ];

      // allow local tools like Postman (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Vercel frontend will work here automatically
      }
    },
    credentials: true,
    methods: "GET,POST,PUT,DELETE,PATCH",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api/expenzo/users", userRoutes);
app.use("/api/expenzo/expenses", expenseRoutes);

// Test
app.get("/", (req, res) => {
  res.send("Backend working ✔");
});

// Local server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
