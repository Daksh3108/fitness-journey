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
