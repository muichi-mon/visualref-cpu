CREATE DATABASE IF NOT EXISTS visualref;

USE visualref;

CREATE TABLE IF NOT EXISTS survey_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
	
    participant_id VARCHAR(64),

    -- Time (in seconds) spent in the retrieval app: from being redirected in
    -- until clicking "Finish task -> Continue to survey"
    time_taken_seconds INT,

    -- Implicit behavioral data captured in the retrieval app
    search_button_clicks INT,
    apply_feedback_clicks INT,
    
    -- Initial Search
    initial_search_easy TINYINT,
    initial_search_useful TINYINT,

    -- Bounding Boxes
    bbox_easy TINYINT,
    bbox_useful TINYINT,

    -- Relevant / Irrelevant
    relirr_easy TINYINT,
    relirr_useful TINYINT,

    -- Applying Feedback
    apply_easy TINYINT,
    apply_useful TINYINT,

    -- Overall
    overall_useful TINYINT,
    overall_easy TINYINT,
    better_than_text ENUM('Yes','No'),
    likelihood TINYINT,

    -- Optional comments
    comments TEXT,

    -- Timestamp
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
