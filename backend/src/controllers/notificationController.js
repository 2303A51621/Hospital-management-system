const Notification = require('../models/Notification');
const { list, asyncHandler } = require('./_helpers');
exports.getNotifications = list(Notification, { filter: (req) => ({ userId: req.user._id }) });
exports.markNotificationRead = asyncHandler(async (req, res) => res.json({ success: true, data: await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true }) }));
exports.markAllNotificationsRead = asyncHandler(async (req, res) => { await Notification.updateMany({ userId: req.user._id }, { isRead: true }); res.json({ success: true }); });