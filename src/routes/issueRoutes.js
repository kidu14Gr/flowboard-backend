const express = require("express");
const {
  getIssues,
  getIssueByIdOrKey,
  createIssue,
  updateIssue,
  deleteIssue,
  addComment,
  editComment,
  deleteComment,
  addAttachment,
  deleteAttachment,
} = require("../controllers/issueController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
const { PERMISSIONS } = require("../config/roles");

const router = express.Router();

router.use(protect);

router.get("/", getIssues);
router.post("/", checkPermission(PERMISSIONS.CREATE_ISSUE), createIssue);
router.get("/:idOrKey", getIssueByIdOrKey);
router.put("/:id", checkPermission(PERMISSIONS.UPDATE_ISSUE), updateIssue);
router.delete("/:id", checkPermission(PERMISSIONS.DELETE_ISSUE), deleteIssue);

// Comments
router.post("/:id/comments", checkPermission(PERMISSIONS.ADD_COMMENT), addComment);
router.put("/:id/comments/:commentId", checkPermission(PERMISSIONS.ADD_COMMENT), editComment);
router.delete("/:id/comments/:commentId", checkPermission(PERMISSIONS.ADD_COMMENT), deleteComment);

// Attachments
router.post("/:id/attachments", checkPermission(PERMISSIONS.UPLOAD_ATTACHMENT), addAttachment);
router.delete("/:id/attachments/:attachmentId", checkPermission(PERMISSIONS.UPLOAD_ATTACHMENT), deleteAttachment);

module.exports = router;
