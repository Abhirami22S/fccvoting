const pool = require('../db/db');

exports.getStats = async (req, res) => {
    try {
        const voterStatsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_voters,
                SUM(CASE WHEN has_voted = TRUE THEN 1 ELSE 0 END) as voted_count
            FROM voters
        `);
        
        const candidatesResult = await pool.query('SELECT candidate_id, name, party, votes FROM candidates ORDER BY votes DESC');
        
        res.status(200).json({
            voters: voterStatsResult.rows[0],
            candidates: candidatesResult.rows
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.addCandidate = async (req, res) => {
    try {
        const { name, party } = req.body;
        if (!name || !party) {
            return res.status(400).json({ message: 'Name and party are required' });
        }

        await pool.query('INSERT INTO candidates (name, party) VALUES ($1, $2)', [name, party]);
        res.status(201).json({ message: 'Candidate added successfully' });
    } catch (error) {
        console.error('Add Candidate Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Delete votes first due to foreign key constraint
        await pool.query('DELETE FROM votes WHERE candidate_id = $1', [id]);
        const candResult = await pool.query('DELETE FROM candidates WHERE candidate_id = $1', [id]);
        
        if (candResult.rowCount === 0) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        res.status(200).json({ message: 'Candidate deleted successfully' });
    } catch (error) {
        console.error('Delete Candidate Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getVoters = async (req, res) => {
    try {
        // Don't send passwords
        const result = await pool.query('SELECT voter_id, name, email, has_voted FROM voters');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get Voters Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
