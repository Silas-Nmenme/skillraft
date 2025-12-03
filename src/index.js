const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");

//importing necessary modules
const connectDB = require("./config/db.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup
const FRONTEND_URL = process.env.FRONTEND_URL || "https://skillraft.vercel.app";
app.use(cors({
	origin: FRONTEND_URL,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

//Routes
const userRoutes = require("./routes/user.routes");
const authRoutes = require("./routes/auth.routes");
const founderRoutes = require("./routes/founder.routes");
const recruiterRoutes = require("./routes/recruiter.routes");
const soloEntrepreneurRoutes = require("./routes/soloEntrepreneur.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/founders", founderRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api/solo-entrepreneurs", soloEntrepreneurRoutes);

app.get("/", (req, res) => res.send("Welcome to Softpire!"));

// ===== Start Server After DB Connect =====
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Allowed frontend origin: ${FRONTEND_URL}`);
  });
}).catch(err => {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
});

