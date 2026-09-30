const Sprint = require("../models/Sprint");
const Issue = require("../models/Issue");

// @desc Get sprints by project
// @route GET /api/sprints
exports.getSprints = async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = {};
    if (projectId) query.project = projectId;

    const sprints = await Sprint.find(query).sort({ createdAt: -1 });
    res.json({ success: true, sprints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create sprint
// @route POST /api/sprints
exports.createSprint = async (req, res) => {
  try {
    const { name, goal, startDate, endDate, projectId } = req.body;

    const sprint = await Sprint.create({
      name,
      goal,
      startDate,
      endDate,
      project: projectId,
      status: "future",
    });

    res.status(201).json({ success: true, sprint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Start sprint
// @route PUT /api/sprints/:id/start
exports.startSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint not found" });
    }

    sprint.status = "active";
    if (req.body.startDate) sprint.startDate = req.body.startDate;
    if (req.body.endDate) sprint.endDate = req.body.endDate;

    await sprint.save();

    res.json({ success: true, sprint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Complete sprint
// @route PUT /api/sprints/:id/complete
exports.completeSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint not found" });
    }

    sprint.status = "completed";
    await sprint.save();

    // Move incomplete issues back to backlog
    await Issue.updateMany(
      { sprint: sprint._id, status: { $ne: "DONE" } },
      { $set: { sprint: null } }
    );

    res.json({ success: true, sprint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
