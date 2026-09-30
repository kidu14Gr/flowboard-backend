const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const issueRoutes = require("./routes/issueRoutes");
const sprintRoutes = require("./routes/sprintRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
app.use(morgan("dev"));

// Static files (for attachments & avatars)
app.use("/uploads", express.static("uploads"));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FlowBoard REST API is running",
    modules: [
      "Authentication & Users",
      "Projects",
      "Teams & Members",
      "Issues (Epics, Stories, Tasks, Bugs, Subtasks)",
      "Kanban / Scrum Board",
      "Backlog & Sprints",
      "Comments & Attachments",
      "User Roles & Permissions",
    ],
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

module.exports = app;