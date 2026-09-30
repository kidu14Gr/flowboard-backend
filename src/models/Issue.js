const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const IssueSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true, // e.g., FLW-1, FLW-12
    },
    title: {
      type: String,
      required: [true, "Please provide an issue title"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    issueType: {
      type: String,
      enum: [
        "Epic",
        "Story",
        "Task",
        "Bug",
        "Subtask",
        "Improvement",
        "New Feature",
        "Technical Task",
      ],
      default: "Task",
    },
    status: {
      type: String,
      enum: [
        // Standard Workflow
        "BACKLOG",
        "TO DO",
        "IN PROGRESS",
        "IN REVIEW",
        "DONE",
        // Bug Workflow
        "OPEN",
        "IN TESTING",
        "RESOLVED",
        "CLOSED",
      ],
      default: "TO DO",
    },
    priority: {
      type: String,
      enum: ["Highest", "High", "Medium", "Low", "Lowest"],
      default: "Medium",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    epic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      default: null,
    },
    parentIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      default: null, // Used for Subtasks
    },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sprint",
      default: null,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storyPoints: {
      type: Number,
      default: 0,
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    dueDate: {
      type: Date,
      default: null,
    },
    component: {
      type: String,
      enum: ["Frontend", "Backend", "Authentication", "Database", "Mobile", "Security", "API", "Other"],
      default: "Frontend",
    },
    fixVersion: {
      type: String,
      default: "Version 1.0",
    },
    attachments: [AttachmentSchema],
    comments: [CommentSchema],
    activityHistory: [ActivitySchema],
  },
  { timestamps: true }
);

// Virtual index for searching
IssueSchema.index({ title: "text", description: "text", key: "text" });

module.exports = mongoose.model("Issue", IssueSchema);
