const mongoose = require('mongoose');
const ActionHistory = require('../models/ActionHistory');
const Device = require('../models/Device');
const { getString, parsePositiveInt, parseDate } = require('../utils/query');

async function getActions(req, res) {
    const query = {};

    const deviceId = getString(req.query.device_id);
    if (deviceId) {
        const exists = await Device.exists({ device_id: deviceId });
        if (!exists) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_DEVICE', message: 'Thiết bị không hợp lệ' }
            });
        }
        query.device_id = deviceId;
    }

    const action = getString(req.query.action).toUpperCase();
    if (action) {
        if (!['ON', 'OFF'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_ACTION', message: 'action chỉ nhận ON hoặc OFF' }
            });
        }
        query.action = action;
    }

    const status = getString(req.query.status).toLowerCase();
    if (status) {
        if (!['loading', 'success', 'fail', 'timeout'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_STATUS', message: 'status không hợp lệ' }
            });
        }
        query.status = status;
    }

    const exactTimeText = getString(req.query.exact_time);
    const exactTime = exactTimeText ? parseDate(exactTimeText) : null;
    if (exactTimeText && !exactTime) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_TIME', message: 'Thời gian tìm kiếm không hợp lệ' } });
    }

    const fromText = exactTime ? exactTime.toISOString() : getString(req.query.from);
    const toText = exactTime
        ? new Date(exactTime.getTime() + 999).toISOString()
        : getString(req.query.to);
    const from = fromText ? parseDate(fromText) : null;
    const to = toText ? parseDate(toText) : null;

    if (fromText && !from) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_FROM', message: 'Thời gian bắt đầu không hợp lệ' } });
    }
    if (toText && !to) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_TO', message: 'Thời gian kết thúc không hợp lệ' } });
    }
    if (from && to && from > to) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_RANGE', message: 'Thời gian bắt đầu phải trước thời gian kết thúc' } });
    }

    if (from || to) {
        query.created_at = {};
        if (from) query.created_at.$gte = from;
        if (to) query.created_at.$lte = to;
    }

    const page = parsePositiveInt(req.query.page, 1, 1_000_000);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const sortDirection = getString(req.query.sort).toLowerCase() === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        ActionHistory.find(query).sort({ created_at: sortDirection }).skip(skip).limit(limit).lean(),
        ActionHistory.countDocuments(query)
    ]);

    res.json({
        success: true,
        data: {
            items: items.map(item => ({
                id: String(item._id),
                device_id: item.device_id,
                device_name: item.device_name,
                user_id: String(item.user_id),
                username: item.username,
                action: item.action,
                status: item.status,
                created_at: item.created_at,
                updated_at: item.updated_at
            })),
            pagination: {
                total,
                page,
                limit,
                total_pages: Math.max(1, Math.ceil(total / limit))
            }
        }
    });
}

async function getActionById(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Không tìm thấy bản ghi lịch sử' }
        });
    }

    const item = await ActionHistory.findById(req.params.id).lean();
    if (!item) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Không tìm thấy bản ghi lịch sử' }
        });
    }

    res.json({
        success: true,
        data: {
            id: String(item._id),
            device_id: item.device_id,
            device_name: item.device_name,
            user_id: String(item.user_id),
            action: item.action,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at
        }
    });
}

module.exports = { getActions, getActionById };
