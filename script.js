// Smooth scroll for in-page anchor links
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// Scroll progress bar
(function () {
  const bar = document.querySelector(".scroll-progress");
  if (!bar) return;

  const update = () => {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = pct + "%";
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
})();

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Count-up animation for stat values
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  if (isNaN(target)) return;

  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const suffix = el.dataset.suffix || "";
  const duration = 1400;
  const start = performance.now();

  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - p, 3);
    const value = (target * eased).toFixed(decimals);
    el.textContent = value + suffix;
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target.toFixed(decimals) + suffix;
    }
  };

  requestAnimationFrame(tick);
}

// Scroll-reveal animations
(function () {
  const selectors = [
    ".section-heading",
    ".panel",
    ".meal-card",
    ".note",
    ".routine-card",
    ".training-note",
    ".highlight",
    ".stats-band > div",
    ".exercise-gallery figure",
    ".sources-list a",
  ];

  const targets = document.querySelectorAll(selectors.join(","));
  const counters = document.querySelectorAll(".stat-value[data-count]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    // Show final values immediately
    counters.forEach((el) => {
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      el.textContent =
        parseFloat(el.dataset.count).toFixed(decimals) + (el.dataset.suffix || "");
    });
    return;
  }

  targets.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(i % 6) * 60}ms`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach((el) => observer.observe(el));

  // Fire the count-up once the stats band scrolls into view
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => counterObserver.observe(el));
})();

// ---------- Calendar (.ics) builder ----------
(function () {
  const startEl = document.getElementById("ics-start");
  const endEl = document.getElementById("ics-end");
  const timeEl = document.getElementById("ics-time");
  const durEl = document.getElementById("ics-duration");
  const msgEl = document.getElementById("ics-msg");
  const pplBtn = document.getElementById("ics-ppl");
  const tradBtn = document.getElementById("ics-trad");

  if (!startEl || !pplBtn || !tradBtn) return;

  // Sensible defaults: today through the end of the year.
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  startEl.value = iso(today);
  endEl.value = `${today.getFullYear()}-12-28`;

  const abs = "Abs superset: leg raises, cable crunches, hip raises";

  // weekday: 1=Mon ... 6=Sat
  const SPLITS = {
    ppl: {
      calName: "Push Pull Legs Split - Daksh Avtani",
      file: "ppl-split.ics",
      overview:
        "6-day Push, Pull, Legs split. Train Monday to Saturday, rest Sunday.",
      days: [
        { weekday: 1, summary: "Push 1 - Chest, shoulders, triceps", lines: ["Incline smith machine press", "Dumbbell bench press", "Pec deck fly", "Shoulder press", "Straight bar tricep pushdown", "Cable lateral raise or lateral raise machine", "Skull crushers"] },
        { weekday: 2, summary: "Pull 1 - Back, biceps, traps, abs", lines: ["Preacher curls", "Wide-grip lat pulldown", "T-bar rows", "Incline dumbbell curls", "Shrugs", abs] },
        { weekday: 3, summary: "Legs 1 - Quads, hamstrings, calves", lines: ["Leg press or squats", "Leg extension", "Hamstring curls", "Standing calf raises (incl. smith machine option)", "Romanian deadlifts"] },
        { weekday: 4, summary: "Push 2 - Chest, shoulders, triceps (variation)", lines: ["Dumbbell bench press", "Incline smith machine press", "Decline bench press", "Shoulder press", "Straight bar tricep pushdown", "Cable lateral raise", "Skull crushers"] },
        { weekday: 5, summary: "Pull 2 - Back, biceps, rear delts", lines: ["Preacher curls", "Wide-grip lat pulldown", "Seated cable rows", "Cable curls", "Rear delts on pec deck fly", "Hammer curls"] },
        { weekday: 6, summary: "Legs 2 - Optional second leg day", lines: ["Leg press or squats", "Leg extension", "Hamstring curls", "Standing calf raises", "Romanian deadlifts"] },
      ],
    },
    trad: {
      calName: "Traditional 5-Day Split - Daksh Avtani",
      file: "traditional-split.ics",
      overview:
        "Classic 5-day body-part split. Train Monday to Friday, rest the weekend. Abs are added on the lower-volume days.",
      days: [
        { weekday: 1, summary: "Chest (+ abs)", lines: ["Incline smith machine press", "Flat dumbbell bench press", "Decline bench press", "Pec deck fly", "Cable crossover", abs] },
        { weekday: 2, summary: "Back (+ abs)", lines: ["Deadlifts", "Wide-grip lat pulldown", "T-bar rows", "Seated cable rows", "Shrugs", abs] },
        { weekday: 3, summary: "Shoulders (+ abs)", lines: ["Seated shoulder press", "Dumbbell lateral raises", "Cable lateral raises", "Rear delts on pec deck fly", "Face pulls", abs] },
        { weekday: 4, summary: "Arms", lines: ["Preacher curls", "Incline dumbbell curls", "Hammer curls", "Straight bar tricep pushdown", "Skull crushers", "Overhead tricep extension"] },
        { weekday: 5, summary: "Legs", lines: ["Squats", "Leg press", "Leg extension", "Hamstring curls", "Romanian deadlifts", "Standing calf raises"] },
      ],
    },
  };

  const pad = (n) => String(n).padStart(2, "0");
  const dt = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const day = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const esc = (s) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  function firstOnOrAfter(start, weekday) {
    const target = weekday % 7; // Mon(1)->1 ... Sat(6)->6, Sun would be 0
    const d = new Date(start);
    while (d.getDay() !== target) d.setDate(d.getDate() + 1);
    return d;
  }

  function buildIcs(key) {
    const split = SPLITS[key];
    const startStr = startEl.value;
    const endStr = endEl.value;
    const timeStr = timeEl.value || "18:00";
    const durMin = parseInt(durEl.value, 10) || 90;

    if (!startStr || !endStr) return { error: "Please choose a start and end date." };
    const start = new Date(`${startStr}T00:00:00`);
    const end = new Date(`${endStr}T00:00:00`);
    if (end < start) return { error: "End date must be after the start date." };

    const [hh, mm] = timeStr.split(":").map((n) => parseInt(n, 10));
    const untilStr = `${day(end)}T235959`;
    const stamp = `${dt(new Date()).slice(0, 15)}Z`;

    let lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Daksh Avtani//Fitness Journey//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${split.calName}`,
    ];

    // Overview (all-day, on the start date)
    const dayAfter = new Date(start);
    dayAfter.setDate(dayAfter.getDate() + 1);
    const overviewDesc = split.days
      .map((d) => `${d.summary}\n- ${d.lines.join("\n- ")}`)
      .join("\n\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:overview-${key}-${Date.now()}@daksh-fitness-journey`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day(start)}`,
      `DTEND;VALUE=DATE:${day(dayAfter)}`,
      `SUMMARY:${esc(split.calName)} - overview`,
      `DESCRIPTION:${esc(split.overview + "\n\n" + overviewDesc)}`,
      "END:VEVENT"
    );

    // One recurring weekly event per training day
    split.days.forEach((d, i) => {
      const first = firstOnOrAfter(start, d.weekday);
      first.setHours(hh, mm, 0, 0);
      if (first > end) return;
      const endTime = new Date(first.getTime() + durMin * 60000);
      const desc = `${d.summary}\n${d.lines
        .map((l, n) => `${n + 1}. ${l}`)
        .join("\n")}`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${key}-${i}-${Date.now()}@daksh-fitness-journey`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${dt(first)}`,
        `DTEND:${dt(endTime)}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`,
        `SUMMARY:${esc(d.summary)}`,
        `DESCRIPTION:${esc(desc)}`,
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");
    return { text: lines.join("\r\n"), file: split.file };
  }

  function download(key) {
     const isApple =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function download(key) {
    const result = buildIcs(key);
    if (result.error) {
      msgEl.textContent = result.error;
      msgEl.style.color = "#e0653f";
      return;
    }
    const blob = new Blob([result.text], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    msgEl.style.color = "";

    if (isApple) {
      // iOS/iPadOS Safari ignores the download attribute for blobs. Navigating
      // to a text/calendar resource makes the OS offer "Add All to Calendar".
      msgEl.textContent = "Opening in your calendar app...";
      window.location.href = url;
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = result.file;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      msgEl.textContent = `Downloaded ${result.file}. Open it to import into your calendar.`;
    }

    // Keep the URL alive long enough for the navigation/download to start.
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
  }

  pplBtn.addEventListener("click", () => download("ppl"));
  tradBtn.addEventListener("click", () => download("trad"));
})();
