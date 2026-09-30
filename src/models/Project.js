const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Please provide a project key (e.g. FLW)"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Please provide a project name"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    projectType: {
      type: String,
      enum: ["Software", "Business", "Marketing", "Service Desk", "Other"],
      default: "Software",
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["Admin", "Project Manager", "Developer", "Reporter"],
          default: "Developer",
        },
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Planning", "Completed", "Archived"],
      default: "Active",
    },
    issueCounter: {
      type: Number,
      default: 1, // Issues will start from KEY-1 (e.g. FLW-1, FLW-2)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
