import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const PAPER = 0xf3ead8;
const TABLE = 0x4a4038;
const STAGES = [
  { at: 0.00, title: "Sleeve" },
  { at: 0.16, title: "Backs" },
  { at: 0.34, title: "Flip" },
  { at: 0.50, title: "Stack" },
  { at: 0.64, title: "Fold" },
  { at: 0.88, title: "Done" },
];

const PW = 1.12;
const PH = 0.86;
const DEPTH = 0.14;
const WING = 0.62;
const TAB_W = 0.11;
const TAB_H = PH * 0.46;
const RET = 0.32;
const SLOT_X = -(WING * 0.22);

function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
function clamp01(t) { return Math.min(1, Math.max(0, t)); }
function between(t, a, b) { return clamp01((t - a) / Math.max(0.0001, b - a)); }

function fiberCanvas(w, h, base) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  g.lineCap = "round";
  for (let i = 0; i < 9000; i++) {
    const warm = i % 3 === 0;
    g.strokeStyle = warm ? "rgba(255,248,238,.055)" : "rgba(120,96,72,.035)";
    g.lineWidth = warm ? 1.15 : 0.7;
    const x = Math.random() * w;
    const y = Math.random() * h;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 8 + Math.random() * 28, y + (Math.random() - 0.5) * 2.4);
    g.stroke();
  }
  return { canvas: c, ctx: g };
}

function noiseCanvas(w, h, base, ink) {
  const { canvas: c, ctx: g } = fiberCanvas(w, h, base);
  g.strokeStyle = ink;
  g.lineWidth = Math.max(4, w / 220);
  g.strokeRect(w * 0.03, h * 0.03, w * 0.94, h * 0.94);
  return { canvas: c, ctx: g };
}

function finishTex(tex) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function coverTexture() {
  const { canvas: c, ctx: g } = noiseCanvas(2048, 1536, "#f3ead8", "#c65345");
  g.fillStyle = "#c65345";
  g.textAlign = "center";
  g.font = "500 52px IBM Plex Mono, monospace";
  g.fillText("PHOTO SET  /  08 PRINTS", 1024, 400);
  g.beginPath(); g.moveTo(500, 496); g.lineTo(1548, 496); g.stroke();
  g.font = "800 132px Archivo, sans-serif";
  g.fillText("NEW ZEALAND", 1024, 740);
  g.fillText("ROADTRIP", 1024, 936);
  g.beginPath(); g.moveTo(500, 1040); g.lineTo(1548, 1040); g.stroke();
  g.font = "500 48px IBM Plex Mono, monospace";
  g.fillText("INSTAX WIDE  ·  NO GLUE", 1024, 1160);
  return finishTex(new THREE.CanvasTexture(c));
}

function wingTexture() {
  const { canvas: c, ctx: g } = noiseCanvas(1536, 1536, "#f3ead8", "#c65345");
  g.fillStyle = "#c65345";
  g.textAlign = "left";
  g.font = "600 44px IBM Plex Mono, monospace";
  g.fillText("NEW ZEALAND / 08", 128, 360);
  g.beginPath(); g.moveTo(128, 420); g.lineTo(1400, 420); g.stroke();
  g.font = "500 40px IBM Plex Mono, monospace";
  g.fillText("ROADTRIP", 128, 560);
  g.fillText("2024.08 — 2024.08", 128, 636);
  g.fillText("FORMAT", 128, 840);
  g.fillText("108 × 86 MM", 128, 916);
  g.fillText("ONE WIDE TAB", 128, 1120);
  return finishTex(new THREE.CanvasTexture(c));
}

function photoTexture(index, back = false) {
  const palettes = [
    ["#7a9bb0", "#d7c3a5", "#4f6d55"],
    ["#c48b6a", "#e8d3b8", "#6d7c8c"],
    ["#8a6b52", "#c9b48a", "#3f5a62"],
    ["#b07060", "#eedcc4", "#6f8b78"],
    ["#5d6e82", "#e2c9a4", "#8a5a48"],
  ];
  const [sky, land, dark] = palettes[index % palettes.length];
  const { canvas: c, ctx: g } = noiseCanvas(1536, 1152, back ? "#f5e8c8" : sky, "#c65345");
  if (!back) {
    g.fillStyle = sky; g.fillRect(48, 48, 1440, 1056);
    g.fillStyle = land;
    g.beginPath();
    g.moveTo(48, 720);
    g.quadraticCurveTo(360, 480, 720, 660);
    g.quadraticCurveTo(1040, 840, 1488, 560);
    g.lineTo(1488, 1104); g.lineTo(48, 1104); g.closePath(); g.fill();
    g.fillStyle = dark;
    g.beginPath();
    g.moveTo(48, 860);
    g.quadraticCurveTo(560, 780, 1488, 820);
    g.lineTo(1488, 1104); g.lineTo(48, 1104); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)";
    g.beginPath(); g.arc(1120, 240, 76, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff";
    g.fillRect(48, 1000, 1440, 104);
    g.fillStyle = "#c65345";
    g.font = "600 44px IBM Plex Mono, monospace";
    g.fillText(`FRAME ${String(index + 1).padStart(2, "0")}`, 96, 1068);
  } else {
    g.fillStyle = "#f5e8c8"; g.fillRect(0, 0, 1536, 1152);
    g.strokeStyle = "#c65345"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(96, 128); g.lineTo(1440, 128); g.stroke();
    g.fillStyle = "#c65345";
    g.font = "700 56px IBM Plex Mono, monospace";
    g.fillText(`PHOTO ${String(index + 1).padStart(2, "0")}`, 96, 240);
    g.font = "800 108px Archivo, sans-serif";
    g.fillText("Archive record", 96, 380);
    g.beginPath(); g.moveTo(96, 428); g.lineTo(1440, 428); g.stroke();
    g.font = "500 44px IBM Plex Mono, monospace";
    const lines = ["DATE    2024-08-17  18:42", "CAMERA  FUJIFILM  X100", "LENS    23mm  f/2", "EXPOSURE  1/250  ·  f/5.6  ·  ISO 200"];
    lines.forEach((line, i) => g.fillText(line, 96, 540 + i * 84));
  }
  return finishTex(new THREE.CanvasTexture(c));
}

function paperMat(map) {
  return new THREE.MeshPhysicalMaterial({
    color: map ? 0xffffff : PAPER,
    map: map || null,
    roughness: 0.74,
    metalness: 0,
    sheen: 0.22,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(0xf6ead4),
    clearcoat: 0.05,
    clearcoatRoughness: 0.7,
    envMapIntensity: 0.28,
  });
}

function faceMats(top, bottom) {
  return [
    paperMat(), paperMat(),
    paperMat(top), paperMat(bottom),
    paperMat(), paperMat(),
  ];
}

function makePanel(w, h, map, d = 0.012) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), map instanceof Array ? map : paperMat(map));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function coverPlate(w, h, map) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paperMat(map));
  mesh.rotation.x = Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function hinge(name) {
  const g = new THREE.Group();
  g.name = name;
  return g;
}

function buildCase() {
  const root = new THREE.Group();
  const cover = coverTexture();
  const wingMap = wingTexture();

  const bedY = 0.006;
  const hingeY = 0.012;
  const front = makePanel(PW, PH);
  front.position.y = bedY;
  const plate = coverPlate(PW * 0.985, PH * 0.985, cover);
  plate.position.y = -0.0061;
  front.add(plate);
  root.add(front);

  const leftH = hinge("left");
  leftH.position.set(-PW / 2, hingeY, 0);
  const leftWall = makePanel(DEPTH, PH);
  leftWall.position.set(-DEPTH / 2, 0, 0);
  const leftWingH = hinge("leftWing");
  leftWingH.position.set(-DEPTH, 0, 0);
  const leftWing = makePanel(WING, PH);
  leftWing.position.set(-WING / 2, 0, 0);
  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.02, TAB_H + 0.04),
    new THREE.MeshStandardMaterial({ color: 0x3a322c, roughness: 1 })
  );
  slot.position.set(SLOT_X, 0.008, 0);
  leftWingH.add(leftWing, slot);
  leftH.add(leftWall, leftWingH);
  root.add(leftH);

  const rightH = hinge("right");
  rightH.position.set(PW / 2, hingeY, 0);
  const rightWall = makePanel(DEPTH, PH);
  rightWall.position.set(DEPTH / 2, 0, 0);
  const rightWingH = hinge("rightWing");
  rightWingH.position.set(DEPTH, 0, 0);
  const rightWing = makePanel(WING, PH);
  rightWing.position.set(WING / 2, 0, 0);
  const wingPlate = coverPlate(WING * 0.985, PH * 0.985, wingMap);
  wingPlate.position.y = -0.0061;
  rightWing.add(wingPlate);
  const tabH = hinge("tab");
  tabH.position.set(WING, 0, 0);
  const tab = makePanel(TAB_W, TAB_H);
  tab.position.set(TAB_W / 2, 0, 0);
  tabH.add(tab);
  rightWingH.add(rightWing, tabH);
  rightH.add(rightWall, rightWingH);
  root.add(rightH);

  const topH = hinge("top");
  topH.position.set(0, hingeY, -PH / 2);
  const topWall = makePanel(PW * 0.92, DEPTH);
  topWall.position.set(0, 0, -DEPTH / 2);
  const topRetH = hinge("topRet");
  topRetH.position.set(0, 0, -DEPTH);
  const topRet = makePanel(PW * 0.88, RET);
  topRet.position.set(0, 0, -RET / 2);
  topRetH.add(topRet);
  topH.add(topWall, topRetH);
  root.add(topH);

  const botH = hinge("bot");
  botH.position.set(0, hingeY, PH / 2);
  const botWall = makePanel(PW * 0.92, DEPTH);
  botWall.position.set(0, 0, DEPTH / 2);
  const botRetH = hinge("botRet");
  botRetH.position.set(0, 0, DEPTH);
  const botRet = makePanel(PW * 0.88, RET);
  botRet.position.set(0, 0, RET / 2);
  botRetH.add(botRet);
  botH.add(botWall, botRetH);
  root.add(botH);

  root.userData = { leftH, leftWingH, rightH, rightWingH, tabH, topH, topRetH, botH, botRetH };
  return root;
}

function buildStack(count = 6) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(PW * 0.94, 0.012, PH * 0.9),
      faceMats(photoTexture(i, false), photoTexture(i, true))
    );
    card.castShadow = true;
    g.add(card);
  }
  return g;
}

function poseClosed(caseRoot) {
  const { leftH, leftWingH, rightH, rightWingH, tabH, topH, topRetH, botH, botRetH } = caseRoot.userData;
  leftH.rotation.z = -Math.PI / 2;
  leftWingH.rotation.z = -Math.PI / 2;
  rightH.rotation.z = Math.PI / 2;
  rightWingH.rotation.z = Math.PI / 2;
  tabH.rotation.z = Math.PI / 2;
  topH.rotation.x = Math.PI / 2;
  topRetH.rotation.x = Math.PI / 2;
  botH.rotation.x = -Math.PI / 2;
  botRetH.rotation.x = -Math.PI / 2;
}

export function mountHero(canvas, labels) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(TABLE, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(TABLE, 7, 14);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.08, 40);
  camera.position.set(2.35, 1.75, 2.55);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x2c2622, 0.42));
  const key = new THREE.DirectionalLight(0xfff4e4, 1.7);
  key.position.set(2.4, 5.2, 2.1);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 3.5;
  const shadowCam = key.shadow.camera;
  shadowCam.near = 0.5;
  shadowCam.far = 14;
  shadowCam.left = -3.2;
  shadowCam.right = 3.2;
  shadowCam.top = 3.2;
  shadowCam.bottom = -3.2;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc4b8a8, 0.22);
  fill.position.set(-3.4, 2.2, -0.6);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xfff0dc, 0.28);
  rim.position.set(0.2, 1.4, -3.2);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshStandardMaterial({
      color: TABLE,
      roughness: 0.96,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const turn = new THREE.Group();
  const pack = new THREE.Group();
  const caseRoot = buildCase();
  const stack = buildStack();
  pack.add(caseRoot, stack);
  turn.add(pack);
  turn.scale.setScalar(1.22);
  scene.add(turn);

  const aniso = renderer.capabilities.getMaxAnisotropy();
  scene.traverse((obj) => {
    const mats = obj.material ? [].concat(obj.material) : [];
    mats.forEach((mat) => {
      if (mat?.map) mat.map.anisotropy = aniso;
    });
  });

  const clock = new THREE.Clock();
  const duration = 20;
  const hold = 3.5;
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new SMAAPass(1, 1));
  composer.addPass(new OutputPass());

  function draw() {
    composer.render();
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement;
    const width = Math.max(1, w);
    const height = Math.max(1, h);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  function setStage(t) {
    const stage = [...STAGES].reverse().find((s) => t >= s.at) || STAGES[0];
    if (labels.title) labels.title.textContent = stage.title;
  }

  function apply(t) {
    const paperIn = ease(between(t, 0.00, 0.18));
    const seat = ease(between(t, 0.42, 0.54));
    const retain = ease(between(t, 0.56, 0.70));
    const wrapL = ease(between(t, 0.66, 0.80));
    const wrapR = ease(between(t, 0.76, 0.88));
    const lock = ease(between(t, 0.86, 0.93));
    const bow = ease(between(t, 0.92, 1.00));

    const { leftH, leftWingH, rightH, rightWingH, tabH, topH, topRetH, botH, botRetH } = caseRoot.userData;
    caseRoot.visible = true;
    caseRoot.position.y = THREE.MathUtils.lerp(0.72, 0, paperIn);
    caseRoot.rotation.x = 0;

    stack.children.forEach((card, i) => {
      const stagger = i * 0.018;
      const drop = ease(between(t, 0.14 + stagger, 0.48));
      const flipI = ease(between(t, 0.30 + stagger * 0.4, 0.45));
      const restY = 0.018 + i * 0.013;
      const startY = 1.18 + i * 0.05;
      const midY = 0.32 + i * 0.02;
      const y = drop < 0.72
        ? THREE.MathUtils.lerp(startY, midY, drop / 0.72)
        : THREE.MathUtils.lerp(midY, restY, (drop - 0.72) / 0.28);
      card.position.set(
        THREE.MathUtils.lerp(0.22, 0, drop),
        y,
        THREE.MathUtils.lerp(0.08, 0, drop)
      );
      card.rotation.y = THREE.MathUtils.lerp(0.12, 0, drop);
      card.rotation.x = THREE.MathUtils.lerp(Math.PI, 0, flipI);
      card.visible = true;
    });
    stack.position.y = THREE.MathUtils.lerp(0, 0, seat);
    stack.scale.setScalar(THREE.MathUtils.lerp(1, 0.97, seat));

    leftH.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 2, wrapL);
    leftWingH.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 2, wrapL);
    rightH.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 2, wrapR);
    rightWingH.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 2, wrapR);
    tabH.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 2, lock);
    topH.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, retain);
    topRetH.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, retain);
    botH.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, retain);
    botRetH.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, retain);

    pack.rotation.y = THREE.MathUtils.lerp(0.18, 0.08, paperIn);
    pack.rotation.x = 0;
    const centroid = 0.08;
    pack.position.y = -centroid * bow;
    turn.rotation.x = bow * Math.PI;
    turn.position.y = 0.014 + centroid * bow + Math.sin(bow * Math.PI) * 0.68;
    const cam = bow > 0.05
      ? new THREE.Vector3(0.55 + (1 - bow) * 1.15, 1.85, 2.15)
      : t < 0.5
        ? new THREE.Vector3(2.3, 1.72, 2.5)
        : new THREE.Vector3(2.35, 1.58, 2.35);
    camera.position.lerp(cam, 0.14);
    camera.lookAt(0, 0.1, 0);
    setStage(t);
  }

  if (reduced) {
    poseClosed(caseRoot);
    stack.children.forEach((card, i) => {
      card.position.set(0, 0.018 + i * 0.013, 0);
      card.rotation.set(0, 0, 0);
    });
    turn.rotation.x = Math.PI;
    pack.rotation.x = 0;
    pack.position.y = -0.08;
    turn.position.y = 0.094;
    camera.position.set(0.55, 1.85, 2.15);
    camera.lookAt(0, 0.12, 0);
    setStage(0.97);
    draw();
    return;
  }

  let playing = true;
  canvas.addEventListener("click", () => { playing = !playing; clock.getDelta(); });

  function tick() {
    requestAnimationFrame(tick);
    if (playing) {
      const cycle = duration + hold;
      const u = clock.getElapsedTime() % cycle;
      const t = u < duration ? u / duration : 1;
      apply(t);
    }
    draw();
  }
  tick();
}

const canvas = document.getElementById("heroCanvas");
const fallback = document.getElementById("heroFallback");
if (canvas) {
  try {
    mountHero(canvas, {
      id: document.getElementById("sceneId"),
      title: document.getElementById("sceneStage"),
      note: document.getElementById("sceneNote"),
    });
  } catch (error) {
    canvas.remove();
    if (fallback) fallback.style.display = "block";
  }
}
