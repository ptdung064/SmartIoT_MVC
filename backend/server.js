require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const setupMQTT = require('./services/mqttService');
const { notFound, errorHandler } = require('./middleware/errorHandler');

async function start() {
    await connectDB();

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: { origin: true, credentials: true }
    });

    app.locals.io = io;

    app.use(cors());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: false }));

    const mqttClient = setupMQTT(io);
    app.locals.mqttClient = mqttClient;

    app.use('/api/v1', apiRoutes);

    const frontendDir = path.join(__dirname, '..', 'frontend');
    app.use(express.static(frontendDir));

    app.get('/login', (req, res) => {
        res.sendFile(path.join(frontendDir, 'login.html'));
    });

    app.get('/', (req, res) => {
        res.sendFile(path.join(frontendDir, 'index.html'));
    });

    app.use('/api', notFound);

    app.get('*path', (req, res) => {
        res.sendFile(path.join(frontendDir, 'index.html'));
    });

    app.use(errorHandler);

    const port = Number(process.env.PORT || 3000);
    server.listen(port, () => {
        console.log(`[SERVER] http://localhost:${port}`);
        console.log(`[SERVER] API base: http://localhost:${port}/api/v1`);
    });
}

start().catch(error => {
    console.error('[STARTUP ERROR]', error);
    process.exit(1);
});
