const express = require("express");
const { getUsers, updateUserRole, updateProfile } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getUsers);
router.put("/profile", updateProfile);
router.put("/:id/role", authorize("Admin"), updateUserRole);

module.exports = router;
