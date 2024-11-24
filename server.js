require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { initializeRealtime } = require('./services/websocket');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://agrilink.local:3000'],
    credentials: true
}));

app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', registrationRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
// Error handling
app.use(errorHandler);

// Handle all other routes by serving a generic index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const startServer = (port) => {
    return new Promise((resolve, reject) => {
        const server = app.listen(port, HOST)
            .once('listening', () => {
                console.log(`Server running on http://agrilink.local:${port}`);
                console.log(`Access the application at http://agrilink.local:${port}`);
                resolve(server);
            })
            .once('error', (err) => {
                reject(err);
            });
    });
};

const tryPorts = async () => {
    const ports = [PORT, 3001, 3002, 3003];
    
    for (const port of ports) {
        try {
            await startServer(port);
            return;
        } catch (err) {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is in use, trying next port...`);
                continue;
            }
            throw err;
        }
    }
    throw new Error('No available ports found');
};

tryPorts().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});