import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202025);

// fog
scene.fog = new THREE.FogExp2(0x202025, 0.035);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// camera controlls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const hemisphere = new THREE.HemisphereLight(
    0xffffff,
    0x777777,
    2
);
scene.add(hemisphere);

// wallpaper textures
const textureLoader = new THREE.TextureLoader();
const wallTexture = await textureLoader.loadAsync(
  "./wallpapers/textures/NEW_WallPaperTexture_baseColor.jpeg"
);
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(10, 2);
wallTexture.colorSpace = THREE.SRGBColorSpace;

const floorTexture = wallTexture.clone();
floorTexture.repeat.set(10, 10);
floorTexture.needsUpdate = true;

// ceiling texture
const ceilingTexture = wallTexture.clone();
ceilingTexture.repeat.set(10, 10);
ceilingTexture.needsUpdate = true;

// Ground
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x92917a})
);

// Walls
const wallGeometry = new THREE.BoxGeometry(50, 10, 0.2);
const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });

const walls = [
    new THREE.Mesh(wallGeometry, wallMaterial),
    new THREE.Mesh(wallGeometry, wallMaterial),
    new THREE.Mesh(wallGeometry, wallMaterial),
    new THREE.Mesh(wallGeometry, wallMaterial),
];

walls[0].position.set(0, 2.5, -25);
walls[1].position.set(0, 2.5, 25);
walls[2].position.set(-25, 2.5, 0);
walls[3].position.set(25, 2.5, 0);

walls[2].rotation.y = Math.PI / 2;
walls[3].rotation.y = Math.PI / 2;

walls.forEach((wall) => scene.add(wall));

floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

// ceiling
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({
     map: ceilingTexture,
     side: THREE.DoubleSide
  })
);

ceiling.position.set(0, 7.5, 0)
ceiling.rotation.x = Math.PI / 2;
scene.add(ceiling);

// hazmat Loader
const loader = new GLTFLoader();
let gltf = await loader.loadAsync(
    "./hazmat/scene.gltf",
    (xhr) => console.log(`Model ${Math.round((xhr.loaded / xhr.total) * 100)}% loaded`),
    (error) => console.error("Model load error:", error)
);

scene.add(gltf.scene);

const mixer = new THREE.AnimationMixer(gltf.scene);

for (const clip of gltf.animations) {
    mixer.clipAction(clip).play();
}

const hazmatActions = gltf.animations.map((clip) =>
    mixer.clipAction(clip)
);

for (const action of hazmatActions) {
    action.play();
    action.paused = true;
}

document.getElementById("stopHazmat").addEventListener("click", () => {
    for (const action of hazmatActions) {
        action.stop();
    }
});

document.getElementById("startHazmat").addEventListener("click", () => {
    for (const action of hazmatActions) {
        action.reset();
        action.play();
    }
});

const previousHazmatPosition = gltf.scene.position.clone();
let hazmatIsMoving = false;

// keypress
const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

const cameraOffset = new THREE.Vector3(0, 3, -8);
const moveSpeed = 5;
const movementDirection = new THREE.Vector3();

// bill loader
const billLoader = new GLTFLoader();

const billGltf = await billLoader.loadAsync("./bill/scene.gltf");
billGltf.scene.position.set(-20, -2.5, -20);
billGltf.scene.scale.set(3, 3, 3);
billGltf.scene.rotation.y = Math.PI / 4;
scene.add(billGltf.scene);

const billMixer = new THREE.AnimationMixer(billGltf.scene);

for (const clip of billGltf.animations) {
    billMixer.clipAction(clip).play();
}

// Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Timer tracks frame delta time; connecting it to the document avoids a large time jump when the tab regains visibility.
    const timer = new THREE.Timer();
    timer.connect(document);
    
// Update loop
function update(time) {
    timer.update(time);

    const delta = timer.getDelta();
    const movement = moveSpeed * delta;
    movementDirection.set(0, 0, 0);

    if (keys.w) movementDirection.z -= 1;
    if (keys.s) movementDirection.z += 1;
    if (keys.a) movementDirection.x -= 1;
    if (keys.d) movementDirection.x += 1;

    if (movementDirection.lengthSq() > 0) {
        movementDirection.normalize();

        gltf.scene.position.addScaledVector(movementDirection, movement);

        const angle = Math.atan2(
            movementDirection.x,
            movementDirection.z
        );
        gltf.scene.rotation.y = angle;
    }

    hazmatIsMoving = movementDirection.lengthSq() > 0;

    for (const action of hazmatActions) {
      action.paused = !hazmatIsMoving;
    }
    const movementDelta = gltf.scene.position.clone()
      .sub(previousHazmatPosition);

    camera.position.add(movementDelta);
    controls.target.copy(gltf.scene.position);
    controls.update();

    previousHazmatPosition.copy(gltf.scene.position);

        mixer.update(delta);
        billMixer.update(delta);
        renderer.render(scene, camera);
    const billPosition = billGltf.scene.position;
    const hazmatPosition = gltf.scene.position;

    const billAngle = Math.atan2(
        hazmatPosition.x - billPosition.x,
        hazmatPosition.z - billPosition.z
    );

billGltf.scene.rotation.y = billAngle;
}
    renderer.setAnimationLoop(update);
