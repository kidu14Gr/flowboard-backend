const express = require("express");
const {
  getSprints,
  createSprint,
  startSprint,
  completeSprint,
} = require("../controllers/sprintController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
const { PERMISSIONS } = require("../config/roles");

const router = express.Router();

router.use(protect);

router.get("/", getSprints);
router.post("/", checkPermission(PERMISSIONS.CREATE_SPRINT), createSprint);
router.put("/:id/start", checkPermission(PERMISSIONS.CREATE_SPRINT), startSprint);
router.put("/:id/complete", checkPermission(PERMISSIONS.CREATE_SPRINT), completeSprint);

module.exports = router;
