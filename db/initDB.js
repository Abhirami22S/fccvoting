const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
    try {
        console.log("Running schema.sql...");
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        
        // Postgres can run multiple statements in one query if separated by semicolons
        await pool.query(schema);

        console.log("Seeding initial data...");

        // Check for admin
        const adminsResult = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin']);
        if (adminsResult.rows.length === 0) {
            const hashedAdminPass = await bcrypt.hash('admin123', 10);
            await pool.query('INSERT INTO admins (username, password) VALUES ($1, $2)', ['admin', hashedAdminPass]);
            console.log("Created default admin user (admin / admin123)");
        }

        // Check for candidates
        const candidatesResult = await pool.query('SELECT * FROM candidates');
        if (candidatesResult.rows.length === 0) {
            await pool.query('INSERT INTO candidates (name, party) VALUES ($1, $2)', ['Cloud Computing Party', 'CCP']);
            await pool.query('INSERT INTO candidates (name, party) VALUES ($1, $2)', ['Cyber Security Group', 'CSG']);
            await pool.query('INSERT INTO candidates (name, party) VALUES ($1, $2)', ['AI Innovators', 'AII']);
            console.log("Inserted default candidates.");
        }

        console.log("Database initialized successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Database initialization failed:", error);
        process.exit(1);
    }
}

initDB();
