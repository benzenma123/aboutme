/* ============================================================
   interactions.js — vanilla JS / no deps
   Theme: 5 interactive project demos
     1. MikuOS Terminal    (data-demo="terminal")
     2. Hackintosh macOS  (data-demo="desktop")
     3. Home Server Rack  (data-demo="server")
     4. Firewall Lab      (data-demo="firewall")
     5. Offline AI Chat   (data-demo="chat")
   No build step. Loaded with `defer` after GSAP.
   ============================================================ */

(() => {
const finePointer = window.matchMedia("(pointer: fine)").matches;
const isMobileWidth = () => window.innerWidth < 700;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

// ============================================================
// 1. MIKUOS TERMINAL
// ============================================================
function initTerminal() {
  const container = document.querySelector('[data-demo="terminal"] .terminal');
  if (!container) return;

  const input = container.querySelector(".terminal__input");
  const inputRow = container.querySelector(".terminal__input-row");
  const hint = container.querySelector(".terminal__hint");
  const out = container.querySelector(".terminal__output");

  const appendLine = (text, cls = "terminal__line--out") => {
    const span = document.createElement("span");
    span.className = `terminal__line ${cls}`;
    span.textContent = text;
    out?.appendChild(span);
    out && (out.scrollTop = out.scrollHeight);
  };

  const execCommand = (raw) => {
    const cmd = raw.trim();
    appendLine(`root@mikuos:~# ${cmd}`, "terminal__line--cmd");
    if (!cmd) return;
    const [name, ...args] = cmd.split(/\s+/);
    const argStr = args.join(" ");
    const lc = name.toLowerCase();
    switch (lc) {
      case "help":
        appendLine(`Available commands:`);
        appendLine(`  help                  show this message`);
        appendLine(`  whoami                current user`);
        appendLine(`  uname [-a]            system info`);
        appendLine(`  neofetch              system summary art`);
        appendLine(`  ls [-la]              list files`);
        appendLine(`  cat <file>            read a file`);
        appendLine(`  echo <text>           repeat text`);
        appendLine(`  date                  current date`);
        appendLine(`  pwd                   current directory`);
        appendLine(`  clear                 clear screen`);
        appendLine(`  about                 about MikuOS`);
        appendLine(`  exit                  leave the shell`);
        break;
      case "whoami": appendLine("root"); break;
      case "uname":
        if (argStr === "-a")
          appendLine("Linux miku 6.12.10-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux");
        else appendLine("Linux");
        break;
      case "neofetch":
        appendLine(`       ╭──────────╮       root@mikuos`);
        appendLine(`       │  MIKUOS  │       ----------`);
        appendLine(`       │  /home/  │       OS: MikuOS 1.0 (Arch)`);
        appendLine(`       │   root   │       Kernel: 6.12.10-arch1-1`);
        appendLine(`       ╰────●─────╯       Shell: bash 5.2`);
        appendLine(`                          Resolution: 1440x900`);
        appendLine(`     [HATSUNE MIKU® EDITION]  DE: KDE Plasma`);
        appendLine(`                          CPU: AMD Ryzen 7 5800H`);
        appendLine(`                          Mem: 16GB / 32GB`);
        break;
      case "ls":
        appendLine(argStr === "-la" || argStr === "-l" || argStr === "-a"
          ? `drwxr-xr-x  root root  4096  Jul 11  .`
          : ``);
        appendLine(`drwxr-xr-x  root root  4096  Jul 11  .`);
        appendLine(`drwxr-xr-x  root root  4096  Jul 11  ..`);
        appendLine(`-rw-r--r--  root root   220  Jul 11  .bash_logout`);
        appendLine(`-rw-r--r--  root root  3526  Jul 11  .bashrc`);
        appendLine(`drwxr-xr-x  root root  4096  Jul 11  miku-pkg/`);
        appendLine(`-rw-r--r--  root root   666  Jul 11  welcome.txt`);
        break;
      case "cat":
        if (!args[0]) return appendLine("cat: missing file operand");
        if (/welcome/i.test(args[0])) {
          appendLine(`Welcome to MikuOS — an Arch-based distribution`);
          appendLine(`with Hatsune Miku branding, KDE Plasma, and`);
          appendLine(`the Calamares installer. Enjoy the build!`);
        } else if (/\.bashrc/i.test(args[0])) {
          appendLine(`# ~/.bashrc`);
          appendLine(`export PS1="\\[\\033[1;33m\\]\\u@\\h\\[\\033[0m\\]:\\[\\033[1;36m\\]\\w\\[\\033[0m\\]$ "`);
          appendLine(`alias miku='echo "Miku-chan!"'`);
        } else appendLine(`cat: ${args[0]}: No such file or directory`);
        break;
      case "echo": appendLine(argStr); break;
      case "date": appendLine(new Date().toString()); break;
      case "pwd": appendLine("/root"); break;
      case "clear":
        if (out) out.innerHTML = "";
        return;
      case "about":
        appendLine("MikuOS — Hatsune Miku themed Arch Linux distro.");
        appendLine("Built by Ben Nguyen · github.com/benzenma123/MikuOS");
        break;
      case "exit":
        appendLine("Goodbye.");
        container.dataset.state = "boot";
        inputRow.dataset.state = "hidden";
        if (hint) hint.style.display = "";
        input.value = "";
        window.setBootPaused?.(false); // legacy: unpause if a boot cycle is still alive
        window.restartBoot?.();        // kick a fresh boot animation as a farewell (the loop no longer auto-restarts)
        return;
      case "sudo":
        appendLine("Nice try. 😏");
        break;
      default:
        appendLine(`bash: ${name}: command not found`);
    }
  };

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      execCommand(input.value);
      input.value = "";
      // Always restart the boot sequence on every Enter
      window.restartBoot?.();
    } else if (e.key === "Escape") {
      input.blur();
    }
  });

  const enterTerminal = () => {
    container.dataset.state = "ready";
    inputRow.dataset.state = "visible";
    if (hint) hint.style.display = "none";
    window.setBootPaused?.(true);
    input.focus();
  };

  container.addEventListener("click", (e) => {
    if (container.dataset.state === "ready") {
      input.focus();
    } else {
      enterTerminal();
    }
  });

  container.addEventListener("keydown", (e) => {
    if (container.dataset.state !== "ready" && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      enterTerminal();
    }
  });

  // Expose for boot-sequence to know about
  window.MikuTerminal = { container, enter: enterTerminal };
}

// ============================================================
// 2. macOS DESKTOP
// ============================================================
function initMacOS() {
  const visual = document.querySelector('[data-demo="desktop"] .macos');
  if (!visual) return;

  const winStack = visual.querySelector(".macos__windows");
  const appLabel = visual.querySelector("[data-macos-applabel]");
  const clock = visual.querySelector("[data-macos-clock]");

  // Update clock formatted HH:MM
  const updateClock = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    if (clock) clock.textContent = `${hh}:${mm}`;
  };
  updateClock();
  window.setInterval(updateClock, 30000);

  const APPS = {
    finder: {
      title: "Finder",
      body: () => {
        const items = [
          { name: "MikuOS",         kind: "Folder" },
          { name: "Hackintosh.kext", kind: "File" },
          { name: "truenas-config",  kind: "Folder" },
          { name: "firewall.rules",  kind: "File" },
          { name: "ai-runner.py",    kind: "File" },
          { name: "README.md",       kind: "File" },
        ];
        return `<ul>${items.map(i =>
          `<li><span>${i.name}</span><b>${i.kind}</b></li>`
        ).join("")}</ul>`;
      },
    },
    terminal: {
      title: "Terminal",
      body: () => `<div class="macos__terminal-mini">
        <div><span class="b">user@hackintosh</span> ~ % neofetch</div>
        <div style="opacity:.7; font-size:9px; margin-top:6px;">macOS Tahoe 26.0 · Hackintosh</div>
        <div style="opacity:.7; font-size:9px;">Kernel: Darwin 24.0.0</div>
        <div style="opacity:.7; font-size:9px;">Shell: zsh 5.9</div>
        <div style="opacity:.7; font-size:9px;">CPU: AMD Ryzen 7 5800H</div>
        <div style="opacity:.7; font-size:9px;">GPU: NootedRed Radeon Graphics</div>
        <div style="margin-top:6px;"><span class="b">user@hackintosh</span> ~ % <span style="background:#71e967;color:#080a08;padding:0 2px;">_</span></div>
      </div>`,
    },
    notes: {
      title: "Notes",
      body: () => `<div style="font-family: var(--sans);">
        <h4 style="margin: 0 0 8px; font-size: 12px;">Hackintosh Troubleshooting</h4>
        <p style="margin: 0 0 6px;">Kernel patch: algrey patches ProvideCurrentCpuInfo.</p>
        <p style="margin: 0 0 6px;">USB mapping: HS01-HS14 ports on XHC.</p>
        <p style="margin: 0 0 6px;">Boot-args: <code>-no_compat_check keepsyms=1</code></p>
        <p style="margin: 0; opacity: .6;">Last edit: ·  39 min ago</p>
      </div>`,
    },
    about: {
      title: "About This Hack",
      body: () => `<div class="macos__specs">
        <div><b>Device:</b> ThinkBook 14 G4 ABA</div>
        <div><b>OS:</b> macOS Tahoe 26.0</div>
        <div><b>Bootloader:</b> OpenCore 1.0.2</div>
        <div><b>Kexts:</b> Lilu · VirtualSMC · NootedRed · AppleALC · USBMap</div>
        <div><b>Wi-Fi:</b> Intel AX200 (AirportItlwm)</div>
        <div><b>Touchpad:</b> VoodooSMBus + VoodooRMI</div>
        <div><b>Status:</b> <span style="color: var(--acid); font-weight: 600;">BOOTABLE</span></div>
      </div>`,
    },
  };

  const closeWindow = (id, btn) => {
    const win = winStack.querySelector(`[data-window-id="${id}"]`);
    if (win) win.remove();
    btn.dataset.open = "false";
    winStack.dataset.state = winStack.querySelector(".macos__window") ? "open" : "empty";
    if (!winStack.querySelector(".macos__window")) appLabel.textContent = "Finder";
  };

  const openWindow = (id, btn) => {
    const app = APPS[id];
    if (!app) return;
    if (winStack.querySelector(`[data-window-id="${id}"]`)) {
      closeWindow(id, btn);
      return;
    }
    const win = document.createElement("div");
    win.className = "macos__window";
    win.dataset.windowId = id;
    win.innerHTML = `
      <div class="macos__window-header">
        <i class="macos__window-dot macos__window-dot--red"></i>
        <i class="macos__window-dot macos__window-dot--yellow"></i>
        <i class="macos__window-dot macos__window-dot--green"></i>
        <span class="macos__window-title">${app.title}</span>
        <button class="macos__window-close" aria-label="Close">×</button>
      </div>
      <div class="macos__window-body">${app.body()}</div>`;
    winStack.appendChild(win);
    winStack.dataset.state = "open";
    btn.dataset.open = "true";
    appLabel.textContent = app.title;
    win.querySelector(".macos__window-close").addEventListener("click", () => {
      closeWindow(id, btn);
    });
  };

  visual.querySelectorAll(".macos__app").forEach((btn) => {
    btn.addEventListener("click", () => openWindow(btn.dataset.app, btn));
  });
}

// ============================================================
// 3. SERVER RACK — power toggle + wiring + run
// ============================================================
function initServer() {
  const visual = document.querySelector('[data-demo="server"] .project__visual');
  if (!visual) return;

  const rackUnits = [...visual.querySelectorAll('.real-rack__unit')];
  const allServers = [...visual.querySelectorAll('.dot-node--server')];
  const dotServices = [...visual.querySelectorAll('.dot-node--service')];
  const wiresSvg = visual.querySelector('.rack-wires');

  let connections = new Map();
  let selectedNode = null;
  let mode = 'rack';

  const updateMode = () => {
    const allOn = rackUnits.length === 4 && rackUnits.every((u) => u.dataset.on === 'true');
    if (allOn && mode === 'rack') {
      mode = 'dotboard';
      visual.dataset.mode = 'dotboard';
    } else if (!allOn && mode === 'dotboard') {
      mode = 'rack';
      visual.dataset.mode = 'rack';
      if (wiresSvg) wiresSvg.innerHTML = '';
      connections.clear();
      selectedNode = null;
      allServers.forEach((n) => (n.dataset.selected = 'false'));
      dotServices.forEach((n) => {
        n.dataset.on = 'false';
        n.dataset.selected = 'false';
      });
    }
  };

  rackUnits.forEach((unit) => {
    unit.addEventListener('click', () => {
      const isOn = unit.dataset.on === 'true';
      unit.dataset.on = String(!isOn);
      const lcd = unit.querySelector('.chassis__lcd');
      if (lcd) {
        lcd.textContent = isOn
          ? 'OFFLINE'
          : `ONLINE · ${Math.floor(95 + Math.random() * 305)} RPM · ${(40 + Math.random() * 30).toFixed(1)}°C`;
      }
      updateMode();
    });
  });

  const allNodes = () => [...allServers, ...dotServices];
  const getCenter = (el) => {
    const r = el.getBoundingClientRect();
    const p = wiresSvg.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - p.left,
      y: r.top + r.height / 2 - p.top,
    };
  };
  const isNodeRunning = (id) => {
    const node = allNodes().find((n) => n.dataset.node === id);
    if (!node) return false;
    if (node.classList.contains('dot-node--server')) return true;
    return node.dataset.on === 'true';
  };
  const renderWires = () => {
    if (!wiresSvg) return;
    wiresSvg.innerHTML = '';
    connections.forEach((targets, srcId) => {
      const srcEl = allNodes().find((n) => n.dataset.node === srcId);
      if (!srcEl) return;
      targets.forEach((dstId) => {
        const dstEl = allNodes().find((n) => n.dataset.node === dstId);
        if (!dstEl) return;
        const A = getCenter(srcEl);
        const B = getCenter(dstEl);
        const dx = (B.x - A.x) * 0.45;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${A.x} ${A.y} C ${A.x + dx} ${A.y}, ${B.x - dx} ${B.y}, ${B.x} ${B.y}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#11120e');
        path.setAttribute('stroke-width', '1.6');
        path.setAttribute('stroke-dasharray', '6 6');
        path.setAttribute('stroke-linecap', 'round');
        path.style.opacity = '0.35';
        if (isNodeRunning(srcId) && isNodeRunning(dstId)) {
          path.dataset.flow = 'true';
          path.style.opacity = '1';
          path.setAttribute('stroke', '#ff5a36');
          path.setAttribute('stroke-width', '2.4');
        }
        wiresSvg.appendChild(path);
      });
    });
  };

  const toggleConnection = (a, b) => {
    const set = connections.get(a);
    if (set && set.has(b)) {
      set.delete(b);
      if (connections.get(b)?.has(a)) connections.get(b).delete(a);
    } else {
      if (!connections.has(a)) connections.set(a, new Set());
      connections.get(a).add(b);
    }
  };

  const handleNodeClick = (node) => {
    if (!selectedNode) {
      selectedNode = node;
      node.dataset.selected = 'true';
      return;
    }
    if (selectedNode === node) {
      node.dataset.selected = 'false';
      selectedNode = null;
      return;
    }
    toggleConnection(selectedNode.dataset.node, node.dataset.node);
    selectedNode.dataset.selected = 'false';
    selectedNode = null;
    renderWires();
  };

  allServers.forEach((node) => {
    node.addEventListener('click', () => handleNodeClick(node));
  });
  dotServices.forEach((node) => {
    node.addEventListener('click', () => {
      if (selectedNode) {
        handleNodeClick(node);
        return;
      }
      node.dataset.on = String(node.dataset.on !== 'true');
      renderWires();
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    if (mode === 'dotboard') renderWires();
  });
  resizeObserver.observe(visual);
  window.addEventListener('resize', () => {
    if (mode === 'dotboard') renderWires();
  });
}

// ============================================================
// 4. FIREWALL SCAN
// ============================================================
function initFirewall() {
  const visual = document.querySelector('[data-demo="firewall"] .project__visual');
  if (!visual) return;

  const radar = visual.querySelector(".radar");
  const btn = visual.querySelector(".radar__scan");
  const label = btn?.querySelector("[data-scan-label]");
  const log = visual.querySelector(".firewall__log");
  const list = log?.querySelector("ul");
  const counter = log?.querySelector("[data-firewall-counter]");
  const radarLabel = visual.querySelector("[data-radar-label]");

  const fake = [
    { ip: "192.168.1.42",       port: 443,  proto: "tcp",  action: "BLOCK" },
    { ip: "10.0.0.117",         port: 22,   proto: "tcp",  action: "ALLOW" },
    { ip: "203.0.113.45",       port: 80,   proto: "tcp",  action: "BLOCK" },
    { ip: "198.51.100.7",       port: 53,   proto: "udp",  action: "ALLOW" },
    { ip: "172.16.9.211",       port: 1337, proto: "tcp",  action: "BLOCK" },
    { ip: "8.8.8.8",            port: 53,   proto: "udp",  action: "ALLOW" },
    { ip: "45.83.91.12",        port: 4444, proto: "tcp",  action: "BLOCK" },
    { ip: "192.168.1.1",        port: 80,   proto: "tcp",  action: "ALLOW" },
    { ip: "104.21.55.2",        port: 443,  proto: "tcp",  action: "BLOCK" },
  ];

  let scanning = false;
  let blocked = 0;

  // Mark the radar has-scan so the static label can fade
  if (radar) radar.dataset.hasScan = "true";

  btn?.addEventListener("click", async () => {
    if (scanning) return;
    scanning = true;
    btn.dataset.active = "true";
    if (label) label.textContent = "SCANNING…";
    if (radarLabel) radarLabel.innerHTML = "SCANNING<br/>PACKETS";
    radar.dataset.scanning = "true";
    log.dataset.state = "scanning";
    if (list) list.innerHTML = "";
    blocked = 0;
    if (counter) counter.textContent = "0 BLOCKED";

    for (const entry of fake) {
      const li = document.createElement("li");
      const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
      li.innerHTML = `<span>[${ts}] ${entry.ip}:${entry.port}/${entry.proto}</span><span class="${entry.action === "BLOCK" ? "" : "ok"}"><b>${entry.action}</b></span>`;
      list?.appendChild(li);
      if (entry.action === "BLOCK") blocked++;
      if (counter) counter.textContent = `${blocked} BLOCKED`;
      if (list) list.scrollTop = list.scrollHeight;
      await wait(prefersReducedMotion ? 20 : 380);
    }

    if (radarLabel) radarLabel.innerHTML = `RESULT<br/><b style="color:var(--orange)">${blocked} THREATS</b>`;
    if (label) label.textContent = "RESCAN";
    await wait(2200);
    if (radarLabel) radarLabel.innerHTML = "PACKETS<br/>FILTERED";
    if (label) label.textContent = "SCAN";
    radar.dataset.scanning = "false";
    btn.dataset.active = "false";
    log.dataset.state = "idle";
    scanning = false;
  });
}

// ============================================================
// 5. AI CHAT
// ============================================================
function initChat() {
  const visual = document.querySelector('[data-demo="chat"] .chat');
  if (!visual) return;

  const msgs = visual.querySelector(".chat__messages");
  const chips = [...visual.querySelectorAll(".chat__chip")];

  const RESPONSES = {
    "Tell me about MikuOS":
      "MikuOS is my Arch-based Linux distribution. KDE Plasma, Hatsune Miku-themed Plymouth, custom Calamares installer. The boot screen you're watching is a real chunk of it — the visual you see here is the actual install process narrating itself.",
    "What's your stack?":
      "Linux for the OS. Python for tooling + automation. Bash because some things just need bash. Three.js + GSAP when the project wants to *show*. Vanilla everything — I prefer to know what's under the hood.",
    "What's next?":
      "psst 🤫 there's a project brewing in the homelab — somewhere between a personal LLM, a homelab build, and a slightly unhinged second-brain. running on my own hardware, trained on me, with no one to ask what it's doing. =)) not ready to talk about it yet — when it's out you'll know. for now: mikuOS v2 + the labs are eating my evenings. watch this space.",
  };

  const FALLBACK =
    "I'm a static demo of an offline AI. I don't actually model your projects, but I can tell you about the ones Ben's already shipped — try one of the chips on the right.";

  const addBot = (text) => {
    const div = document.createElement("div");
    div.className = "msg msg--bot";
    div.textContent = text;
    msgs?.appendChild(div);
    scrollBottom();
  };

  const addUser = (text) => {
    const div = document.createElement("div");
    div.className = "msg msg--user";
    div.textContent = text;
    msgs?.appendChild(div);
    scrollBottom();
  };

  const addThinking = () => {
    const div = document.createElement("div");
    div.className = "msg msg--thinking";
    div.textContent = "thinking";
    msgs?.appendChild(div);
    scrollBottom();
    return div;
  };

  const scrollBottom = () => {
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  };

  const typeMessage = async (target, text, perChar = 18) => {
    for (let i = 0; i < text.length; i++) {
      target.textContent = text.slice(0, i + 1);
      scrollBottom();
      await wait(prefersReducedMotion ? 0 : perChar);
    }
  };

  // Welcome bot message on init (typed)
  (async () => {
    await wait(700);
    const greet = document.createElement("div");
    greet.className = "msg msg--bot";
    msgs?.appendChild(greet);
    await typeMessage(greet,
      "Hi. I'm a tiny local model running here in your browser. Ask me about Ben's projects, or tap one of the chips below."
    );
  })();

  chips.forEach((chip) => {
    chip.addEventListener("click", async () => {
      const msg = chip.dataset.msg;
      if (!msg) return;
      // Disable chips briefly while bot is responding
      chips.forEach((c) => (c.disabled = true));
      addUser(msg);
      const reply = RESPONSES[msg] || FALLBACK;
      const thinking = addThinking();
      await wait(prefersReducedMotion ? 0 : 700);
      thinking.remove();
      const bot = document.createElement("div");
      bot.className = "msg msg--bot";
      msgs?.appendChild(bot);
      await typeMessage(bot, reply);
      chips.forEach((c) => (c.disabled = false));
    });
  });
}

// ============================================================
// boot
// ============================================================
function bootDemos() {
  initTerminal();
  initMacOS();
  initServer();
  initFirewall();
  initChat();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootDemos);
} else {
  bootDemos();
}
})();
