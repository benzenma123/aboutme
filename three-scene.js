// ============================================================
// three-scene.js — moncy.dev-grade 3D hero centerpiece
// Three.js via importmap CDN. Single canvas, dominant presence.
// ============================================================

import * as THREE from "three";

const canvas = document.getElementById("hero-3d");

if (!canvas) {
  // Bail if the canvas isn't on this page (contact, 404)
} else {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SKIP_THRESHOLD = 700; // a tablet portrait number — match CSS breakpoint

  if (!finePointer || prefersReducedMotion || window.innerWidth < SKIP_THRESHOLD) {
    canvas.remove();
  } else {
    init();
  }
}

function init() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  // ---- Group A: the centerpiece — a icosahedron with bold wireframe + inner shade ----
  const icoGeo = new THREE.IcosahedronGeometry(2.1, 0);
  const icoEdgesGeo = new THREE.EdgesGeometry(icoGeo);

  const icoInnerMat = new THREE.MeshBasicMaterial({
    color: 0x11120e,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const icoInner = new THREE.Mesh(icoGeo, icoInnerMat);

  const icoEdgeMat = new THREE.LineBasicMaterial({
    color: 0xd9ff43,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const icoEdges = new THREE.LineSegments(icoEdgesGeo, icoEdgeMat);

  // A second order of wireframe (a slightly larger, slightly rotated overlay)
  const icoOuterEdgesGeo = new THREE.EdgesGeometry(
    new THREE.IcosahedronGeometry(2.45, 0)
  );
  const icoOuterEdgesMat = new THREE.LineBasicMaterial({
    color: 0xff5a36,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
  });
  const icoOuterEdges = new THREE.LineSegments(icoOuterEdgesGeo, icoOuterEdgesMat);

  const centerpiece = new THREE.Group();
  centerpiece.add(icoInner, icoEdges, icoOuterEdges);

  // ---- Group B: a secondary element — a torus knot, slowly counter-rotating ----
  const knotGeo = new THREE.TorusKnotGeometry(1.4, 0.03, 96, 16, 2, 3);
  const knotMat = new THREE.MeshBasicMaterial({
    color: 0xd9ff43,
    transparent: true,
    opacity: 0.55,
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);

  const knotEdgeGeo = new THREE.EdgesGeometry(
    new THREE.TorusKnotGeometry(1.4, 0.03, 32, 8, 2, 3)
  );
  const knotEdgeMat = new THREE.LineBasicMaterial({
    color: 0x11120e,
    transparent: true,
    opacity: 0.4,
  });
  const knotEdges = new THREE.LineSegments(knotEdgeGeo, knotEdgeMat);

  const satellite = new THREE.Group();
  satellite.add(knot, knotEdges);

  // ---- Group C: orbiting particles that wrap the whole composition ----
  const orbitGroup = new THREE.Group();
  const orbitMat = new THREE.PointsMaterial({
    color: 0xd9ff43,
    size: 0.045,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const orbitCount = 220;
  const orbitPositions = new Float32Array(orbitCount * 3);
  for (let i = 0; i < orbitCount; i++) {
    const r = 3.4 + (i % 5) * 0.05;
    const theta = (i / orbitCount) * Math.PI * 2;
    const phi = (i / orbitCount) * Math.PI;
    const wobble = Math.sin(i * 0.7) * 0.15;
    orbitPositions[i * 3] = Math.cos(theta) * Math.cos(phi) * (r + wobble);
    orbitPositions[i * 3 + 1] = (i / orbitCount - 0.5) * 2.2;
    orbitPositions[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * (r + wobble);
  }
  const orbitGeo = new THREE.BufferGeometry();
  orbitGeo.setAttribute("position", new THREE.BufferAttribute(orbitPositions, 3));
  const orbit = new THREE.Points(orbitGeo, orbitMat);
  orbitGroup.add(orbit);

  // ---- Compose ----
  scene.add(centerpiece);
  scene.add(satellite);
  scene.add(orbitGroup);

  // Place the satellite offset from the centerpiece
  satellite.position.set(3.0, -1.4, -1.5);

  // Mouse parallax state
  const mouse = { x: 0, y: 0 };
  const targetCam = { x: 0, y: 0 };
  const currentCam = { x: 0, y: 0 };
  const targetRot = { x: 0, y: 0 };
  const currentRot = { x: 0, y: 0 };

  window.addEventListener("pointermove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) - 0.5;
    mouse.y = (event.clientY / window.innerHeight) - 0.5;
  }, { passive: true });

  // Scroll state — fades inner core to wireframe as user scrolls past hero
  const scrollProxy = { value: 0 };
  const onScroll = () => {
    const y = window.scrollY;
    const heroHeight = canvas.parentElement?.offsetHeight || window.innerHeight;
    scrollProxy.value = Math.min(1, Math.max(0, y / (heroHeight * 0.95)));
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Resize
  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    renderer.setSize(parent.clientWidth, parent.clientHeight, false);
    camera.aspect = parent.clientWidth / parent.clientHeight;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  // Animation loop
  const clock = new THREE.Clock();
  let running = true;
  function animate() {
    if (!running) return;
    if (document.hidden) {
      requestAnimationFrame(animate);
      return;
    }
    const dt = clock.getDelta();

    // Smooth camera parallax — moves a hair with the mouse (subtle drift, not jumpy)
    targetCam.x = mouse.x * 0.6;
    targetCam.y = -mouse.y * 0.4;
    currentCam.x += (targetCam.x - currentCam.x) * 0.05;
    currentCam.y += (targetCam.y - currentCam.y) * 0.05;
    camera.position.x = currentCam.x;
    camera.position.y = currentCam.y;
    camera.lookAt(0, 0, 0);

    targetRot.x = mouse.y * 0.3;
    targetRot.y = mouse.x * 0.5;
    currentRot.x += (targetRot.x - currentRot.x) * 0.04;
    currentRot.y += (targetRot.y - currentRot.y) * 0.04;

    // Centerpiece: continuous slow rotation + slight parallax tilt
    centerpiece.rotation.y += dt * 0.25;
    centerpiece.rotation.x = currentRot.x * 0.6 + Math.sin(clock.elapsedTime * 0.4) * 0.04;
    centerpiece.rotation.z = currentRot.y * 0.05 + Math.sin(clock.elapsedTime * 0.3) * 0.02;

    // Satellite: counter-rotates for visual richness
    satellite.rotation.y -= dt * 0.4;
    satellite.rotation.x = currentRot.x * 0.4 + Math.PI * 0.18;

    // Orbit: perspective rotation
    orbitGroup.rotation.y += dt * 0.05;

    // Scroll-driven fade — shape dematerializes into pure wireframe as you leave hero
    const s = scrollProxy.value;
    icoEdgeMat.opacity = 0.9 - s * 0.55;
    icoOuterEdgesMat.opacity = 0.45 - s * 0.4;
    knotMat.opacity = 0.55 - s * 0.5;
    knotEdgeMat.opacity = 0.4 - s * 0.35;
    orbitMat.opacity = 0.85 - s * 0.7;
    icoInnerMat.opacity = 0.06 - s * 0.06;

    // Slight forward push-back as you scroll — depth illusion
    camera.position.z = 9 + s * 2.5;

    // Reflect for CSS opacity transition
    if (s > 0.05) canvas.classList.add("is-faded");
    else canvas.classList.remove("is-faded");

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Pause on tab hidden — saves battery
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clock.stop();
    else clock.start();
  });
}
