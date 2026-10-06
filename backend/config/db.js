const mongoose = require('mongoose');

async function connectDB() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iot_db';
    const connection = await mongoose.connect(mongoUri);
    console.log(`[DB] MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
}

module.exports = connectDB;
