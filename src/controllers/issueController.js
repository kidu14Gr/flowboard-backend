const Issue = require("../models/Issue");
const Project = require("../models/Project");

// @desc Get issues with search, filters, project, sprint, epic
// @route GET /api/issues
exports.getIssues = async (req, res) => {
  try {
    const { project, sprint, status, issueType, priority, assignee, epic, parentIssue, labels, search } = req.query;
    let query = {};

    if (project) {
      if (project.match(/^[0-9a-fA-F]{24}$/)) {
        query.project = project;
      } else {
        const p = await Project.findOne({ key: project.toUpperCase() });
        if (p) query.project = p._id;
      }
    }

    if (sprint) query.sprint = sprint === "backlog" ? null : sprint;
    if (status) query.status = status;
    if (issueType) query.issueType = issueType;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee === "me" ? req.user._id : assignee;
    if (epic) query.epic = epic;
    if (parentIssue) query.parentIssue = parentIssue;
    if (labels) {
      const labelArray = labels.split(",").map((l) => l.trim());
      query.labels = { $in: labelArray };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { key: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const issues = await Issue.find(query)
      .populate("assignee", "name email username avatar role")
      .populate("reporter", "name email username avatar role")
      .populate("project", "name key projectType")
      .populate("sprint", "name status startDate endDate")
      .populate("epic", "title key issueType")
      .populate("parentIssue", "title key issueType")
      .populate("comments.user", "name email username avatar role")
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: issues.length, issues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single issue by ID or Key (e.g. FLW-12)
// @route GET /api/issues/:idOrKey
exports.getIssueByIdOrKey = async (req, res) => {
  try {
    const param = req.params.idOrKey;
    const query = param.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: param }
      : { key: param.toUpperCase() };

    const issue = await Issue.findOne(query)
      .populate("assignee", "name email username avatar role")
      .populate("reporter", "name email username avatar role")
      .populate("project", "name key projectType")
      .populate("sprint", "name status startDate endDate")
      .populate("epic", "title key issueType")
      .populate("parentIssue", "title key issueType")
      .populate("comments.user", "name email username avatar role");

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Also fetch subtasks if this issue has any
    const subtasks = await Issue.find({ parentIssue: issue._id })
      .populate("assignee", "name email username avatar")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      issue: {
        ...issue.toObject(),
        subtasks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create issue (Epic, Story, Task, Bug, Subtask, etc.)
// @route POST /api/issues
exports.createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      issueType,
      priority,
      status,
      projectId,
      sprintId,
      epicId,
      parentId,
      assigneeId,
      storyPoints,
      labels,
      dueDate,
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: "Please provide an issue title and project ID",
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Sequential key generation: e.g. FLW-1, FLW-2
    const issueKey = `${project.key}-${project.issueCounter}`;
    project.issueCounter += 1;
    await project.save();

    const type = issueType || "Task";
    const defaultStatus = status || (type === "Bug" ? "OPEN" : "TO DO");

    const issue = await Issue.create({
      key: issueKey,
      title: title.trim(),
      description: description || "",
      issueType: type,
      status: defaultStatus,
      priority: priority || "Medium",
      project: projectId,
      sprint: sprintId || null,
      epic: epicId || null,
      parentIssue: parentId || null,
      assignee: assigneeId || null,
      reporter: req.user._id,
      storyPoints: storyPoints !== undefined ? Number(storyPoints) : 0,
      labels: Array.isArray(labels) ? labels : labels ? [labels] : [],
      dueDate: dueDate || null,
      activityHistory: [
        {
          user: req.user._id,
          action: `created ${type} ${issueKey}`,
          timestamp: new Date(),
        },
      ],
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate("assignee", "name email username avatar role")
      .populate("reporter", "name email username avatar role")
      .populate("project", "name key")
      .populate("sprint", "name status")
      .populate("epic", "title key")
      .populate("parentIssue", "title key");

    res.status(201).json({ success: true, issue: populatedIssue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update issue (status, assignee, priority, points, sprint, etc.)
// @route PUT /api/issues/:id
exports.updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const {
      title,
      description,
      issueType,
      status,
      priority,
      assignee,
      storyPoints,
      sprint,
      epic,
      parentIssue,
      labels,
      dueDate,
    } = req.body;

    // Track status change in activity history
    if (status && status !== issue.status) {
      issue.activityHistory.push({
        user: req.user._id,
        action: `changed status from ${issue.status} to ${status}`,
        timestamp: new Date(),
      });
      issue.status = status;
    }

    // Track assignee change
    if (assignee !== undefined && String(assignee) !== String(issue.assignee)) {
      issue.activityHistory.push({
        user: req.user._id,
        action: assignee ? "reassigned issue" : "unassigned issue",
        timestamp: new Date(),
      });
      issue.assignee = assignee || null;
    }

    if (title) issue.title = title.trim();
    if (description !== undefined) issue.description = description;
    if (issueType) issue.issueType = issueType;
    if (priority) issue.priority = priority;
    if (storyPoints !== undefined) issue.storyPoints = Number(storyPoints);
    if (sprint !== undefined) issue.sprint = sprint || null;
    if (epic !== undefined) issue.epic = epic || null;
    if (parentIssue !== undefined) issue.parentIssue = parentIssue || null;
    if (labels !== undefined) issue.labels = Array.isArray(labels) ? labels : [labels];
    if (dueDate !== undefined) issue.dueDate = dueDate || null;

    await issue.save();

    const updated = await Issue.findById(issue._id)
      .populate("assignee", "name email username avatar role")
      .populate("reporter", "name email username avatar role")
      .populate("project", "name key")
      .populate("sprint", "name status")
      .populate("epic", "title key")
      .populate("parentIssue", "title key")
      .populate("comments.user", "name email username avatar role");

    res.json({ success: true, issue: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete issue
// @route DELETE /api/issues/:id
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    await Issue.updateMany({ epic: issue._id }, { $set: { epic: null } });
    await Issue.updateMany({ parentIssue: issue._id }, { $set: { parentIssue: null } });
    await issue.deleteOne();

    res.json({ success: true, message: `Issue ${issue.key} deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add comment to issue
// @route POST /api/issues/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text cannot be empty" });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    issue.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    issue.activityHistory.push({
      user: req.user._id,
      action: "added a comment",
      timestamp: new Date(),
    });

    await issue.save();

    const updated = await Issue.findById(issue._id)
      .populate("comments.user", "name email username avatar role")
      .populate("assignee", "name email username avatar role");

    res.json({ success: true, issue: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Edit comment on issue
// @route PUT /api/issues/:id/comments/:commentId
exports.editComment = async (req, res) => {
  try {
    const { text } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const comment = issue.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Only comment author or Admin can edit
    if (String(comment.user) !== String(req.user._id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Not authorized to edit this comment" });
    }

    comment.text = text.trim();
    await issue.save();

    const updated = await Issue.findById(issue._id)
      .populate("comments.user", "name email username avatar role")
      .populate("assignee", "name email username avatar role");

    res.json({ success: true, issue: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete comment on issue
// @route DELETE /api/issues/:id/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const comment = issue.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Only comment author or Admin can delete
    if (String(comment.user) !== String(req.user._id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }

    comment.deleteOne();
    await issue.save();

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add attachment metadata to issue
// @route POST /api/issues/:id/attachments
exports.addAttachment = async (req, res) => {
  try {
    const { filename, path, mimetype, size } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    issue.attachments.push({
      filename: filename || "attachment",
      path: path || "/uploads/sample",
      mimetype: mimetype || "application/octet-stream",
      size: size || 1024,
    });

    issue.activityHistory.push({
      user: req.user._id,
      action: `uploaded attachment ${filename}`,
      timestamp: new Date(),
    });

    await issue.save();

    res.json({ success: true, attachments: issue.attachments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete attachment from issue
// @route DELETE /api/issues/:id/attachments/:attachmentId
exports.deleteAttachment = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const attachment = issue.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }

    attachment.deleteOne();
    await issue.save();

    res.json({ success: true, message: "Attachment deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
