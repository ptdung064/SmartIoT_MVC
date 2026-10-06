const DataSensor = require('../models/DataSensor');
const { roundToTwo } = require('../utils/query');

const SENSOR_META = {
    1: { sensor_id: 1, sensor_name: 'Nhiệt độ', sensor_type: 'temperature', unit: '°C' },
    2: { sensor_id: 2, sensor_name: 'Độ ẩm', sensor_type: 'humidity', unit: '%' },
    3: { sensor_id: 3, sensor_name: 'Ánh sáng', sensor_type: 'light', unit: 'Lux' }
};

async function getLatest(req, res) {
    const latest = await Promise.all(
        [1, 2, 3].map(sensor_id =>
            DataSensor.findOne({ sensor_id }).sort({ recorded_at: -1 }).lean()
        )
    );

    const data = latest.map((item, index) => {
        const meta = SENSOR_META[index + 1];
        return {
            sensor_id: meta.sensor_id,
            sensor_name: meta.sensor_name,
            sensor_type: meta.sensor_type,
            unit: meta.unit,
            value: item ? roundToTwo(item.value) : null,
            recorded_at: item ? item.recorded_at : null
        };
    });

    res.json({ success: true, data });
}

async function getChart(req, res) {
    const requestedSensorId = Number.parseInt(req.query.sensor_id, 10);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);

    let from = req.query.from ? new Date(req.query.from) : null;
    let to = req.query.to ? new Date(req.query.to) : null;

    if (from && Number.isNaN(from.getTime())) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_FROM', message: 'from không hợp lệ' } });
    }
    if (to && Number.isNaN(to.getTime())) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_TO', message: 'to không hợp lệ' } });
    }
    if (from && to && from > to) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_RANGE', message: 'from phải nhỏ hơn hoặc bằng to' } });
    }

    const timeQuery = {};
    if (from) timeQuery.$gte = from;
    if (to) timeQuery.$lte = to;

    async function loadSensor(sensor_id) {
        const query = { sensor_id };
        if (Object.keys(timeQuery).length) query.recorded_at = timeQuery;

        const rows = await DataSensor.find(query)
            .sort({ recorded_at: -1 })
            .limit(limit)
            .lean();

        rows.reverse();
        const meta = SENSOR_META[sensor_id];

        return {
            sensor_id,
            sensor_name: meta.sensor_name,
            sensor_type: meta.sensor_type,
            unit: meta.unit,
            points: rows.map(row => ({
                value: roundToTwo(row.value),
                recorded_at: row.recorded_at
            }))
        };
    }

    if ([1, 2, 3].includes(requestedSensorId)) {
        const data = await loadSensor(requestedSensorId);
        return res.json({ success: true, data });
    }

    const [temperature, humidity, light] = await Promise.all([
        loadSensor(1),
        loadSensor(2),
        loadSensor(3)
    ]);

    res.json({
        success: true,
        data: { temperature, humidity, light }
    });
}

module.exports = { getLatest, getChart };
