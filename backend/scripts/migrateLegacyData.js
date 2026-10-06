require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DataSensor = require('../models/DataSensor');

async function migrate() {
    await connectDB();

    const db = mongoose.connection.db;
    const legacy = db.collection('datasensors');

    const cursor = legacy.find({
        temperature: { $exists: true },
        humidity: { $exists: true },
        light: { $exists: true }
    });

    let migratedGroups = 0;

    while (await cursor.hasNext()) {
        const item = await cursor.next();
        const recordedAt = item.timestamp || item.createdAt || new Date();

        const alreadyExists = await DataSensor.exists({
            recorded_at: new Date(recordedAt),
            sensor_id: 1
        });

        if (alreadyExists) continue;

        await DataSensor.insertMany([
            { sensor_id: 1, sensor_name: 'Nhiệt độ', sensor_type: 'temperature', unit: '°C', value: Number(item.temperature), recorded_at: recordedAt },
            { sensor_id: 2, sensor_name: 'Độ ẩm', sensor_type: 'humidity', unit: '%', value: Number(item.humidity), recorded_at: recordedAt },
            { sensor_id: 3, sensor_name: 'Ánh sáng', sensor_type: 'light', unit: 'Lux', value: Number(item.light), recorded_at: recordedAt }
        ]);

        migratedGroups += 1;
    }

    console.log(`[MIGRATE] Migrated ${migratedGroups} legacy reading groups.`);
    process.exit(0);
}

migrate().catch(error => {
    console.error('[MIGRATE] Error:', error);
    process.exit(1);
});
