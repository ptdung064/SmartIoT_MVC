require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');
const Sensor = require('../models/Sensor');
const Device = require('../models/Device');
const { hashPassword } = require('../utils/password');

async function seed() {
    await connectDB();

    await Sensor.bulkWrite([
        {
            updateOne: {
                filter: { sensor_id: 1 },
                update: { $set: { sensor_name: 'Nhiệt độ', sensor_type: 'temperature', unit: '°C' } },
                upsert: true
            }
        },
        {
            updateOne: {
                filter: { sensor_id: 2 },
                update: { $set: { sensor_name: 'Độ ẩm', sensor_type: 'humidity', unit: '%' } },
                upsert: true
            }
        },
        {
            updateOne: {
                filter: { sensor_id: 3 },
                update: { $set: { sensor_name: 'Ánh sáng', sensor_type: 'light', unit: 'Lux' } },
                upsert: true
            }
        }
    ]);

    await Device.bulkWrite([
        {
            updateOne: {
                filter: { device_id: 'led_1' },
                update: { $set: { device_name: 'Đèn LED 1', mqtt_key: 'led1' }, $setOnInsert: { current_status: 'OFF' } },
                upsert: true
            }
        },
        {
            updateOne: {
                filter: { device_id: 'led_2' },
                update: { $set: { device_name: 'Đèn LED 2', mqtt_key: 'led2' }, $setOnInsert: { current_status: 'OFF' } },
                upsert: true
            }
        },
        {
            updateOne: {
                filter: { device_id: 'led_3' },
                update: { $set: { device_name: 'Đèn LED 3', mqtt_key: 'led3' }, $setOnInsert: { current_status: 'OFF' } },
                upsert: true
            }
        }
    ]);

    const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existing = await User.findOne({ username });
    if (!existing) {
        await User.create({
            username,
            password_hash: hashPassword(password),
            full_name: process.env.ADMIN_FULL_NAME || 'Phạm Tiến Dũng',
            student_id: process.env.ADMIN_STUDENT_ID || 'B23DCAT064'
        });
        console.log(`[SEED] Created user: ${username}`);
    } else {
        console.log(`[SEED] User already exists: ${username}`);
    }

    console.log('[SEED] Sensors and devices are ready.');
    process.exit(0);
}

seed().catch(error => {
    console.error('[SEED] Error:', error);
    process.exit(1);
});
