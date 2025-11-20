const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");

//importing necessary modules
const connectDB = require("./config/db.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/founders", founderRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api/solo-entrepreneurs", soloEntrepreneurRoutes);

app.get("/", (req, res) => res.send("Welcome to Softpire!"));

//start the server
app.listen(PORT, () => {
	connectDB();
	console.log(`Server is running on port ${PORT}`);
});
