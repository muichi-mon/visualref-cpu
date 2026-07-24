const express = require('express');
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const app = express();

// Allow JSON from the browser
app.use(express.json());

// Serve your HTML/CSS/JS files
app.use(express.static(__dirname));

// ===== MYSQL CONNECTION =====
// Pulled from environment variables (see .env.example) instead of hardcoded
// in source, so credentials aren't checked into version control.
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'visualref'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection failed:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

// ===== SAVE SURVEY =====
app.post('/submitSurvey', (req, res) => {
  const r = req.body;

  const sql = `
    INSERT INTO survey_responses (
      participant_id,
      time_taken_seconds,
      search_button_clicks,
      apply_feedback_clicks,
      initial_search_easy,
      initial_search_useful,
      bbox_easy,
      bbox_useful,
      relirr_easy,
      relirr_useful,
      apply_easy,
      apply_useful,
      overall_useful,
      overall_easy,
      better_than_text,
      likelihood,
      comments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    r.participant_id || null,
    r.time_taken_seconds ?? null,
    r.search_button_clicks ?? null,
    r.apply_feedback_clicks ?? null,
    r.initial_search_easy,
    r.initial_search_useful,
    r.bbox_easy,
    r.bbox_useful,
    r.relirr_easy,
    r.relirr_useful,
    r.apply_easy,
    r.apply_useful,
    r.overall_useful,
    r.overall_easy,
    r.better_than_text,
    r.likelihood,
    r.comments
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }

    res.json({ success: true });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});