import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202025);

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

// Ground
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x555555})
);

// Walls
const wallGeometry = new THREE.BoxGeometry(50, 10, 0.2);
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });

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

// Loader
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
      controls.update();
      renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(update);
