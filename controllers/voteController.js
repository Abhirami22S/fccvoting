const pool = require('../db/db');

exports.getCandidates = async (req, res) => {
    try {
        const result = await pool.query('SELECT candidate_id, name, party, votes FROM candidates');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get Candidates Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.castVote = async (req, res) => {
    const client = await pool.connect();
    try {
        const voterId = req.user.id; // from JWT middleware
        const { candidateId } = req.body;

        if (!candidateId) {
            return res.status(400).json({ message: 'Candidate ID is required' });
        }

        await client.query('BEGIN');

        // Check if voter has already voted (lock row just in case)
        const voterResult = await client.query('SELECT has_voted FROM voters WHERE voter_id = $1 FOR UPDATE', [voterId]);
        if (voterResult.rows.length === 0) {
            throw new Error('Voter not found');
        }

        if (voterResult.rows[0].has_voted) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'You have already cast your vote.' });
        }

        // Insert vote
        await client.query('INSERT INTO votes (voter_id, candidate_id) VALUES ($1, $2)', [voterId, candidateId]);

        // Increment candidate vote count
        await client.query('UPDATE candidates SET votes = votes + 1 WHERE candidate_id = $1', [candidateId]);

        // Mark voter as voted
        await client.query('UPDATE voters SET has_voted = TRUE WHERE voter_id = $1', [voterId]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Vote successfully cast!' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Cast Vote Error:', error);
        res.status(500).json({ message: 'Internal server error while casting vote' });
    } finally {
        client.release();
    }
};
