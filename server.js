require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const pool = require('./db/db');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Cloud Observability: Structured HTTP Request Logging
// Simulated AWS CloudWatch metric logging (Combined format captures IP, Status, User-Agent, Bytes)
app.use(morgan('combined'));

// 2. Cloud Security Headers: Helmet defends against common web vulnerabilities (XSS, Clickjacking)
app.use(helmet({
    contentSecurityPolicy: false // Disabled locally so CDN scripts like Chart.js still load easily
}));

// 3. DDoS Protection & Rate Limiting: Essential for public internet facing Cloud APIs
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // Limit each IP to 100 requests per `window`
    message: { message: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Apply the rate limiting middleware strictly to API calls
app.use('/api', limiter);

// Standard Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Cloud Target Group Health Check (AWS ALB / ELB)
// AWS Load Balancers will repeatedly ping this endpoint to ensure the EC2 instance is healthy.
// If it fails, AWS kills the instance and spins up a new one seamlessly.
app.get('/api/health', async (req, res) => {
    try {
        // Confirm Database (PaaS) is strongly connected before reporting healthy
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'HEALTHY', message: 'EC2 Compute and RDS System Operational' });
    } catch (error) {
        console.error("Health Check Failed - DB Error:", error);
        res.status(503).json({ status: 'UNHEALTHY', message: 'Database connection failed' });
    }
});

// Static files (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Core Architecture API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/votes', require('./routes/voteRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Fallback for unknown api routes
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API Route Not Found' });
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Cloud Server scaling up on internal port ${PORT}`);
    console.log(`Health Check Target active at http://localhost:${PORT}/api/health`);
});

// 5. Cloud Auto-Scaling Graceful Shutdown Handling (SIGINT/SIGTERM)
// When AWS Auto-Scaling scales down, it sends a kill signal. We must safely close DB connections first
// to prevent data chunking or lost MySQL connections.
function gracefulShutdown(signal) {
    console.log(`Received ${signal}. Gracefully shutting down cloud node...`);
    server.close(async () => {
        console.log("HTTP server closed. Terminating Database connection pool...");
        try {
            await pool.end();
            console.log("Amazon RDS connections safely closed.");
            process.exit(0);
        } catch (err) {
            console.error("Error shutting down database pool", err);
            process.exit(1);
        }
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
