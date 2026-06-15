import { asyncHandler } from "../utils/asyncHandler.js";
import { Board } from "../models/Board.js";
import { Task } from "../models/Task.js";
import { ROLES } from "../utils/roles.js";
import { getCache, setCache, cacheKeys } from "../services/cacheService.js";

const buildBoardFilter = (user) => {
  if (user.role === ROLES.ADMIN) return {};
  if (user.role === ROLES.PROJECT_MANAGER) return { createdBy: user._id };
  return { members: user._id };
};

const buildTaskFilter = async (user) => {
  const boardFilter = buildBoardFilter(user);
  const boards = await Board.find(boardFilter).select("_id");
  const boardIds = boards.map((b) => b._id);

  if (boardIds.length === 0) {
    return { boardId: { $in: [] } };
  }

  const filter = { boardId: { $in: boardIds } };

  if (user.role === ROLES.TEAM_MEMBER) {
    filter.assignedTo = user._id;
  }

  return filter;
};

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const cacheKey = cacheKeys.analytics(req.user._id.toString());
  const cached = await getCache(cacheKey);

  if (cached) {
    return res.status(200).json({ ...cached, cached: true });
  }

  const boardFilter = buildBoardFilter(req.user);
  const taskFilter = await buildTaskFilter(req.user);
  const now = new Date();

  const [
    totalBoards,
    totalTasks,
    overdueTasks,
    tasksByStatus,
    tasksByPriority,
  ] = await Promise.all([
    Board.countDocuments(boardFilter),
    Task.countDocuments(taskFilter),
    Task.countDocuments({
      ...taskFilter,
      dueDate: { $lt: now },
      status: { $ne: "done" },
    }),
    Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
  ]);

  const analytics = {
    totalBoards,
    totalTasks,
    overdueTasks,
    tasksByStatus: Object.fromEntries(
      tasksByStatus.map((s) => [s._id, s.count]),
    ),
    tasksByPriority: Object.fromEntries(
      tasksByPriority.map((p) => [p._id, p.count]),
    ),
  };

  const response = { success: true, analytics };
  await setCache(cacheKey, response, 120);

  return res.status(200).json(response);
});
