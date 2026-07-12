/* ============================================================
   script.js — moncy.dev-grade choreography for 000.is-a.dev
   Stack: vanilla JS + GSAP 3.12 + ScrollTrigger (CDN)
   Three.js lives in ./three-scene.js (separate module, importmap)
   ============================================================ */

(() => {
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const isMobileWidth = () => window.innerWidth < 700;
const body = document.body;
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

// ----- LOADER + SCENE BAR HAND-OFF -----
function finishLoading() {
  const loader = document.querySelector(".loader");
  const loaderNumber = document.querySelector(".loader__number");
  const loaderBar = document.querySelector(".loader__track span");
  const sceneBar = document.querySelector(".scene-bar");
  if (!loader) return;
  loaderNumber.textContent = "100";
  loaderBar.style.width = "100%";
  window.setTimeout(() => {
    sceneBar?.classList.add("is-handoff");
    loader.classList.add("is-done");
    body.classList.remove("loading");
    body.classList.add("is-ready");
    triggerCharReveal(".hero__title");
  }, 180);
  window.setTimeout(() => {
    sceneBar?.classList.remove("is-handoff");
    loader.remove();
  }, 1400);
}

if (!prefersReducedMotion) {
  body.classList.add("loading");
  const loaderNumber = document.querySelector(".loader__number");
  const loaderBar = document.querySelector(".loader__track span");

  // DETERMINISTIC time-based progression via rAF + performance.now().
  // This is GUARANTEED to reach 99 within TOTAL_MS because progress is
  // computed from elapsed wall-clock time, not cumulative ticks. A
  // setInterval-based loop can stall under browser throttling; this one
  // converges regardless.
  const TOTAL_MS = 2500;
  const startTime = performance.now();
  let progress = 0;
  let rafId = null;
  const tick = (now) => {
    const elapsed = now - startTime;
    progress = Math.min(99, (elapsed / TOTAL_MS) * 99);
    if (loaderNumber) loaderNumber.textContent = String(Math.floor(progress)).padStart(2, "0");
    if (loaderBar) loaderBar.style.width = `${progress}%`;
    if (progress < 99) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
      window.clearTimeout(loaderSafety);
      window.setTimeout(finishLoading, 220);
    }
  };
  rafId = requestAnimationFrame(tick);

  // BACKUP: belt+suspenders. If rAF stalls (tab in background, paused,
  // weird browser throttle), this setInterval drives progress using the
  // same time-based math — so the loader is guaranteed to advance.
  const backupTick = window.setInterval(() => {
    if (progress >= 99) {
      window.clearInterval(backupTick);
      return;
    }
    const elapsed = performance.now() - startTime;
    progress = Math.min(99, (elapsed / TOTAL_MS) * 99);
    if (loaderNumber) loaderNumber.textContent = String(Math.floor(progress)).padStart(2, "0");
    if (loaderBar) loaderBar.style.width = `${progress}%`;
  }, 80);

  // SAFETY NET — should never fire because the rAF + time-based logic is
  // deterministic, but it guarantees the page never stays on "00" even
  // if the tab is killed mid-load or rAF is paused indefinitely.
  const loaderSafety = window.setTimeout(() => {
    if (body.classList.contains("loading")) {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (loaderNumber) loaderNumber.textContent = "100";
      if (loaderBar) loaderBar.style.width = "100%";
      window.setTimeout(finishLoading, 60);
    }
  }, 4000);
} else {
  document.querySelector(".loader")?.remove();
  body.classList.add("is-ready");
  document
    .querySelectorAll(".reveal, .word-mask, .char-mask")
    .forEach((el) => el.classList.add("is-visible"));
}

// ----- CLOCK (Portland time) -----
function updateTime() {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
  const el = document.querySelector("#local-time");
  if (el) el.textContent = time;
}
updateTime();
window.setInterval(updateTime, 1000);

// ----- TEXT SPLITTERS -----
function splitWords(el) {
  const nodes = Array.from(el.childNodes);
  el.innerHTML = "";
  nodes.forEach((node) => {
    if (node.nodeName === "BR") {
      el.appendChild(document.createElement("br"));
      return;
    }
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part.trim()) {
        el.append(part);
        return;
      }
      const mask = document.createElement("span");
      mask.className = "word-mask";
      const w = document.createElement("span");
      w.textContent = part;
      const idx = el.querySelectorAll(".word-mask").length;
      w.style.transitionDelay = `${idx * 0.035}s`;
      mask.appendChild(w);
      el.appendChild(mask);
    });
  });
}

// Splits the .line__text children of a data-split="char" element into char-masks.
// Uses CSS-driven stagger via inline transitionDelay.
function splitChars(root) {
  const textSpans = root.querySelectorAll(".line__text");
  textSpans.forEach((lineSpan) => {
    const text = lineSpan.textContent;
    if (!text) return;
    lineSpan.textContent = "";
    let lineIdx = 0;
    [...text].forEach((ch) => {
      if (ch === " ") {
        lineSpan.append(" ");
        return;
      }
      const mask = document.createElement("span");
      mask.className = "char-mask";
      const span = document.createElement("span");
      span.textContent = ch;
      span.style.transitionDelay = `${lineIdx * 0.025}s`;
      mask.appendChild(span);
      lineSpan.appendChild(mask);
      lineIdx += 1;
    });
  });
}

document.querySelectorAll("[data-split]").forEach((el) => {
  if (el.dataset.split === "char") splitChars(el);
  else if (el.classList.contains("split-text")) splitWords(el);
});

function triggerCharReveal(selector) {
  document
    .querySelectorAll(`${selector} .char-mask`)
    .forEach((m) => m.classList.add("is-visible"));
}

// ----- INTERSECTION OBSERVER (general reveal + char reveal away from hero) -----
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
);
document
  .querySelectorAll(".reveal, .word-mask, [data-split='char']:not(.hero__title) .char-mask")
  .forEach((el) => io.observe(el));

// ----- BOOT SEQUENCE (writes to .terminal__output) -----
// The boot sequence keeps running until the user clicks the terminal,
// which signals bootPaused = true via interactions.js.
let bootPaused = false;
let bootRestartPending = false;
window.setBootPaused = (v) => { bootPaused = v; };
window.restartBoot = () => {
  // Reset the boot animation to start from line 1, but DO NOT wipe the
  // existing output — the same DOM element (#miku-boot-output) holds the
  // terminal's command history, which the user just typed. Wiping it here
  // would erase their help/ls/cat output before they could read it.
  bootRestartPending = true;
  bootPaused = false;
};
const bootOutput = document.querySelector("#miku-boot-output");
const bootSequence = [
  { text: "Linux 6.12.10-arch1-1 (tty1)", type: "kernel", wait: 520 },
  { text: "OpenRC 0.56 is starting up MikuOS", type: "kernel", wait: 620 },
  { text: "Mounting /proc", status: "ok", wait: 220 },
  { text: "Mounting /sys", status: "ok", wait: 180 },
  { text: "Starting udev", status: "ok", wait: 260 },
  { text: "Loading kernel modules", status: "ok", wait: 310 },
  { text: "Mounting local filesystems", status: "ok", wait: 280 },
  { text: "Setting hostname to mikuos", status: "ok", wait: 230 },
  { text: "Starting D-Bus", status: "ok", wait: 260 },
  { text: "Starting NetworkManager", status: "ok", wait: 420 },
  { text: "Starting display manager", status: "ok", wait: 500 },
  { text: "Welcome to MikuOS", type: "welcome", wait: 500 },
  { text: "mikuos login: ", type: "prompt", wait: 2200 },
];
async function runBootSequence() {
  if (!bootOutput) return;
  while (true) {
    // No `bootOutput.innerHTML = ""` here on purpose: #miku-boot-output is
    // shared with the terminal's command history (MikuOS execCommand writes
    // into the same container). Wiping it on every natural or user-triggered
    // restart would erase the user's help/ls/cat output before they could
    // read it. Boot lines stream in via appendChild; scrollTop is already
    // set inside the loop to anchor the latest line at the bottom of view.
    bootRestartPending = false;
    for (const entry of bootSequence) {
      if (bootRestartPending) break;
      if (bootPaused) {
        await wait(120);
        continue;
      }
      const line = document.createElement("div");
      line.className = `boot-line${entry.type ? ` boot-line--${entry.type}` : ""}`;
      const service = document.createElement("span");
      service.className = "boot-line__service";
      service.textContent = entry.text;
      line.appendChild(service);
      if (entry.status) {
        const status = document.createElement("span");
        status.className = "boot-line__status";
        status.textContent = "[ ok ]";
        line.appendChild(status);
      }
      const wasNearBottom =
        bootOutput.scrollTop + bootOutput.clientHeight + 24 >= bootOutput.scrollHeight;
      bootOutput.appendChild(line);
      // Cap DOM growth: drop oldest boot lines once we exceed ~120, defend against long sessions with many restart cycles.
      if (bootOutput.childElementCount > 120) {
        while (bootOutput.childElementCount > 100) bootOutput.firstElementChild?.remove();
      }
      // Honor manual scroll-up: only auto-anchor to bottom if the user hadn't scrolled away to read older lines before this append.
      if (wasNearBottom) bootOutput.scrollTop = bootOutput.scrollHeight;
      await wait(prefersReducedMotion ? 20 : entry.wait);
    }      if (prefersReducedMotion) return;
      // User pressed Enter in the terminal during the boot -> restart fresh.
      if (bootRestartPending) continue;
      // User clicked the terminal mid-cycle -- quietly idle here until
      // they press Enter (which fires window.restartBoot()) to play the
      // boot sequence again.
      if (bootPaused) {
        while (!bootRestartPending) await wait(120);
        bootPaused = false;
        continue;
      }
      // Boot sequence reached the "mikuos login:" prompt naturally.
      // Stop auto-rolling -- the boot only re-runs when the user presses
      // Enter in the terminal. Solves the "mikuOS log keep rollin" issue.
      while (!bootRestartPending) await wait(120);
    }
}
runBootSequence();

// ----- TWO-RING CURSOR (snap dot + slow trailing ring + state label) -----
if (!prefersReducedMotion && finePointer && !isMobileWidth()) {
  const cursor = document.querySelector(".cursor");
  const cursorDot = cursor?.querySelector(".cursor__dot");
  const cursorRing = cursor?.querySelector(".cursor__ring");
  const cursorLabel = cursor?.querySelector(".cursor__label");

  let mouseX = -100, mouseY = -100;
  let dotX = -100, dotY = -100;
  let ringX = -100, ringY = -100;

  const LABEL_MAP = new Map();
  document.querySelectorAll("[data-cursor]").forEach((el) => {
    LABEL_MAP.set(el, el.dataset.cursor.toUpperCase());
  });

  window.addEventListener("pointermove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  let cursorTicking = false;
  function tickCursor() {
    if (document.hidden) {
      cursorTicking = false;
      return;
    }
    dotX += (mouseX - dotX) * 0.55;
    dotY += (mouseY - dotY) * 0.55;
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    if (cursorDot) cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
    if (cursorRing) cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    if (cursorLabel) cursorLabel.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, calc(-50% - 32px))`;
    requestAnimationFrame(tickCursor);
  }
  cursorTicking = true;
  tickCursor();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !cursorTicking) {
      cursorTicking = true;
      tickCursor();
    }
  });

  function setProject(el, on) {
    if (!cursor) return;
    cursor.classList.toggle("is-project", !!on);
    if (on && cursorLabel && LABEL_MAP.has(el)) cursorLabel.textContent = LABEL_MAP.get(el);
    else if (cursorLabel) cursorLabel.textContent = "";
  }
  document.querySelectorAll("[data-cursor]").forEach((el) => {
    el.addEventListener("pointerenter", () => setProject(el, true));
    el.addEventListener("pointerleave", () => setProject(el, false));
  });
}

// ----- MAGNETIC LINKS -----
if (!prefersReducedMotion && finePointer && !isMobileWidth()) {
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

// ----- ORBS MOUSE TRACKING (subtle) -----
if (!prefersReducedMotion && finePointer && !isMobileWidth()) {
  const o1 = document.querySelector(".orb--one");
  const o2 = document.querySelector(".orb--two");
  window.addEventListener("pointermove", (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    if (o1) o1.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
    if (o2) o2.style.transform = `translate(${x * -22}px, ${y * -22}px)`;
  }, { passive: true });
}

// ----- PROJECT TILT (CSS-var driven) -----
if (!prefersReducedMotion && finePointer && !isMobileWidth()) {
  const TILT_MAX = 7;
  const TILT_LERP = 0.13;
  document.querySelectorAll(".tilt").forEach((el) => {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    function track() {
      cx += (tx - cx) * TILT_LERP;
      cy += (ty - cy) * TILT_LERP;
      el.style.setProperty("--rx", `${cx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${cy.toFixed(2)}deg`);
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(track);
      } else {
        raf = null;
      }
    }
    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      ty = nx * TILT_MAX;
      tx = -ny * TILT_MAX;
      if (!raf) raf = requestAnimationFrame(track);
    });
    el.addEventListener("pointerleave", () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(track);
    });
  });
}

// ----- GSAP SCROLLTELLING -----
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

if (gsap && ScrollTrigger && !prefersReducedMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // ----- Hero — subtle 3D push-back and orb scrub -----
  gsap.to(".hero__3d", {
    scale: 0.85,
    rotateZ: -3,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
  gsap.to(".orb--one", { yPercent: -40, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".orb--two", { yPercent: -55, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__title", {
    yPercent: -10,
    scale: 0.96,
    opacity: 0.9,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // ----- About — line reveal (char cascade inside each line) -----
  // Triggered by IO via .is-visible — CSS handles the cascade transition.
  // GSAP nudges a subtle Y on the lead + drives stats down here.

  // ----- Stats counters + animated underline -----
  gsap.utils.toArray(".stat strong").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const isStatic = el.hasAttribute("data-static");
    if (isStatic || isNaN(target)) return;
    const decimals = target % 1 === 0 ? 0 : 1;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.5,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reset" },
      onUpdate: () => (el.textContent = obj.v.toFixed(decimals)),
    });
  });

  // ----- Projects cascade + tilt entrance -----
  gsap.utils.toArray(".project").forEach((project, i) => {
    gsap.fromTo(
      project,
      { opacity: 0, y: 60, rotateZ: i % 2 === 0 ? -2 : 2 },
      {
        opacity: 1,
        y: 0,
        rotateZ: 0,
        duration: 1.05,
        ease: "power3.out",
        delay: (i % 2) * 0.08,
        scrollTrigger: { trigger: project, start: "top 88%", toggleActions: "play none none reset" },
      }
    );
  });

  // ----- Stats: each stat tile entrance -----
  gsap.utils.toArray(".stat").forEach((stat, i) => {
    gsap.fromTo(
      stat,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8, delay: i * 0.1, ease: "power2.out",
        scrollTrigger: { trigger: stat, start: "top 90%", toggleActions: "play none none reset" } }
    );
  });

  // ----- Marquee subtle scrub (depth feel) -----
  gsap.utils.toArray(".marquee__track").forEach((track, i) => {
    gsap.to(track, {
      xPercent: i % 2 === 0 ? -10 : 10,
      ease: "none",
      scrollTrigger: { trigger: ".marquees", start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  // ----- Contact section: parallax type push -----
  gsap.to(".contact__mail", {
    yPercent: -8,
    ease: "none",
    scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true },
  });

  // ----- Footer statement reveal -----
  gsap.fromTo(
    ".footer__statement",
    { opacity: 0, y: 60 },
    { opacity: 1, y: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: ".footer__statement", start: "top 90%", toggleActions: "play none none reset" } }
  );
  gsap.utils.toArray(".footer .reveal").forEach((el) => {
    io.observe(el); // keep IO reveal for simple elements
  });
}

// ----- SCROLL PROGRESS (left edge bar) -----
const scrollFill = document.getElementById("scroll-progress-fill");
function updateScrollProgress() {
  if (!scrollFill) return;
  const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const p = Math.min(1, Math.max(0, window.scrollY / docHeight));
  scrollFill.style.transform = `scaleY(${p})`;
}
window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

// ----- RESIZE / GSAP REFRESH -----
let resizeT;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeT);
  resizeT = window.setTimeout(() => {
    ScrollTrigger?.refresh?.();
  }, 200);
});
})();
