const Project = require("../models/Project");
const Issue = require("../models/Issue");

// @desc Get all projects
// @route GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("lead", "name email username avatar role")
      .populate("members.user", "name email username avatar role")
      .sort({ updatedAt: -1 });

    // Include issue counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const totalIssues = await Issue.countDocuments({ project: p._id });
        const openIssues = await Issue.countDocuments({
          project: p._id,
          status: { $in: ["BACKLOG", "TO DO", "IN PROGRESS", "IN REVIEW", "OPEN", "IN TESTING"] },
        });
        const completedIssues = await Issue.countDocuments({
          project: p._id,
          status: { $in: ["DONE", "RESOLVED", "CLOSED"] },
        });
        return {
          ...p.toObject(),
          totalIssues,
          openIssues,
          completedIssues,
        };
      })
    );

    res.json({ success: true, count: projectsWithCounts.length, projects: projectsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create new project
// @route POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      key,
      description,
      projectType,
      lead,
      members,
      startDate,
      endDate,
      status,
    } = req.body;

    if (!name || !key) {
      return res.status(400).json({
        success: false,
        message: "Please provide project name and key",
      });
    }

    const cleanKey = key.toUpperCase().trim();
    const existing = await Project.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Project key '${cleanKey}' already exists. Please choose a different key.`,
      });
    }

    const project = await Project.create({
      name: name.trim(),
      key: cleanKey,
      description: description || "",
      projectType: projectType || "Software",
      lead: lead || req.user._id,
      members: members && members.length > 0
        ? members
        : [{ user: req.user._id, role: req.user.role || "Project Manager" }],
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      status: status || "Active",
      issueCounter: 1, // Issues will start from 1 (e.g. FLW-1, FLW-2)
    });

    const populated = await Project.findById(project._id)
      .populate("lead", "name email username avatar role")
      .populate("members.user", "name email username avatar role");

    res.status(201).json({ success: true, project: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single project by ID or key
// @route GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { key: req.params.id.toUpperCase() };

    const project = await Project.findOne(query)
      .populate("lead", "name email username avatar role")
      .populate("members.user", "name email username avatar role");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const totalIssues = await Issue.countDocuments({ project: project._id });
    const openIssues = await Issue.countDocuments({
      project: project._id,
      status: { $in: ["BACKLOG", "TO DO", "IN PROGRESS", "IN REVIEW", "OPEN", "IN TESTING"] },
    });
    const completedIssues = await Issue.countDocuments({
      project: project._id,
      status: { $in: ["DONE", "RESOLVED", "CLOSED"] },
    });

    res.json({
      success: true,
      project: {
        ...project.toObject(),
        totalIssues,
        openIssues,
        completedIssues,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update project
// @route PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const { name, description, projectType, lead, members, startDate, endDate, status } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (projectType) project.projectType = projectType;
    if (lead) project.lead = lead;
    if (members) project.members = members;
    if (startDate) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status) project.status = status;

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("lead", "name email username avatar role")
      .populate("members.user", "name email username avatar role");

    res.json({ success: true, project: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete project
// @route DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Delete associated issues
    await Issue.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: `Project ${project.key} and its issues removed` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
