import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
document.body.appendChild(renderer.domElement);

// Scene setup
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 20);
camera.lookAt(0, 5, 0);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,  // Left-click rotates around the focus
    MIDDLE: THREE.MOUSE.DOLLY, // Middle-click zooms in/out
    RIGHT: null,               // Disable right-click drag
};

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, .01); // General ambient light
scene.add(ambientLight);

// Add a brighter spotlight focused on the tree
const spotLight = new THREE.SpotLight(0xffffff, 100, 1); // Increase intensity to make it brighter
spotLight.position.set(5, 20, 5); // Position the spotlight above and slightly to the side
spotLight.angle = Math.PI / 12; // Spotlight angle (cone size)
spotLight.penumbra = 0.5; // Spotlight edge softness
spotLight.decay = 2; // Light decay over distance
spotLight.distance = 400; // Maximum reach of the spotlight
spotLight.castShadow = true; // Enable shadow casting

// Shadow settings for the spotlight
spotLight.shadow.mapSize.width = 1024*4;
spotLight.shadow.mapSize.height = 1024*4;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 50;

scene.add(spotLight);

// Ground plane to receive shadows
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    
    color: 0xffffff 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true; // Enable shadow reception
scene.add(ground);

// Tree materials
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown for the trunk
const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x04ab04 }); // Green for the leaves
const starDecorMaterial = new THREE.MeshStandardMaterial({ 
    emissive: 0xffd966,
    emissiveIntensity:1.25,
    color: 0xffd966
}); // Yellow-ish for the star

// Create tree trunk
const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 16);
const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
trunk.position.y = 1.5; // Raise it slightly to position it above the ground
trunk.castShadow = true; // Enable shadow casting
scene.add(trunk);

let topTree = 0

// Create tree leaves (cones)
const leaves = [];
const leafLevels = 3; // Number of levels of leaves (cones)
for (let i = 0; i < leafLevels; i++) {
    const coneGeometry = new THREE.ConeGeometry((leafLevels - 1) - i * 0.5, leafLevels, 128,128); // Smaller as we go up
    const cone = new THREE.Mesh(coneGeometry, leavesMaterial);
    cone.position.y = leafLevels + i * 1.5; // Stack each cone above the trunk

    topTree = leafLevels + i * 1.5;

    cone.castShadow = true; // Enable shadow casting
    cone.receiveShadow = true; // Enable shadow reception
    leaves.push(cone);
    scene.add(cone);
}

// Create tree star decorate
// Function to create a pentagram shape
function createPentagramShape(size) {
    const shape = new THREE.Shape();
    const angleIncrement = (2 * Math.PI) / 5; // 360 degrees divided by 5 points

    for (let i = 0; i < 10; i++) {
        const angle = i * angleIncrement; // Angle for each point of the star
        const radius = i % 2 === 0 ? size : size / 2; // Alternate between outer and inner points
        const x = radius * Math.sin(angle);
        const y = radius * Math.cos(angle);

        if (i === 0) {
            shape.moveTo(x, y); // Move to the first point
        } else {
            shape.lineTo(x, y); // Draw a line to the next point
        }
    }
    shape.closePath(); // Close the shape to form the star
    return shape;
}

// Create the pentagram star decoration
const pentagramShape = createPentagramShape(.25); // Adjust size as needed
const extrudeSettings = {
    depth: .01, // Thickness of the star
    bevelEnabled: true,
    bevelThickness: .25,
    bevelSize: .25,
    bevelSegments: 1,
};

const starGeometry = new THREE.ExtrudeGeometry(pentagramShape, extrudeSettings);
const star = new THREE.Mesh(starGeometry, starDecorMaterial);
  
// Position the star on top of the tree
star.position.set(0, topTree + 2, 0); // Adjust the Y position to place it at the top of the tree
star.castShadow = true; // Allow the star to cast shadows
scene.add(star);


// Display grid
// const size = 100;
// const divisions = 100;

// const gridHelper = new THREE.GridHelper( size, divisions );
// scene.add( gridHelper );

// Post-processing: Bloom
const composer = new EffectComposer(renderer);

// Render pass (renders the scene normally)
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Bloom pass
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, // Bloom strength
    .5, // Bloom radius
    .85 // Bloom threshold
);
composer.addPass(bloomPass);

// Resize handling for bloom
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    composer.setSize(width, height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Animation loop
function animate() {
    controls.update();
    composer.render(); // Use composer instead of renderer
}

renderer.setAnimationLoop(animate);
