import { ApiError } from "../utils/apiError.js";
import { ROLES } from "../utils/roles.js";

/**
 * Restrict route access to specific roles.
 * Must be used after authMiddleware.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to access this resource"),
      );
    }

    next();
  };
};

export const adminOnly = authorizeRoles(ROLES.ADMIN);

export default authorizeRoles;
