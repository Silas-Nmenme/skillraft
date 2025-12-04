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

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/founders", founderRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api/solo-entrepreneurs", soloEntrepreneurRoutes);

app.get("/", (req, res) => res.send("Welcome to Softpire!"));

// Error handling middleware (catches multer and other errors)
app.use((err, req, res, next) => {
  console.error('=== ERROR MIDDLEWARE ===');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error code:', err.code);
  console.error('Full error:', err);
  console.error('======================');

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum 25MB allowed.'
    });
  }

  // Multer unexpected field error
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field.'
    });
  }

  // Multer file filter error
  if (err.message && err.message.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Generic multer/validation errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.'
  });
});

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


