const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { hasPermission } = require("../config/roles");

/**
 * protect — verifies JWT and attaches req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — no token provided",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "flowboard_secret_key"
    );
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token verification failed",
    });
  }
};

/**
 * authorize — restricts access to one or more roles
 * Usage:  authorize("Admin", "Project Manager")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role "${req.user.role}" is not authorized to access this route`,
      });
    }
    next();
  };
};

/**
 * checkPermission — restricts access based on granular permissions
 * Usage:  checkPermission("create_project")
 *         checkPermission("manage_users", "delete_project")   // needs ALL
 */
const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    const hasAll = requiredPermissions.every((perm) =>
      hasPermission(userRole, perm)
    );

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${requiredPermissions.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize, checkPermission };
