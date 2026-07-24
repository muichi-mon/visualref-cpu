/* ============================================================
   VisualRef — Final Survey behavior
   ============================================================ */

const urlParams = new URLSearchParams(window.location.search);
const participantId = urlParams.get("participant_id") || null;

// Time (in seconds) the participant spent in the retrieval app, from being
// redirected in until clicking "Finish task -> Continue to survey".
const rawTimeTaken = urlParams.get("time_taken_seconds");
const timeTakenSeconds = rawTimeTaken !== null && !Number.isNaN(Number(rawTimeTaken))
  ? Number(rawTimeTaken)
  : null;

// Implicit behavioral counts captured in the retrieval app.
const rawSearchClicks = urlParams.get("search_button_clicks");
const searchButtonClicks = rawSearchClicks !== null && !Number.isNaN(Number(rawSearchClicks))
  ? Number(rawSearchClicks)
  : null;

const rawApplyFeedbackClicks = urlParams.get("apply_feedback_clicks");
const applyFeedbackClicks = rawApplyFeedbackClicks !== null && !Number.isNaN(Number(rawApplyFeedbackClicks))
  ? Number(rawApplyFeedbackClicks)
  : null;

document.addEventListener("DOMContentLoaded", () => {
  buildScales();
  wireToggles();
  wireSubmit();
});

/* ---------- build the 1–7 scale rows ---------- */

function buildScales() {
  document.querySelectorAll("[data-scale]").forEach((row) => {
    const name = row.getAttribute("data-scale");
    for (let i = 1; i <= 7; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scale-btn";
      btn.textContent = String(i);
      btn.setAttribute("data-value", String(i));
      btn.addEventListener("click", () => {
        row.querySelectorAll(".scale-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        row.dataset.answer = String(i);
        clearNeedsAnswer(row.closest("[data-question]"));
      });
      row.appendChild(btn);
    }
    row.dataset.name = name;
  });
}

/* ---------- Yes/No toggle ---------- */

function wireToggles() {
  document.querySelectorAll("[data-toggle]").forEach((toggle) => {
    toggle.querySelectorAll(".toggle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        toggle.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        toggle.dataset.answer = btn.getAttribute("data-value");
        clearNeedsAnswer(toggle.closest("[data-question]"));
      });
    });
  });
}

function clearNeedsAnswer(questionEl) {
  if (!questionEl) return;
  questionEl.querySelectorAll(".needs-answer").forEach((el) => el.classList.remove("needs-answer"));
}

/* ---------- submit: validate, then reveal the thank-you panel ---------- */

function wireSubmit() {
  const form = document.getElementById("surveyForm");
  const warning = document.querySelector("[data-form-warning]");
  const thankYou = document.querySelector("[data-thankyou]");

  form?.addEventListener("submit", (evt) => {
    evt.preventDefault();

    let firstUnanswered = null;
    const unansweredGroups = [];

    document.querySelectorAll("[data-question]").forEach((question) => {
      const scale = question.querySelector("[data-scale]");
      const toggle = question.querySelector("[data-toggle]");
      const control = scale || toggle;
      if (!control) return;

      if (!control.dataset.answer) {
        control.classList.add("needs-answer");
        unansweredGroups.push(control);
        if (!firstUnanswered) firstUnanswered = question;
      } else {
        control.classList.remove("needs-answer");
      }
    });

    if (unansweredGroups.length > 0) {
      if (warning) warning.classList.add("visible");
      firstUnanswered?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (warning) warning.classList.remove("visible");

    // Gather responses (e.g. for wiring up to a real backend later).
    const responses = {};
    document.querySelectorAll("[data-scale]").forEach((row) => {
      responses[row.dataset.name] = Number(row.dataset.answer);
    });
    document.querySelectorAll("[data-toggle]").forEach((toggle) => {
      responses[toggle.getAttribute("data-toggle")] = toggle.dataset.answer;
    });
    responses.comments = document.querySelector("[data-comments]")?.value || "";

    // Send to backend
    fetch('/submitSurvey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        participant_id: participantId,

        time_taken_seconds: timeTakenSeconds,
        search_button_clicks: searchButtonClicks,
        apply_feedback_clicks: applyFeedbackClicks,

        initial_search_easy: responses['initial-search-easy'],
        initial_search_useful: responses['initial-search-useful'],

        bbox_easy: responses['bbox-easy'],
        bbox_useful: responses['bbox-useful'],

        relirr_easy: responses['relirr-easy'],
        relirr_useful: responses['relirr-useful'],

        apply_easy: responses['apply-easy'],
        apply_useful: responses['apply-useful'],

        overall_useful: responses['overall-useful'],
        overall_easy: responses['overall-easy'],

        better_than_text: responses['better-than-text'],

        likelihood: responses['likelihood'],

        comments: responses.comments
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        form.hidden = true;

        if (thankYou) {
          thankYou.hidden = false;
          thankYou.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      } else {
        alert('Failed to save survey.');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Server error.');
    });
  });
}