const mqtt = require('mqtt');
const DataSensor = require('../models/DataSensor');
const Device = require('../models/Device');
const ActionHistory = require('../models/ActionHistory');
const { roundToTwo } = require('../utils/query');

function sensorDocsFromPayload(payload, recordedAt) {
    const temperature = roundToTwo(Number(payload.temperature ?? payload.temp));
    const humidity = roundToTwo(Number(payload.humidity ?? payload.humid));
    const light = roundToTwo(Number(payload.light));

    if (![temperature, humidity, light].every(Number.isFinite)) {
        return null;
    }

    return {
        aggregate: { temperature, humidity, light, recorded_at: recordedAt },
        docs: [
            { sensor_id: 1, sensor_name: 'Nhiệt độ', sensor_type: 'temperature', unit: '°C', value: temperature, recorded_at: recordedAt },
            { sensor_id: 2, sensor_name: 'Độ ẩm', sensor_type: 'humidity', unit: '%', value: humidity, recorded_at: recordedAt },
            { sensor_id: 3, sensor_name: 'Ánh sáng', sensor_type: 'light', unit: 'Lux', value: light, recorded_at: recordedAt }
        ]
    };
}

async function updateOneDevice(io, payload) {
    const deviceId = String(payload.device_id || '').trim();
    if (!deviceId) return;

    const device = await Device.findOne({ device_id: deviceId });
    if (!device) return;

    const rawStatus = String(payload.status ?? payload.action ?? '').trim().toUpperCase();
    const currentStatus = ['ON', 'OFF'].includes(rawStatus) ? rawStatus : device.current_status;

    const result = String(payload.result || 'success').trim().toLowerCase();
    const historyStatus = result === 'success' ? 'success' : 'fail';

    if (['ON', 'OFF'].includes(currentStatus)) {
        device.current_status = currentStatus;
        device.last_action_at = new Date();
        await device.save();
    }

    const history = await ActionHistory.findOne({
        device_id: deviceId,
        status: 'loading'
    }).sort({ created_at: -1 });

    if (history) {
        history.status = (historyStatus === 'success' && history.action === currentStatus)
            ? 'success'
            : 'fail';
        await history.save();
    }

    io.emit('device:status', {
        device_id: deviceId,
        action: history?.action || currentStatus,
        status: history?.status || historyStatus,
        current_status: device.current_status,
        action_id: history ? String(history._id) : null
    });
}

async function updateDevicesFromKeyMap(io, payload) {
    const devices = await Device.find().lean();

    for (const device of devices) {
        if (!Object.prototype.hasOwnProperty.call(payload, device.mqtt_key)) continue;

        const status = String(payload[device.mqtt_key] || '').trim().toUpperCase();
        if (!['ON', 'OFF'].includes(status)) continue;

        await updateOneDevice(io, {
            device_id: device.device_id,
            status,
            result: 'success'
        });
    }
}

function setupMQTT(io) {
    const brokerUrl = process.env.MQTT_BROKER || 'mqtt://127.0.0.1:1883';
    const sensorTopic = process.env.MQTT_SENSOR_TOPIC || 'home/sensors/data';
    const statusTopic = process.env.MQTT_STATUS_TOPIC || 'home/devices/status';

    const mqttUsername = process.env.MQTT_USERNAME || undefined;
    const mqttPassword = process.env.MQTT_PASSWORD || undefined;

    const client = mqtt.connect(brokerUrl, {
        username: mqttUsername,
        password: mqttPassword,
        reconnectPeriod: 3000,
        connectTimeout: 5000
    });

    client.on('connect', () => {
        console.log(`[MQTT] Connected: ${brokerUrl}`);
        client.subscribe([sensorTopic, statusTopic], { qos: 1 }, error => {
            if (error) console.error('[MQTT] Subscribe error:', error.message);
        });
    });

    client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));
    client.on('offline', () => console.log('[MQTT] Offline'));
    client.on('error', error => console.error('[MQTT] Error:', error.message));

    client.on('message', async (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());

            if (topic === sensorTopic) {
                const recordedAt = payload.recorded_at ? new Date(payload.recorded_at) : new Date();
                const normalized = sensorDocsFromPayload(payload, recordedAt);

                if (!normalized || Number.isNaN(recordedAt.getTime())) {
                    console.warn('[MQTT] Invalid sensor payload:', payload);
                    return;
                }

                await DataSensor.insertMany(normalized.docs);
                io.emit('sensor:update', normalized.aggregate);
                return;
            }

            if (topic === statusTopic) {
                if (payload.device_id) {
                    await updateOneDevice(io, payload);
                } else {
                    await updateDevicesFromKeyMap(io, payload);
                }
            }
        } catch (error) {
            console.error('[MQTT] Message handling error:', error.message);
        }
    });

    return client;
}

module.exports = setupMQTT;
