const express = require("express");
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
const { PERMISSIONS } = require("../config/roles");

const router = express.Router();

router.use(protect);

router.get("/", getProjects);
router.post("/", checkPermission(PERMISSIONS.CREATE_PROJECT), createProject);
router.get("/:id", getProjectById);
router.put("/:id", checkPermission(PERMISSIONS.MANAGE_PROJECT), updateProject);
router.delete("/:id", checkPermission(PERMISSIONS.DELETE_PROJECT), deleteProject);

module.exports = router;
