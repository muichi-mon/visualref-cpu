/* ============================================================
   VisualRef Onboarding — behavior
   ============================================================ */

/* ---------- 1. sticky rail: highlight section in view ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const railItems = Array.from(document.querySelectorAll(".rail-item"));
  const sections = railItems
    .map((item) => document.querySelector(item.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    railItems.forEach((item) => {
      item.classList.toggle("active", item.getAttribute("href") === `#${id}`);
    });
  };

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0.01 }
    );
    sections.forEach((section) => observer.observe(section));
  }

  initTutorial();
  initFinishButton();
});

/* ---------- 2. interactive tutorial mock-app ---------- */

function initTutorial() {
  const root = document.querySelector("[data-tutorial]");
  if (!root) return;

  const steps = Array.from(root.querySelectorAll("[data-tut-step]"));
  const segs = Array.from(root.querySelectorAll(".tut-progress .seg"));
  const stepOfLabels = Array.from(root.querySelectorAll("[data-step-of]"));
  const stepOfNav = root.querySelector("[data-step-of-nav]");
  const prevBtn = root.querySelector("[data-tut-prev]");
  const nextBtn = root.querySelector("[data-tut-next]");

  let current = 0;

  function render() {
    steps.forEach((step, i) => step.toggleAttribute("hidden", i !== current));
    segs.forEach((seg, i) => {
      seg.classList.toggle("done", i < current);
      seg.classList.toggle("current", i === current);
    });
    const label = `Step ${current + 1} of ${steps.length}`;
    stepOfLabels.forEach((el) => { el.textContent = label; });
    if (stepOfNav) stepOfNav.textContent = label;
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.textContent = current === steps.length - 1 ? "Done" : "Next step →";
  }

  prevBtn?.addEventListener("click", () => {
    if (current > 0) { current -= 1; render(); startHighlights(); }
  });

  nextBtn?.addEventListener("click", () => {
    if (current < steps.length - 1) {
      current += 1;
      render();
      startHighlights();
    } else {
      document.querySelector("#ready")?.scrollIntoView({ behavior: "smooth" });
    }
  });

  /* ---------- onboarding spotlight: soft glow guiding the next click ---------- */
  function clearSpot() {
    root.querySelectorAll(".spot-glow").forEach((el) => el.classList.remove("spot-glow"));
  }

  function runHighlightChain(chain) {
    clearSpot();
    let i = 0;
    function activate() {
      const node = chain[i];
      if (!node || !node.el) return;
      node.el.classList.add("spot-glow");
      const target = node.target || node.el;
      const handler = () => {
        target.removeEventListener(node.evt, handler);
        node.el.classList.remove("spot-glow");
        i += 1;
        activate();
      };
      target.addEventListener(node.evt, handler, { once: true });
    }
    activate();
  }

  function startHighlights() {
    clearSpot();
    if (current === 0) {
      runHighlightChain([
        { el: searchInput, evt: "focus" },
        { el: searchBtn, evt: "click" },
        { el: nextBtn, evt: "click" },
      ]);
    } else if (current === 1) {
      resetBoxDemo();
      runHighlightChain([
        { el: clownEmoji, evt: "vr:boxdrawn", target: bboxCard },
        { el: irrelOption, evt: "click" },
        { el: okBtn, evt: "click" },
        { el: jsonToggle, evt: "click" },
        { el: nextBtn, evt: "click" },
      ]);
    } else if (current === 2) {
      runHighlightChain([
        { el: applyBtn, evt: "click" },
        { el: nextBtn, evt: "click" },
      ]);
    }
  }

  /* --- Step 1: mock search --- */
  const searchInput = root.querySelector("[data-mock-search-input]");
  const searchBtn = root.querySelector("[data-mock-search-btn]");
  const resultGrid = root.querySelector("[data-mock-results]");

  searchBtn?.addEventListener("click", () => {
    if (!resultGrid) return;
    resultGrid.querySelectorAll(".score").forEach((scoreEl) => {
      const score = (Math.random() * 3 + 2).toFixed(6);
      scoreEl.textContent = `Relevance score: ${score}…`;
    });
    resultGrid.hidden = false;
    resultGrid.animate(
      [{ opacity: 0.35 }, { opacity: 1 }],
      { duration: 350, easing: "ease-out" }
    );
  });

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchBtn?.click();
  });

  /* --- Step 2 (merged): draw a bounding box, then auto-open the relevant/irrelevant prompt --- */
  const bboxCard = root.querySelector("[data-bbox-target]");
  const bboxLayer = root.querySelector("[data-bbox-layer]");
  const dropdownWrap = root.querySelector(".dropdown-wrap");
  const dropdown = root.querySelector("[data-dropdown]");
  const relOption = root.querySelector("[data-mark-relevant]");
  const irrelOption = root.querySelector("[data-mark-irrelevant]");
  const checkRelevant = root.querySelector("[data-check-relevant]");
  const checkIrrelevant = root.querySelector("[data-check-irrelevant]");
  const swatch = root.querySelector("[data-swatch]");
  const cancelBtn = root.querySelector("[data-dropdown-cancel]");
  const okBtn = root.querySelector("[data-dropdown-ok]");
  const tagPill = root.querySelector("[data-tag-pill]");
  const clownEmoji = root.querySelector("[data-clown-emoji]");
  const bboxDemo = root.querySelector("[data-bbox-demo]");
  const bboxDemoCursor = root.querySelector("[data-bbox-demo-cursor]");

  function stopBoxDemo() {
    if (bboxDemo) bboxDemo.style.display = "none";
    if (bboxDemoCursor) bboxDemoCursor.style.display = "none";
  }
  function resetBoxDemo() {
    if (bboxDemo) bboxDemo.style.display = "";
    if (bboxDemoCursor) bboxDemoCursor.style.display = "";
  }

  let pendingChoice = "relevant";

  function selectChoice(kind) {
    pendingChoice = kind;
    if (checkRelevant) checkRelevant.textContent = kind === "relevant" ? "✓" : "";
    if (checkIrrelevant) checkIrrelevant.textContent = kind === "irrelevant" ? "✓" : "";
    if (swatch) swatch.className = `swatch ${kind}`;
  }

  function positionDropdownNearBox() {
    if (!dropdown || !bboxLayer || !dropdownWrap) return;
    const wrapRect = dropdownWrap.getBoundingClientRect();
    const boxLeft = parseFloat(bboxLayer.style.left) || 0;
    const boxTop = parseFloat(bboxLayer.style.top) || 0;
    const boxWidth = parseFloat(bboxLayer.style.width) || 0;

    const dropdownWidth = 220;
    const dropdownHeight = 90;

    // Preferred position: anchored at the box's top-right corner.
    let left = boxLeft + boxWidth + 8;
    let top = boxTop - 6;

    // If it would run off the right edge, flip to the box's left side instead.
    if (left + dropdownWidth > wrapRect.width - 6) {
      left = boxLeft + boxWidth - dropdownWidth - 8;
    }

    const maxLeft = wrapRect.width - dropdownWidth - 6;
    const maxTop = wrapRect.height - dropdownHeight - 6;
    left = Math.max(6, Math.min(left, maxLeft));
    top = Math.max(6, Math.min(top, maxTop));

    dropdown.style.left = `${left}px`;
    dropdown.style.top = `${top}px`;
  }

  function openDropdown() {
    if (!dropdown) return;
    positionDropdownNearBox();
    dropdown.hidden = false;
  }

  if (bboxCard && bboxLayer) {
    let drawing = false;
    let startX = 0, startY = 0;

    const point = (evt) => {
      const rect = bboxCard.getBoundingClientRect();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (evt) => {
      drawing = true;
      if (dropdown) dropdown.hidden = true;
      const p = point(evt);
      startX = p.x; startY = p.y;
      bboxLayer.style.left = `${startX}px`;
      bboxLayer.style.top = `${startY}px`;
      bboxLayer.style.width = "0px";
      bboxLayer.style.height = "0px";
      bboxLayer.classList.remove("irrelevant");
      bboxLayer.hidden = false;
      if (tagPill) tagPill.hidden = true;
    };

    const moveDraw = (evt) => {
      if (!drawing) return;
      const p = point(evt);
      const x = Math.min(p.x, startX);
      const y = Math.min(p.y, startY);
      const w = Math.abs(p.x - startX);
      const h = Math.abs(p.y - startY);
      bboxLayer.style.left = `${x}px`;
      bboxLayer.style.top = `${y}px`;
      bboxLayer.style.width = `${w}px`;
      bboxLayer.style.height = `${h}px`;
    };

    const endDraw = () => {
      if (!drawing) return;
      drawing = false;
      const w = parseFloat(bboxLayer.style.width) || 0;
      const h = parseFloat(bboxLayer.style.height) || 0;
      if (w > 12 && h > 12) {
        selectChoice("relevant");
        openDropdown();
        bboxCard.dispatchEvent(new CustomEvent("vr:boxdrawn"));
      }
    };

    bboxCard.addEventListener("mousedown", startDraw);
    bboxCard.addEventListener("mousedown", stopBoxDemo);
    bboxCard.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", endDraw);

    bboxCard.addEventListener("touchstart", startDraw, { passive: true });
    bboxCard.addEventListener("touchstart", stopBoxDemo, { passive: true });
    bboxCard.addEventListener("touchmove", moveDraw, { passive: true });
    bboxCard.addEventListener("touchend", endDraw);
  }

  relOption?.addEventListener("click", () => selectChoice("relevant"));
  irrelOption?.addEventListener("click", () => selectChoice("irrelevant"));
  cancelBtn?.addEventListener("click", () => {
    if (dropdown) dropdown.hidden = true;
    if (bboxLayer) bboxLayer.hidden = true;
  });
  okBtn?.addEventListener("click", () => {
    if (dropdown) dropdown.hidden = true;
    if (bboxLayer) bboxLayer.classList.toggle("irrelevant", pendingChoice === "irrelevant");
    if (tagPill) {
      tagPill.hidden = false;
      tagPill.classList.toggle("irrelevant", pendingChoice === "irrelevant");
      tagPill.textContent = pendingChoice === "irrelevant" ? "Irrelevant" : "Relevant";
    }
  });

  /* --- Step 2: toggle the "Get bounding boxes" JSON preview --- */
  const jsonToggle = root.querySelector("[data-toggle-json]");
  const jsonPreview = root.querySelector("[data-json-preview]");
  jsonToggle?.addEventListener("click", () => {
    if (!jsonPreview) return;
    jsonPreview.hidden = !jsonPreview.hidden;
  });

  /* --- Step 3: apply feedback, reveal the refined result set --- */
  const applyBtn = root.querySelector("[data-apply-feedback]");
  const applyStatus = root.querySelector("[data-apply-status]");
  const refinedResults = root.querySelector("[data-refined-results]");

  applyBtn?.addEventListener("click", () => {
    if (refinedResults) {
      refinedResults.hidden = false;
      refinedResults.animate(
        [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 350, easing: "ease-out" }
      );
    }
    if (applyStatus) {
      applyStatus.hidden = false;
      applyStatus.textContent = "New search iteration requested — results updated below.";
    }
  });

  render();
  startHighlights();
}

/* ---------- 3. final button: hand off to the live study ---------- */

function initFinishButton() {
  const button = document.getElementById("helloButton");
  if (!button) return;
  button.addEventListener("click", () => {
    const participantId = crypto.randomUUID();
    window.location.href = `http://127.0.0.1:7860/?participant_id=${participantId}`;
  });
}