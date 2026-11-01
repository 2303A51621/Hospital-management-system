const mongoose = require('mongoose');

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const validId = (value) => mongoose.Types.ObjectId.isValid(value);

const list = (Model, options = {}) =>
  asyncHandler(async (req, res) => {
    const filter = options.filter ? options.filter(req) : {};
    const documents = await Model.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: documents, count: documents.length });
  });

const getById = (Model, options = {}) =>
  asyncHandler(async (req, res, next) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const query = Model.findById(req.params.id);
    const document = await (options.populate ? query.populate(options.populate) : query);
    if (!document) return res.status(404).json({ message: `${options.name || 'Record'} not found` });
    res.json({ success: true, data: document });
  });

const create = (Model, options = {}) =>
  asyncHandler(async (req, res) => {
    const document = await Model.create(options.transform ? options.transform(req.body, req) : req.body);
    res.status(201).json({ success: true, data: document });
  });

const updateById = (Model, options = {}) =>
  asyncHandler(async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!document) return res.status(404).json({ message: `${options.name || 'Record'} not found` });
    res.json({ success: true, data: document });
  });

const removeById = (Model, options = {}) =>
  asyncHandler(async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).json({ message: `${options.name || 'Record'} not found` });
    res.json({ success: true, message: 'Deleted successfully' });
  });

module.exports = { asyncHandler, validId, list, getById, create, updateById, removeById };