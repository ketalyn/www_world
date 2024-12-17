import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { CSG } from 'three-csg-ts';
import './main.css';

let camera, scene, renderer, controls;
let initialCameraPosition = new THREE.Vector3();
let initialCameraTarget = new THREE.Vector3();

const frustumSize = 500; // Frustum size for orthographic view
const defaultCameraPosition = new THREE.Vector3(0, 0, 1000);
const defaultLookTarget = new THREE.Vector3(0, 0, 0);

init();

function init() {
  // Camera Setup (Perspective by default)
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 1, 10000);
  camera.position.copy(defaultCameraPosition);
  camera.lookAt(defaultLookTarget);

  // Scene Setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

    // Event Listener for Movement
    document.addEventListener('keydown', handleArrowKeyMovement);

    
    function addBox(width, height, depth, color, positionY, positionZ = 0, positionX = 0, isOutlineOnly = false, lineThickness = 1) {
      if (isOutlineOnly) {
        // Outline-only Box
        const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
        const outlineMaterial = new THREE.LineBasicMaterial({
          color: new THREE.Color(color),
          linewidth: lineThickness, // Line thickness
        });
        const outlineBox = new THREE.LineSegments(outlineGeometry, outlineMaterial);
    
        // Position the outline box
        outlineBox.position.set(positionX, positionY, positionZ);
        scene.add(outlineBox);
      } else {
        // Solid Box
        const boxGeometry = new THREE.BoxGeometry(width, height, depth);
        const boxMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          side: THREE.DoubleSide,
        });
        const solidBox = new THREE.Mesh(boxGeometry, boxMaterial);
    
        // Position the solid box
        solidBox.position.set(positionX, positionY, positionZ);
        scene.add(solidBox);
      }
    }
    
    

// Add Plane to Scene
function addPlane(width, height, color, positionY, positionZ = 0, positionX = 0) {
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color), // Ensure it's explicitly converted to THREE.Color
    side: THREE.DoubleSide,        // Make it visible from both sides
  });

  const planeGeometry = new THREE.PlaneGeometry(width, height);
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);

  plane.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
  plane.position.set(positionX, positionY, positionZ); // Update X, Y, Z positions
  scene.add(plane);
}

// Add multiple elements to the scene
addPlane(6000, 9000, 0xfbfbfb, -100);        // First plane remains
addBox(6000, 100, 9000, 0x00000, 5000, -400, 0, true, 2); // outlined
addBox(6000, 1200, 400, 0x000000, 500, -4200, 0, true, 2); // outlined
addBox(1700, 1000, 150, 0x000000, 500, -4250, -700, true, 2);
addBox(300, 1000, 150, 0x000000, 500, -4250, 200, true); // search box
addPlane(400, 150, 0xcecece, 950, -4250, 150);  // search
addBox(800, 1000, 7000, 0xff0000, 500, -500, -2100, true); // left
addBox(800, 800, 150, 0x091b9d, 500, -3850, -2100, true); // left box
addBox(800, 800, 700, 0x091b9d, 500, -3050, -2100, true); // left box
addBox(800, 1000, 7000, 0xff0000, 500, -500, 2100, true); // right
addPlane(800, 7000, 0xffffff, -50, -500, -2100); // Column left
addPlane(800, 7000, 0xffffff, -50, -500, 2100);  // Column right
addPlane(6000, 9000, 0xf0f0f0, -400, 6000);   // Fourth plane


function addGlowingPlane(width, height, positionY, positionZ = 0, positionX = 0) {
  const glowingMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x0ffff) }, // Glowing cyan color
      intensity: { value: 50.5 }, // Glow intensity
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float intensity;
      varying vec3 vNormal;
      void main() {
        float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), intensity);
        gl_FragColor = vec4(glowColor * glow, 3.0);
      }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, // Ensures it looks "glowy"
    transparent: true, // Allows blending
  });

  const planeGeometry = new THREE.PlaneGeometry(width, height);
  const glowingPlane = new THREE.Mesh(planeGeometry, glowingMaterial);

  glowingPlane.rotation.x = -Math.PI / 2; // Rotate to face upward
  glowingPlane.position.set(positionX, positionY, positionZ);
  scene.add(glowingPlane);
}

// Add the glowing screen plane
addGlowingPlane(6000, 9000, 4800, -100);




function addGlobe(
  radius, 
  positionX, 
  positionY, 
  positionZ, 
  isOutlineOnly = false, 
  lineColor = 0x000000, 
  rotation = { x: 0, y: 0, z: 0 } // Rotation in degrees
) {
  let globe;

  if (isOutlineOnly) {
    // Outline-only sphere using EdgesGeometry
    const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32); // Sphere shape
    const edgesGeometry = new THREE.EdgesGeometry(sphereGeometry);  // Extract edges
    const lineMaterial = new THREE.LineBasicMaterial({ color: lineColor });
    globe = new THREE.LineSegments(edgesGeometry, lineMaterial);
  } else {
    // Solid sphere
    const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x3399ff, // Default blue color
      wireframe: true, // Wireframe view
    });
    globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
  }

  // Apply position
  globe.position.set(positionX, positionY, positionZ);

  // Apply rotation (degrees to radians)
  globe.rotation.set(
    THREE.MathUtils.degToRad(rotation.x),
    THREE.MathUtils.degToRad(rotation.y),
    THREE.MathUtils.degToRad(rotation.z)
  );

  // Add to the scene
  scene.add(globe);

  return globe; // Return the globe if needed
}

// Example Usage: Add a globe rotated by 30° on X-axis, 45° on Y-axis, and 15° on Z-axis
addGlobe(100, -2100, 500, -4250, true, 0x000000, { x: -30, y: 45, z: 15 });

// Function to Add an Image as a Plane
function addImage(imageURL, width, height, positionX, positionY, positionZ, rotation = { x: 0, y: 0, z: 0 }) {
  const loader = new THREE.TextureLoader();

  loader.load(
    imageURL, // Path to the image file
    (texture) => {
      const planeGeometry = new THREE.PlaneGeometry(width, height);
      const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });

      const imagePlane = new THREE.Mesh(planeGeometry, planeMaterial);

      // Set Position
      imagePlane.position.set(positionX, positionY, positionZ);

      // Apply Rotation (degrees converted to radians)
      imagePlane.rotation.set(
        THREE.MathUtils.degToRad(rotation.x),
        THREE.MathUtils.degToRad(rotation.y),
        THREE.MathUtils.degToRad(rotation.z)
      );

      // Add to the scene
      scene.add(imagePlane);
    },
    undefined,
    (error) => {
      console.error('Error loading the texture:', error);
    }
  );
}

// Example Usage: Adding an Image as a Plane
addImage(
  './assets/header..png', // Path to your image
  400,                   // Width of the plane
  200,                    // Height of the plane
  -1770,                  // Position X
  800,                    // Position Y
  -4250,                  // Position Z
  { x: -90, y: 0, z: 0 }    // Optional rotation
);

addImage(
  './assets/img.png', // Path to your image
  800,                   // Width of the plane
  1000,                    // Height of the plane
  1000,                  // Position X
  800,                    // Position Y
  -2800,                  // Position Z
  { x: -90, y: 0, z: 0 }    // Optional rotation
);



function addTextGroup(message, fontSize, position, primaryColor, secondaryColor, lineHeight, fontURL) {
  const loader = new FontLoader();

  loader.load(fontURL, (font) => {
    // Create Materials for Text
    const matPrimary = new THREE.MeshBasicMaterial({
      color: new THREE.Color(primaryColor), // Primary text color
      side: THREE.DoubleSide,
    });

    const matSecondary = new THREE.MeshBasicMaterial({
      color: new THREE.Color(secondaryColor), // Secondary text color
      side: THREE.DoubleSide,
    });

    const lines = message.split('\n'); // Split message into lines
    const textGroup = new THREE.Group(); // Group to hold all text meshes

    // Add text for each line
    lines.forEach((line, index) => {
      const shapes = font.generateShapes(line, fontSize);
      const geometry = new THREE.ShapeGeometry(shapes);
      geometry.computeBoundingBox();
      geometry.translate(0, -index * lineHeight, 0); // Position text lines with spacing

      // Primary Text
      const primaryText = new THREE.Mesh(geometry, matPrimary);
      primaryText.position.z = 100; // Position Z offset
      textGroup.add(primaryText);

      // Secondary Text (Offset to create a visual effect)
      const secondaryText = new THREE.Mesh(geometry, matSecondary);
      secondaryText.position.z = 250; // Position Z further back
      textGroup.add(secondaryText);
    });

    // Rotate and position the group
    textGroup.rotation.x = -Math.PI / 2; // Face upward
    textGroup.position.set(position.x, position.y, position.z);

    // Add the group to the scene
    scene.add(textGroup);
    render();
  });
}

//TEXTGROUPS
addTextGroup(
  'World Wide Web', 
  80, 
  { x: -1700, y: 0.1, z: -3900 }, 
  0x0033bc,                  // Purple primary color
  0x000000,                  // Black secondary color
  150,                       // Line height
  './fonts/gentilis_regular.typeface.json' // Font URL
);

// Add Text Group with Second Font (Helvetiker Bold)
addTextGroup(
  'From Wikipedia, the free encyclopedia', 
  40, 
  { x: -1700, y: 0.1, z: -3700 }, 
  0x0033bc,                  // Green primary color
  0x000000,                  // Orange secondary color
  40,                       // Line height
  './fonts/helvetiker_regular.typeface.json' // Different font URL
);

addTextGroup(
  'This article is about the global system of pages accessed via HTTP. For the worldwide computer network, see Internet. For the \nweb browser, see WorldWideWeb.', 
  38, 
  { x: -1500, y: 0.1, z: -3600 }, 
  0x0033bc,                  // Green primary color
  0x000000,                  // Orange secondary color
  80,                       // Line height
  './fonts/helvetiker_regular.typeface.json' // Different font URL
);

addTextGroup(
  '"WWW" and "The Web" redirect here. For other uses, see WWW (disambiguation) and The Web (disambiguation).', 
  38, 
  { x: -1500, y: 0.1, z: -3450 }, 
  0x0033bc,                  // Green primary color
  0x000000,                  // Orange secondary color
  80,                       // Line height
  './fonts/helvetiker_regular.typeface.json' // Different font URL
);

addTextGroup(
  'The World Wide Web (WWW or simply the Web) is an information system that enables\ncontent sharing over the Internet through user-friendly ways meant to appeal to users\nbeyond IT specialists and hobbyists.[1] It allows documents and other web resources to\nbe accessed over the Internet according to specific rules of the Hypertext Transfer\nProtocol (HTTP).[2]', 
  38, 
  { x: -1700, y: 0.1, z: -3300 }, 
  0x0033bc,                  // Green primary color
  0x000000,                  // Orange secondary color
  80,                       // Line height
  './fonts/helvetiker_regular.typeface.json' // Different font URL
);

addTextGroup(
  'The Web was invented by English computer scientist Tim Berners-Lee while at CERN in\n1989 and opened to the public in 1991. It was conceived as a "universal linked\ninformation system".[3][4] Documents and other media content are made available to the\nnetwork through web servers and can be accessed by programs such as web browsers.\nServers and resources on the World Wide Web are identified and located through\ncharacter strings called uniform resource locators (URLs).', 
  38, 
  { x: -1700, y: 0.1, z: -2820 }, 
  0x0033bc,                  // Green primary color
  0x000000,                  // Orange secondary color
  80,                       // Line height
  './fonts/helvetiker_regular.typeface.json' // Different font URL
);

addTextGroup(
  'The original and still very common document type is a web page formatted in Hypertext\nMarkup Language (HTML). This markup language supports plain text, images,\nembedded video and audio contents, and scripts (short programs) that implement\ncomplex user interaction. The HTML language also supports hyperlinks (embedded\nURLs) which provide immediate access to other web resources. Web navigation, or web surfing,\nis the common practice of following such hyperlinks across multiple websites. Web applications\nare web pages that function as application software. The information in the Web is transferred across\nthe Internet using HTTP. Multiple web resources with a common theme and usually a\ncommon domain name make up a website. A single web server may provide multiple websites,\nwhile some websites, especially the most popular ones, may be provided by multiple servers.\nWebsite content is provided by a myriad of companies, organizations, government agencies, and\nindividual users; and comprises an enormous amount of educational, entertainment, commercial,\nand government information.', 
  38, 
  { x: -1700, y: 0.1, z: -2250 }, 
  0x0033bc,                  // Green primary color
  0x000000,                  // Orange secondary color
  80,                       // Line height
  './fonts/helvetiker_regular.typeface.json' // Different font URL
);

addTextGroup(
  'The Web has become the worlds dominant information systems platform.[5][6][7][8] It is the primary tool that billions of people\nworldwide use to interact with the Internet.[2]', 
  38, 
  { x: -1700, y: 0.1, z: -1100 }, 
  0x0033bc,                  // Green primary color
  0x000000,                  // Orange secondary color
  80,                       // Line height
  './fonts/helvetiker_regular.typeface.json' // Different font URL
);

function addLine(startX, startY, startZ, endX, endY, endZ, color = 0x000000, lineWidth = 3) {
  const material = new THREE.LineBasicMaterial({ color: color, linewidth: lineWidth });

  // Define geometry with start and end points
  const points = [];
  points.push(new THREE.Vector3(startX, startY, startZ)); // Start position
  points.push(new THREE.Vector3(endX, endY, endZ));       // End position

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const line = new THREE.Line(geometry, material);
  scene.add(line);
}

// Example: Add a horizontal line along the X-axis
addLine(-1700, 0, -3850, 1700, 0, -3850, 0x000000, 5); // Line moved forward along the Z-axis






// Renderer Setup
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(defaultLookTarget);
  controls.update();

  // Save the initial position and target after controls are initialized
  initialCameraPosition.copy(camera.position);
  initialCameraTarget.copy(controls.target);

  // Add Buttons for Camera Views
  createCameraViewButtons();

  // Resize Event
  window.addEventListener('resize', onWindowResize);

  // Animation Loop
  animate();
}

function createCameraViewButtons() {
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'fixed'; // Keep buttons fixed in the viewport
  buttonContainer.style.top = '10px';
  buttonContainer.style.left = '10px';
  buttonContainer.style.zIndex = '10';

  const orthoButton = document.createElement('button');
  orthoButton.innerText = 'Orthographic View';
  orthoButton.style.marginRight = '10px';
  orthoButton.onclick = setOrthographicView;

  const topDownButton = document.createElement('button');
  topDownButton.innerText = 'Top-Down View';
  topDownButton.onclick = setTopDownView;

  buttonContainer.appendChild(orthoButton);
  buttonContainer.appendChild(topDownButton);
  document.body.appendChild(buttonContainer);
}

const moveSpeed = 50; // Movement speed for arrow keys
let isOrthographic = false; // Track if orthographic view is active

// Handle Arrow Key Movement
function handleArrowKeyMovement(event) {
  switch (event.key) {
    case 'ArrowUp':
      camera.position.z -= moveSpeed;
      controls.target.z -= moveSpeed;
      break;
    case 'ArrowDown':
      camera.position.z += moveSpeed;
      controls.target.z += moveSpeed;
      break;
    case 'ArrowLeft':
      camera.position.x -= moveSpeed;
      controls.target.x -= moveSpeed;
      break;
    case 'ArrowRight':
      camera.position.x += moveSpeed;
      controls.target.x += moveSpeed;
      break;
  }
  controls.update(); // Update OrbitControls after modifying camera position
  render();
}

function setOrthographicView() {
  // Recreate the PerspectiveCamera (default)
  const aspect = window.innerWidth / window.innerHeight;

  camera = new THREE.PerspectiveCamera(75, aspect, 1, 10000);
  
  // Reset the camera position and target to the initial saved values
  camera.position.copy(initialCameraPosition);
  
  // Restore the controls and target
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(initialCameraTarget);
  controls.update();

  // Re-render the scene
  render();
}





let scrollOffset = -3200; // Start at the top of the plane

function setTopDownView() {
  const zoomOutFactor = 5;
  const aspect = window.innerWidth / window.innerHeight;

  // Updated frustumSize for zooming out
  const adjustedFrustumSize = frustumSize * zoomOutFactor;

  // Switch to Orthographic Camera
  camera = new THREE.OrthographicCamera(
    (adjustedFrustumSize * aspect) / -2, // Left
    (adjustedFrustumSize * aspect) / 2,  // Right
    adjustedFrustumSize / 2,             // Top
    adjustedFrustumSize / -2,            // Bottom
    1,                                   // Near plane
    20000                                // Far plane
  );

  scrollOffset = -3200; // Start at the top of the plane
  camera.position.set(0, 1000, scrollOffset); // Camera centered and at the top
  camera.lookAt(0, 0, scrollOffset);          // Look straight at the center of the plane

  controls.enabled = false; // Disable OrbitControls for static view
  render();

  // Add Scroll Event Listener (with passive: false to allow preventDefault)
  window.addEventListener('wheel', onScrollMove, { passive: false });
}

function onScrollMove(event) {
  if (camera.isOrthographicCamera) {
    event.preventDefault(); // Prevent default scrolling behavior

    // Reverse scroll direction by adding deltaY
    scrollOffset += event.deltaY * 0.5; // Adjust scroll direction and speed

    // Define more specific scrolling limits
    const planeHeight = 9000; // Plane height
    const scrollPadding = 1300; // Padding to keep the camera within viewable range

    const maxOffset = planeHeight / 2 - scrollPadding;  // Top edge (closer to center)
    const minOffset = -planeHeight / 2 + scrollPadding; // Bottom edge (closer to center)

    // Clamp scrollOffset within the new limits
    scrollOffset = Math.max(minOffset, Math.min(maxOffset, scrollOffset));

    // Move camera along the Z-axis while keeping X and Y constant
    camera.position.set(0, 1000, scrollOffset);
    camera.lookAt(0, 0, scrollOffset); // Keep looking at the center

    render();
  }
}

// Resize Handler
function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;

  if (camera.isOrthographicCamera) {
    camera.left = -(frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
  } else {
    camera.aspect = aspect;
  }

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  render();
}

function render() {
  renderer.render(scene, camera);
}