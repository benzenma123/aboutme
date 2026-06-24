const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const body = document.body;
const loader = document.querySelector(".loader");
const loaderNumber = document.querySelector(".loader__number");
const loaderBar = document.querySelector(".loader__track span");

function finishLoading() {
  loaderNumber.textContent = "100";
  loaderBar.style.width = "100%";
  loader.classList.add("is-done");
  body.classList.remove("loading");
  body.classList.add("is-ready");
  window.setTimeout(() => loader.remove(), 1200);
}

if (!reducedMotion) {
  body.classList.add("loading");
  let progress = 0;
  const loadInterval = window.setInterval(() => {
    progress += Math.ceil(Math.random() * 9);
    progress = Math.min(progress, 99);
    loaderNumber.textContent = String(progress).padStart(2, "0");
    loaderBar.style.width = `${progress}%`;
    if (progress >= 99) {
      window.clearInterval(loadInterval);
      window.setTimeout(finishLoading, 250);
    }
  }, 55);
} else {
  loader.remove();
  body.classList.add("is-ready");
}

function updateTime() {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
  document.querySelector("#local-time").textContent = time;
}
updateTime();
window.setInterval(updateTime, 1000);

document.querySelectorAll(".split-text").forEach((element) => {
  const nodes = Array.from(element.childNodes);
  element.innerHTML = "";

  nodes.forEach((node) => {
    if (node.nodeName === "BR") {
      element.appendChild(document.createElement("br"));
      return;
    }

    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part.trim()) {
        element.append(part);
        return;
      }
      const mask = document.createElement("span");
      mask.className = "word-mask";
      const word = document.createElement("span");
      word.textContent = part;
      word.style.transitionDelay = `${element.querySelectorAll(".word-mask").length * 0.035}s`;
      mask.appendChild(word);
      element.appendChild(mask);
    });
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal, .split-text").forEach((element) => observer.observe(element));

const bootScreen = document.querySelector(".boot-screen");
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

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

async function runBootSequence() {
  if (!bootScreen || !bootOutput) return;

  while (true) {
    bootScreen.classList.remove("is-resetting");
    bootOutput.innerHTML = "";

    for (const entry of bootSequence) {
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

      bootOutput.appendChild(line);
      await wait(reducedMotion ? 20 : entry.wait);
    }

    if (reducedMotion) return;

    await wait(reducedMotion ? 1000 : 1800);
    bootScreen.classList.add("is-resetting");
    await wait(reducedMotion ? 20 : 350);
  }
}

runBootSequence();

if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  const cursor = document.querySelector(".cursor");
  let mouseX = -100;
  let mouseY = -100;
  let cursorX = -100;
  let cursorY = -100;

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  function moveCursor() {
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
    requestAnimationFrame(moveCursor);
  }
  moveCursor();

  document.querySelectorAll(".project").forEach((project) => {
    project.addEventListener("mouseenter", () => {
      cursor.classList.add("is-project");
      cursor.querySelector("span").textContent = project.dataset.cursor;
    });
    project.addEventListener("mouseleave", () => cursor.classList.remove("is-project"));
  });

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("mousemove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.16}px, ${y * 0.16}px)`;
    });
    element.addEventListener("mouseleave", () => {
      element.style.transform = "";
    });
  });

  const orbs = document.querySelectorAll(".orb");
  window.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    orbs[0].style.transform = `translate(${x * 45}px, ${y * 45}px)`;
    orbs[1].style.transform = `translate(${x * -30}px, ${y * -30}px)`;
  });

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      document.querySelector(".orb--one").style.marginTop = `${y * 0.1}px`;
      document.querySelector(".orb--two").style.marginBottom = `${y * -0.05}px`;
    },
    { passive: true }
  );
}
