const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x000000, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Starfield background
let twinkleIndices = [];
let starMaterial, starGeometry, starFieldMesh;
function createStarField(numStars = 2000) {
  starGeometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < numStars; i++) {
    const r = 60 + Math.random() * 120;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions.push(x, y, z);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, opacity: 0.7, transparent: true });
  starFieldMesh = new THREE.Points(starGeometry, starMaterial);
  scene.add(starFieldMesh);
  // Pick 100 random indices to twinkle
  twinkleIndices = Array.from({length: 100}, () => Math.floor(Math.random() * numStars));
}
createStarField();

// Sun (bright yellow sphere)
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshStandardMaterial({ color: 0xFDB813, emissive: 0xFDB813, emissiveIntensity: 2.5 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, 0);
scene.add(sun);
// Sun glow (inner)
const sunGlowGeometry = new THREE.SphereGeometry(2.7, 32, 32);
const sunGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xFDB813, transparent: true, opacity: 0.28 });
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
sunGlow.position.set(0, 0, 0);
scene.add(sunGlow);
// Sun glow (outer, fainter)
const sunGlowOuterGeometry = new THREE.SphereGeometry(3.5, 32, 32);
const sunGlowOuterMaterial = new THREE.MeshBasicMaterial({ color: 0xFFF7AE, transparent: true, opacity: 0.10 });
const sunGlowOuter = new THREE.Mesh(sunGlowOuterGeometry, sunGlowOuterMaterial);
sunGlowOuter.position.set(0, 0, 0);
scene.add(sunGlowOuter);

// Exaggerate inclination for visual effect
const inclinationMultiplier = 3;

// Fine-tuned inclination for visual effect
const planetsData = [
  { name: 'Mercury', radius: 0.3, distance: 4, color: 0xb1b1b1, speed: 0.04, inclination: 18 },
  { name: 'Venus',   radius: 0.5, distance: 6, color: 0xeccc9a, speed: 0.015, inclination: 10 },
  { name: 'Earth',   radius: 0.55, distance: 8, color: 0x2a56d4, speed: 0.01, inclination: 0 },
  { name: 'Mars',    radius: 0.4, distance: 10, color: 0xb1440e, speed: 0.008, inclination: 8 },
  { name: 'Jupiter', radius: 1.2, distance: 13, color: 0xd2b48c, speed: 0.004, inclination: 6 },
  { name: 'Saturn',  radius: 1.0, distance: 16, color: 0xf7e7b6, speed: 0.003, inclination: 12 },
  { name: 'Uranus',  radius: 0.8, distance: 19, color: 0x7fffd4, speed: 0.002, inclination: 7 },
  { name: 'Neptune', radius: 0.8, distance: 22, color: 0x4166f5, speed: 0.0015, inclination: 14 }
];

const planets = [];
planetsData.forEach((planet, i) => {
  const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: planet.color });
  const mesh = new THREE.Mesh(geometry, material);
  // Outline (glow) for planet
  const outlineGeometry = new THREE.SphereGeometry(planet.radius * 1.12, 32, 32);
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.13 });
  const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
  mesh.add(outline);
  scene.add(mesh);
  // Convert inclination to radians for calculation
  const inclinationRad = planet.inclination * Math.PI / 180;
  const planetObj = { mesh, ...planet, angle: Math.random() * Math.PI * 2, inclinationRad };

  // Add Saturn's rings
  if (planet.name === 'Saturn') {
    const ringGeometry = new THREE.RingGeometry(1.3, 2.0, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xf7e7b6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2; // Make the ring flat in the XZ plane
    // Tilt the ring to match Saturn's inclination
    ring.rotation.z = inclinationRad;
    ring.position.set(0, 0, 0);
    mesh.add(ring);
  }

  // Draw faint orbit rings for each planet
  const ringGeometry = new THREE.RingGeometry(planet.distance - 0.01, planet.distance + 0.01, 128);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.13, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  planets.push(planetObj);
});

// Brighter lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);
const light = new THREE.PointLight(0xFDB813, 5, 180); // Sun's light, brighter and farther
light.position.set(0, 0, 0);
scene.add(light);

// Set camera to top-down view
camera.position.set(0, 30, 0);
camera.lookAt(0, 0, 0);

// === UI Interactivity ===
// Pause/Resume
let isPaused = false;
const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
});

// Light/Dark Mode
const themeToggle = document.getElementById('theme-toggle');
function setTheme(light) {
  document.body.classList.toggle('light-theme', light);
  themeToggle.textContent = light ? 'Dark Mode' : 'Light Mode';
}
themeToggle.addEventListener('click', () => {
  setTheme(!document.body.classList.contains('light-theme'));
});

// Sliders for planet speed
const planetNameToIndex = {
  Mercury: 0,
  Venus: 1,
  Earth: 2,
  Mars: 3,
  Jupiter: 4,
  Saturn: 5,
  Uranus: 6,
  Neptune: 7
};
window.addEventListener('DOMContentLoaded', () => {
  Object.keys(planetNameToIndex).forEach(name => {
    const slider = document.getElementById('slider-' + name);
    if (slider) {
      slider.value = planets[planetNameToIndex[name]].speed;
      slider.addEventListener('input', (e) => {
        const idx = planetNameToIndex[name];
        planets[idx].speed = parseFloat(e.target.value);
      });
    }
  });
  // Fade-in animation for control panel and title
  document.getElementById('control-panel').style.opacity = 0;
  document.getElementById('main-title').style.opacity = 0;
  setTimeout(() => {
    document.getElementById('control-panel').style.transition = 'opacity 1.2s';
    document.getElementById('main-title').style.transition = 'opacity 1.2s';
    document.getElementById('control-panel').style.opacity = 1;
    document.getElementById('main-title').style.opacity = 1;
  }, 200);
});

// === Interactivity: Hover & Click ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const labelDiv = document.getElementById('planet-label');
let hoveredPlanet = null;

// Function to smoothly move camera
let cameraTween = null;
function animateCameraTo(targetPos, lookAt, duration = 800) {
  if (cameraTween) cancelAnimationFrame(cameraTween);
  const start = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  const end = targetPos;
  const startTime = performance.now();
  function animateMove() {
    const now = performance.now();
    const t = Math.min(1, (now - startTime) / duration);
    camera.position.x = start.x + (end.x - start.x) * t;
    camera.position.y = start.y + (end.y - start.y) * t;
    camera.position.z = start.z + (end.z - start.z) * t;
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    if (t < 1) {
      cameraTween = requestAnimationFrame(animateMove);
    }
  }
  animateMove();
}

// Mousemove event for hover
renderer.domElement.addEventListener('mousemove', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const planetMeshes = planets.map(p => p.mesh);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    const newHoveredPlanet = planets.find(p => p.mesh === intersects[0].object);
    if (newHoveredPlanet) {
      hoveredPlanet = newHoveredPlanet;
      labelDiv.textContent = hoveredPlanet.name;
      labelDiv.style.left = event.clientX + 12 + 'px';
      labelDiv.style.top = event.clientY + 12 + 'px';
      labelDiv.style.display = 'block';
      labelDiv.style.opacity = 1;
      renderer.domElement.style.cursor = 'pointer';
    }
  } else {
    hoveredPlanet = null;
    labelDiv.style.opacity = 0;
    renderer.domElement.style.cursor = '';
  }
});

// Click event for zoom
renderer.domElement.addEventListener('click', () => {
  if (hoveredPlanet) {
    const planetPos = hoveredPlanet.mesh.position.clone();
    const camPos = planetPos.clone().add(new THREE.Vector3(0, 2, hoveredPlanet.radius * 5));
    animateCameraTo(camPos, planetPos);
  }
});

// Camera view switching
function animateCameraTo(targetPos, lookAt, duration = 800) {
  const start = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  const end = targetPos;
  const startTime = performance.now();
  function animateMove() {
    const now = performance.now();
    const t = Math.min(1, (now - startTime) / duration);
    camera.position.x = start.x + (end.x - start.x) * t;
    camera.position.y = start.y + (end.y - start.y) * t;
    camera.position.z = start.z + (end.z - start.z) * t;
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    if (t < 1) {
      requestAnimationFrame(animateMove);
    }
  }
  animateMove();
}

document.getElementById('top-view-btn').addEventListener('click', () => {
  animateCameraTo({ x: 0, y: 30, z: 0 }, { x: 0, y: 0, z: 0 });
});
document.getElementById('side-view-btn').addEventListener('click', () => {
  animateCameraTo({ x: 0, y: 0, z: 30 }, { x: 0, y: 0, z: 0 });
});

// Animate all planets' orbits
function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    planets.forEach(planet => {
      planet.angle += planet.speed;
      // Calculate position in XZ plane
      let x = Math.cos(planet.angle) * planet.distance;
      let z = Math.sin(planet.angle) * planet.distance;
      // Apply inclination (tilt) around X axis
      let y = z * Math.sin(planet.inclinationRad);
      z = z * Math.cos(planet.inclinationRad);
      planet.mesh.position.set(x, y, z);
    });
  }
  // Move the starfield (slow rotation, always)
  if (starMaterial && starGeometry) {
    const time = performance.now() * 0.002;
    twinkleIndices.forEach((idx, i) => {
      starMaterial.opacity = 0.7 + 0.2 * Math.sin(time + i);
    });
  }
  renderer.render(scene, camera);
}
animate(); 