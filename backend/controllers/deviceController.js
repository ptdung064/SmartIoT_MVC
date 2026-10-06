const Device = require('../models/Device');
const ActionHistory = require('../models/ActionHistory');

async function getDevices(req, res) {
    const devices = await Device.find().sort({ device_id: 1 }).lean();

    res.json({
        success: true,
        data: devices.map(device => ({
            id: device.device_id,
            name: device.device_name,
            mqtt_key: device.mqtt_key,
            current_status: device.current_status,
            last_action_at: device.last_action_at
        }))
    });
}

async function controlDevice(req, res) {
    const deviceId = String(req.params.id || '').trim();
    const action = String(req.body?.action || '').trim().toUpperCase();

    if (!['ON', 'OFF'].includes(action)) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_ACTION', message: "Giá trị action phải là 'ON' hoặc 'OFF'" }
        });
    }

    const device = await Device.findOne({ device_id: deviceId });
    if (!device) {
        return res.status(404).json({
            success: false,
            error: { code: 'DEVICE_NOT_FOUND', message: 'Không tìm thấy thiết bị' }
        });
    }

    const mqttClient = req.app.locals.mqttClient;
    if (!mqttClient || !mqttClient.connected) {
        return res.status(503).json({
            success: false,
            error: { code: 'MQTT_DISCONNECTED', message: 'MQTT Broker chưa kết nối' }
        });
    }

    const history = await ActionHistory.create({
        device_id: device.device_id,
        device_name: device.device_name,
        user_id: req.user._id,
        username: req.user.username,
        action,
        status: 'loading'
    });

    device.current_status = 'LOADING';
    device.last_action_at = new Date();
    await device.save();

    const payload = {
        device_id: device.device_id,
        action
    };

    const controlTopic = process.env.MQTT_CONTROL_TOPIC || 'home/devices/control';

    mqttClient.publish(controlTopic, JSON.stringify(payload), { qos: 1 }, async error => {
        if (error) {
            history.status = 'fail';
            await history.save().catch(() => {});
        }
    });

    const timeoutMs = Math.max(Number(process.env.DEVICE_TIMEOUT_MS || 10000), 1000);
    setTimeout(async () => {
        try {
            const pending = await ActionHistory.findById(history._id);
            if (pending && pending.status === 'loading') {
                pending.status = 'timeout';
                await pending.save();

                const currentDevice = await Device.findOne({ device_id: device.device_id });
                if (currentDevice && currentDevice.current_status === 'LOADING') {
                    currentDevice.current_status = 'UNKNOWN';
                    await currentDevice.save();
                }

                req.app.locals.io?.emit('device:status', {
                    device_id: device.device_id,
                    action,
                    status: 'timeout',
                    current_status: 'UNKNOWN',
                    action_id: String(history._id)
                });
            }
        } catch (error) {
            console.error('[DEVICE TIMEOUT]', error.message);
        }
    }, timeoutMs);

    res.status(202).json({
        success: true,
        message: 'Lệnh điều khiển đã được gửi',
        data: {
            action_id: String(history._id),
            device_id: device.device_id,
            device_name: device.device_name,
            action,
            status: 'loading',
            created_at: history.created_at
        }
    });
}

async function updateDeviceStatusInternal(req, res) {
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey && req.headers['x-internal-key'] !== internalKey) {
        return res.status(401).json({
            success: false,
            error: { code: 'INVALID_INTERNAL_KEY', message: 'Internal key không hợp lệ' }
        });
    }

    const deviceId = String(req.params.id || '').trim();
    const status = String(req.body?.status || '').trim().toUpperCase();
    const result = String(req.body?.result || 'success').trim().toLowerCase();

    if (!['ON', 'OFF'].includes(status)) {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_STATUS', message: 'status phải là ON hoặc OFF' }
        });
    }

    const device = await Device.findOne({ device_id: deviceId });
    if (!device) {
        return res.status(404).json({
            success: false,
            error: { code: 'DEVICE_NOT_FOUND', message: 'Không tìm thấy thiết bị' }
        });
    }

    device.current_status = status;
    device.last_action_at = new Date();
    await device.save();

    const history = await ActionHistory.findOne({ device_id: deviceId, status: 'loading' }).sort({ created_at: -1 });
    if (history) {
        history.status = result === 'success' ? 'success' : 'fail';
        await history.save();
    }

    req.app.locals.io?.emit('device:status', {
        device_id: deviceId,
        action: history?.action || status,
        status: history?.status || (result === 'success' ? 'success' : 'fail'),
        current_status: status,
        action_id: history ? String(history._id) : null
    });

    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
}

module.exports = { getDevices, controlDevice, updateDeviceStatusInternal };
