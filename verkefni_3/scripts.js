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

// Controls
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
      // Advance the animation mixer by the elapsed time since the last frame.
      mixer.update(timer.getDelta());
      billMixer.update(timer.getDelta());
      controls.update();
      renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(update);
