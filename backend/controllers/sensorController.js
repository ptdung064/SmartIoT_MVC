const mongoose = require('mongoose');
const Sensor = require('../models/Sensor');
const DataSensor = require('../models/DataSensor');
const { getString, parsePositiveInt, parseNumber, roundToTwo, parseDate } = require('../utils/query');

async function getSensors(req, res) {
    const sensors = await Sensor.find().sort({ sensor_id: 1 }).lean();
    res.json({
        success: true,
        data: sensors.map(sensor => ({
            id: sensor.sensor_id,
            name: sensor.sensor_name,
            type: sensor.sensor_type,
            unit: sensor.unit
        }))
    });
}

async function getDataSensorHistory(req, res) {
    const query = {};

    const sensorIdText = getString(req.query.sensor_id);
    if (sensorIdText) {
        const sensorId = Number.parseInt(sensorIdText, 10);
        if (![1, 2, 3].includes(sensorId)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_SENSOR', message: 'sensor_id chỉ nhận 1, 2 hoặc 3' }
            });
        }
        query.sensor_id = sensorId;
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
        query.recorded_at = {};
        if (from) query.recorded_at.$gte = from;
        if (to) query.recorded_at.$lte = to;
    }

    const exactValueText = getString(req.query.exact_value);
    const exactValue = exactValueText ? parseNumber(exactValueText) : null;

    if (exactValueText && exactValue === null) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_VALUE', message: 'exact_value không hợp lệ' } });
    }
    if (exactValue !== null) {
        query.value = roundToTwo(exactValue);
    }

    const page = parsePositiveInt(req.query.page, 1, 1_000_000);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const sortText = getString(req.query.sort).toLowerCase();
    const sortDirection = sortText === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        DataSensor.find(query).sort({ recorded_at: sortDirection }).skip(skip).limit(limit).lean(),
        DataSensor.countDocuments(query)
    ]);

    res.json({
        success: true,
        data: {
            items: items.map(item => ({
                id: String(item._id),
                sensor_id: item.sensor_id,
                sensor_name: item.sensor_name,
                sensor_type: item.sensor_type,
                unit: item.unit,
                value: roundToTwo(item.value),
                recorded_at: item.recorded_at
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

async function getDataSensorById(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy bản ghi' } });
    }

    const item = await DataSensor.findById(req.params.id).lean();
    if (!item) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Không tìm thấy bản ghi' } });
    }

    res.json({
        success: true,
        data: {
            id: String(item._id),
            sensor_id: item.sensor_id,
            sensor_name: item.sensor_name,
            unit: item.unit,
            value: roundToTwo(item.value),
            recorded_at: item.recorded_at
        }
    });
}

async function createDataSensor(req, res) {
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey && req.headers['x-internal-key'] !== internalKey) {
        return res.status(401).json({
            success: false,
            error: { code: 'INVALID_INTERNAL_KEY', message: 'Internal key không hợp lệ' }
        });
    }

    const temperature = roundToTwo(Number(req.body?.temperature ?? req.body?.temp));
    const humidity = roundToTwo(Number(req.body?.humidity ?? req.body?.humid));
    const light = roundToTwo(Number(req.body?.light));

    if (![temperature, humidity, light].every(Number.isFinite)) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_PAYLOAD', message: 'Payload cần temperature/temp, humidity/humid và light' }
        });
    }

    const recordedAt = req.body?.recorded_at ? new Date(req.body.recorded_at) : new Date();
    if (Number.isNaN(recordedAt.getTime())) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_TIME', message: 'recorded_at không hợp lệ' } });
    }

    const docs = [
        { sensor_id: 1, sensor_name: 'Nhiệt độ', sensor_type: 'temperature', unit: '°C', value: temperature, recorded_at: recordedAt },
        { sensor_id: 2, sensor_name: 'Độ ẩm', sensor_type: 'humidity', unit: '%', value: humidity, recorded_at: recordedAt },
        { sensor_id: 3, sensor_name: 'Ánh sáng', sensor_type: 'light', unit: 'Lux', value: light, recorded_at: recordedAt }
    ];

    await DataSensor.insertMany(docs);

    const io = req.app.locals.io;
    if (io) {
        io.emit('sensor:update', { temperature, humidity, light, recorded_at: recordedAt });
    }

    res.status(201).json({
        success: true,
        message: 'Dữ liệu cảm biến đã được lưu',
        data: { inserted_count: 3 }
    });
}

module.exports = {
    getSensors,
    getDataSensorHistory,
    getDataSensorById,
    createDataSensor
};
