// Plinko Game for LED Screen with lil-gui controls
// Based on Daniel Shiffman's Coding Train example
// Enhanced with dynamic controls and responsive design

import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/dist/lil-gui.esm.min.js';
import { getScaleFactor, toActualPixels, REFERENCE_WIDTH } from './utils/ResponsiveScale.js';

// Matter.js module aliases
const { Engine, World, Events, Bodies } = Matter;

// Configuration object for lil-gui
const params = {
  // Canvas dimensions
  canvasWidthPercent: 47,
  canvasHeightPercent: 58,

  // Grid configuration
  cols: 9,
  rows: 9,

  // Boundary configuration
  boundaryRadius: 350, // 0 = no boundary, >0 = circular boundary radius
  boundaryCenterY: -90, // vertical offset from canvas center (+ = down, - = up)
  tunnelWidth: 250, // width of bottom tunnel opening
  wallSegments: 200, // number of wall segments (more = smoother, denser)
  backgroundColor: '#d6d6d6', // background color inside boundary
  backgroundTransparent: false, // toggle transparent background
  boundariesVisible: true, // toggle boundary wall visibility

  // Peg configuration
  pegSize: 6,

  // Particle configuration
  particleSize: 51,
  particleCollisionScale: 0.35, // Scale collision radius (0.0-1.0) to match visual appearance
  particleSpawnRate: 9,
  maxParticles: 100,
  dropWidth: 170, // +- from center
  particleShadowBlur: 27,
  particleShadowOpacity: 0.5,
  particleShadowOffsetX: -2,
  particleShadowOffsetY: 10,

  // Physics parameters
  particleRestitution: 0.1,
  particleFriction: 0.55,
  particleDensity: 1,
  pegRestitution: 0.8,
  gravity: 0.2,

  // Control functions
  resetGame: function() {
    resetPlinko();
  },
  clearParticles: function() {
    clearAllParticles();
  }
};

// Global variables for Matter.js physics
let engine;
let world;
let particles = [];
let plinkos = [];
let boundaries = [];
let gui;
let particleImages = [];
const imageFiles = ['1_01.png', '1_02.png', '10_01.png', '10_02.png'];

// Scale factor for responsive sizing
let scaleFactor = 1;

// Particle class
class Particle {
  constructor(x, y, r) {
    this.hue = Math.random() * 360;
    // Randomly select an image
    this.image = random(particleImages);
    const options = {
      restitution: params.particleRestitution,
      friction: params.particleFriction,
      density: params.particleDensity,
      frictionAir: 0.01 // Add slight air resistance
    };
    x += Math.random() * 2 - 1;
    // Use scaled radius for collision detection
    const collisionRadius = r * params.particleCollisionScale;
    this.body = Bodies.circle(x, y, collisionRadius, options);
    this.body.label = "particle";
    this.r = r; // Keep full radius for rendering

    // Set random initial rotation and angular velocity
    Matter.Body.setAngle(this.body, Math.random() * Math.PI * 2);
    Matter.Body.setAngularVelocity(this.body, (Math.random() - 0.5) * 0.1);

    World.add(world, this.body);
  }

  isOffScreen() {
    const x = this.body.position.x;
    const y = this.body.position.y;
    return (x < -50 || x > width + 50 || y > height + 50);
  }

  show() {
    const pos = this.body.position;
    const angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle); // Apply rotation from physics

    // Add drop shadow using canvas context
    drawingContext.shadowBlur = params.particleShadowBlur;
    drawingContext.shadowColor = `rgba(0, 0, 0, ${params.particleShadowOpacity})`;
    drawingContext.shadowOffsetX = params.particleShadowOffsetX;
    drawingContext.shadowOffsetY = params.particleShadowOffsetY;

    // Draw image if available, otherwise draw colored circle
    if (this.image) {
      imageMode(CENTER);
      // Clip to circle to prevent overflow
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.arc(0, 0, this.r, 0, Math.PI * 2);
      drawingContext.clip();

      // Maintain aspect ratio - fit width to diameter, center vertically
      const diameter = this.r * 2;
      const aspectRatio = this.image.width / this.image.height;
      const imgWidth = diameter;
      const imgHeight = diameter / aspectRatio;

      image(this.image, 0, 0, imgWidth, imgHeight);
      drawingContext.restore();
    } else {
      fill(this.hue, 100, 100);
      noStroke();
      ellipse(0, 0, this.r * 2);
    }

    // Reset shadow
    drawingContext.shadowBlur = 0;
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;

    pop();
  }

  updatePhysics() {
    this.body.restitution = params.particleRestitution;
    this.body.friction = params.particleFriction;
    this.body.density = params.particleDensity;
  }
}

// Plinko peg class
class Plinko {
  constructor(x, y, r) {
    const options = {
      restitution: params.pegRestitution,
      friction: 0,
      isStatic: true
    };
    this.body = Bodies.circle(x, y, r, options);
    this.body.label = "plinko";
    this.r = r;
    World.add(world, this.body);
  }

  show() {
    noStroke();
    fill(127);
    const pos = this.body.position;
    push();
    translate(pos.x, pos.y);
    ellipse(0, 0, this.r * 2);
    pop();
  }

  updatePhysics() {
    this.body.restitution = params.pegRestitution;
  }
}

// Boundary wall segment class
class BoundaryWall {
  constructor(x, y, w, h, angle = 0) {
    const options = {
      isStatic: true,
      friction: 0.1,
      restitution: 0.2,
      angle: angle
    };
    this.body = Bodies.rectangle(x, y, w, h, options);
    this.body.label = "boundary";
    this.w = w;
    this.h = h;
    World.add(world, this.body);
  }

  show() {
    if (!params.boundariesVisible) return;

    noStroke();
    fill(180, 180, 180);
    const pos = this.body.position;
    const angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    rectMode(CENTER);
    rect(0, 0, this.w, this.h);
    pop();
  }
}

// Clear all physics bodies from world
function clearWorld() {
  // Remove all particles
  for (let i = particles.length - 1; i >= 0; i--) {
    World.remove(world, particles[i].body);
  }
  particles = [];

  // Remove all plinkos
  for (let i = plinkos.length - 1; i >= 0; i--) {
    World.remove(world, plinkos[i].body);
  }
  plinkos = [];

  // Remove all boundaries
  for (let i = boundaries.length - 1; i >= 0; i--) {
    World.remove(world, boundaries[i].body);
  }
  boundaries = [];
}

// Create plinko pegs
function createPlinkos() {
  const spacing = width / params.cols;
  const centerX = width / 2;
  const centerY = (height / 2) + (params.boundaryCenterY * scaleFactor);
  const radius = params.boundaryRadius * scaleFactor;
  
  // Calculate minimum clearance needed: particle size + safety margin
  const minClearance = (params.particleSize * scaleFactor) + 5;

  for (let j = 0; j < params.rows; j++) {
    for (let i = 0; i < params.cols + 1; i++) {
      let x = i * spacing;
      if (j % 2 === 0) {
        x += spacing / 2;
      }
      const y = spacing + j * spacing;

      // Only create peg if it's inside the boundary (or if no boundary)
      if (params.boundaryRadius <= 0) {
        // No boundary, create all pegs
        const p = new Plinko(x, y, params.pegSize * scaleFactor);
        plinkos.push(p);
      } else {
        // Check if peg is inside circular boundary with clearance for particles
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Ensure peg is far enough from boundary to prevent particle jamming
        if (distance < radius - minClearance) {
          const p = new Plinko(x, y, params.pegSize * scaleFactor);
          plinkos.push(p);
        }
      }
    }
  }
}

// Create circular boundary with tunnel opening at bottom
function createBoundaries() {
  if (params.boundaryRadius <= 0) {
    return; // No boundaries if radius is 0
  }

  const centerX = width / 2;
  const centerY = (height / 2) + (params.boundaryCenterY * scaleFactor);
  const radius = params.boundaryRadius * scaleFactor;
  const wallThickness = 30 * scaleFactor;
  const numSegments = params.wallSegments;

  // Calculate tunnel angle range (bottom opening)
  const tunnelAngleRange = Math.atan2((params.tunnelWidth * scaleFactor) / 2, radius) * 2;

  // Store tunnel edge positions for vertical walls
  let leftTunnelX, rightTunnelX, tunnelY;

  for (let i = 0; i < numSegments; i++) {
    const angle = (i / numSegments) * Math.PI * 2;

    // Skip segments in the tunnel opening range (bottom center)
    const bottomAngleStart = (Math.PI / 2) - (tunnelAngleRange / 2);
    const bottomAngleEnd = (Math.PI / 2) + (tunnelAngleRange / 2);

    if (angle >= bottomAngleStart && angle <= bottomAngleEnd) {
      // Store the tunnel edge positions
      if (!leftTunnelX) {
        leftTunnelX = centerX + Math.cos(bottomAngleStart) * radius;
        tunnelY = centerY + Math.sin(bottomAngleStart) * radius;
      }
      rightTunnelX = centerX + Math.cos(bottomAngleEnd) * radius;
      continue; // Skip this segment to create tunnel opening
    }

    // Position each wall segment
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    // Calculate segment length (arc length) - slightly longer to ensure overlap
    const segmentLength = (2 * Math.PI * radius) / numSegments * 1.2;

    // Create wall segment rotated to follow circle
    const wall = new BoundaryWall(x, y, segmentLength, wallThickness, angle);
    boundaries.push(wall);
  }

  // Create vertical tunnel walls (corridor)
  const corridorHeight = height - tunnelY + 50; // Extend beyond bottom of canvas

  // Left vertical wall
  const leftWall = new BoundaryWall(
    leftTunnelX,
    tunnelY + corridorHeight / 2,
    wallThickness,
    corridorHeight,
    0 // Vertical orientation
  );
  boundaries.push(leftWall);

  // Right vertical wall
  const rightWall = new BoundaryWall(
    rightTunnelX,
    tunnelY + corridorHeight / 2,
    wallThickness,
    corridorHeight,
    0 // Vertical orientation
  );
  boundaries.push(rightWall);
}


// Regenerate the entire plinko board
function regeneratePlinkoBoard() {
  clearWorld();
  createPlinkos();
  createBoundaries();
}

// Reset game
function resetPlinko() {
  regeneratePlinkoBoard();
}

// Clear all particles
function clearAllParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    World.remove(world, particles[i].body);
  }
  particles = [];
}

// Helper function to create new particle
function newParticle() {
  const centerX = width / 2;
  const randomOffset = (Math.random() - 0.5) * 2 * (params.dropWidth * scaleFactor);
  const spawnX = centerX + randomOffset;
  const spawnY = -100; // Spawn 100px above canvas
  const p = new Particle(spawnX, spawnY, params.particleSize * scaleFactor);
  particles.push(p);
}

// Update canvas size
function updateCanvasSize() {
  const container = document.getElementById('plinko-container');
  if (container) {
    container.style.width = `${params.canvasWidthPercent}%`;
  }

  const newWidth = window.innerWidth * (params.canvasWidthPercent / 100);
  const newHeight = window.innerHeight * (params.canvasHeightPercent / 100);

  // Update scale factor based on dashboard size
  const dashboard = document.querySelector('.led-dashboard');
  scaleFactor = dashboard ? getScaleFactor(dashboard) : 1;

  resizeCanvas(newWidth, newHeight);
  regeneratePlinkoBoard();
}

// Setup lil-gui controls
function setupGUI() {
  gui = new GUI({ title: 'Plinko Controls' });

  // Canvas folder
  const canvasFolder = gui.addFolder('Canvas');
  canvasFolder.add(params, 'canvasWidthPercent', 20, 100, 1)
    .name('Width %')
    .onChange(updateCanvasSize);
  canvasFolder.add(params, 'canvasHeightPercent', 50, 150, 1)
    .name('Height %')
    .onChange(updateCanvasSize);

  // Grid folder
  const gridFolder = gui.addFolder('Grid');
  gridFolder.add(params, 'cols', 5, 20, 1)
    .name('Columns')
    .onChange(regeneratePlinkoBoard);
  gridFolder.add(params, 'rows', 5, 20, 1)
    .name('Rows')
    .onChange(regeneratePlinkoBoard);

  // Boundary folder
  const boundaryFolder = gui.addFolder('Boundaries');
  boundaryFolder.add(params, 'boundaryRadius', 0, 1000, 10)
    .name('Radius (0=off)')
    .onChange(regeneratePlinkoBoard);
  boundaryFolder.add(params, 'boundaryCenterY', -500, 500, 10)
    .name('Center Y Offset')
    .onChange(regeneratePlinkoBoard);
  boundaryFolder.add(params, 'tunnelWidth', 50, 500, 10)
    .name('Tunnel Width')
    .onChange(regeneratePlinkoBoard);
  boundaryFolder.add(params, 'wallSegments', 40, 200, 5)
    .name('Wall Density')
    .onChange(regeneratePlinkoBoard);
  boundaryFolder.add(params, 'boundariesVisible')
    .name('Show Boundaries');
  boundaryFolder.add(params, 'backgroundTransparent')
    .name('Transparent BG');
  boundaryFolder.addColor(params, 'backgroundColor')
    .name('Background Color');

  // Peg folder
  const pegFolder = gui.addFolder('Pegs');
  pegFolder.add(params, 'pegSize', 5, 30, 1)
    .name('Size')
    .onChange(regeneratePlinkoBoard);
  pegFolder.add(params, 'pegRestitution', 0, 1, 0.1)
    .name('Bounciness')
    .onChange(() => {
      plinkos.forEach(p => p.updatePhysics());
    });

  // Particle folder
  const particleFolder = gui.addFolder('Particles');
  particleFolder.add(params, 'particleSize', 5, 200, 1)
    .name('Size')
    .onChange(regeneratePlinkoBoard);
  particleFolder.add(params, 'particleCollisionScale', 0.3, 1.0, 0.05)
    .name('Collision Scale');
  particleFolder.add(params, 'particleSpawnRate', 5, 60, 1)
    .name('Spawn Rate');
  particleFolder.add(params, 'maxParticles', 50, 300, 10)
    .name('Max Particles');
  particleFolder.add(params, 'dropWidth', 0, 500, 10)
    .name('Drop Width (+/-)');
  particleFolder.add(params, 'particleRestitution', 0, 5, 0.05)
    .name('Bounciness')
    .onChange(() => {
      particles.forEach(p => p.updatePhysics());
    });
  particleFolder.add(params, 'particleFriction', 0, 1, 0.05)
    .name('Friction')
    .onChange(() => {
      particles.forEach(p => p.updatePhysics());
    });
  particleFolder.add(params, 'particleDensity', 0.1, 5, 0.1)
    .name('Density')
    .onChange(() => {
      particles.forEach(p => p.updatePhysics());
    });
  particleFolder.add(params, 'particleShadowBlur', 0, 30, 1)
    .name('Shadow Blur');
  particleFolder.add(params, 'particleShadowOpacity', 0, 1, 0.05)
    .name('Shadow Opacity');
  particleFolder.add(params, 'particleShadowOffsetX', -10, 10, 1)
    .name('Shadow Offset X');
  particleFolder.add(params, 'particleShadowOffsetY', -10, 10, 1)
    .name('Shadow Offset Y');

  // Physics folder
  const physicsFolder = gui.addFolder('Physics');
  physicsFolder.add(params, 'gravity', 0, 3, 0.1)
    .name('Gravity')
    .onChange((value) => {
      world.gravity.y = value;
    });

  // Actions
  gui.add(params, 'resetGame').name('Reset Game');
  gui.add(params, 'clearParticles').name('Clear Particles');

  // Open important folders by default
  canvasFolder.open();
  particleFolder.open();
}

// Preload particle images
function preload() {
  for (let filename of imageFiles) {
    const img = loadImage(`assets/${filename}`);
    particleImages.push(img);
  }
}

// p5.js setup function
function setup() {
  const canvas = createCanvas(
    window.innerWidth * (params.canvasWidthPercent / 100),
    window.innerHeight * (params.canvasHeightPercent / 100)
  );
  canvas.parent('plinko-container');
  
  // Enable transparency support
  canvas.elt.getContext('2d').globalCompositeOperation = 'source-over';
  
  colorMode(HSB, 100);

  // Calculate initial scale factor
  const dashboard = document.querySelector('.led-dashboard');
  scaleFactor = dashboard ? getScaleFactor(dashboard) : 1;

  // Initialize Matter.js physics engine
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = params.gravity;

  // Create initial setup
  createPlinkos();
  createBoundaries();

  // Setup GUI controls
  setupGUI();

  // Create initial particle
  newParticle();
}

// p5.js draw loop
function draw() {
  clear();

  // Draw background circle inside boundary (if not transparent)
  if (params.boundaryRadius > 0 && !params.backgroundTransparent) {
    const centerX = width / 2;
    const centerY = (height / 2) + (params.boundaryCenterY * scaleFactor);

    noStroke();
    fill(params.backgroundColor);
    ellipse(centerX, centerY, params.boundaryRadius * scaleFactor * 2, params.boundaryRadius * scaleFactor * 2);
  }

  // Spawn new particles at regular intervals
  if (frameCount % params.particleSpawnRate === 0 &&
      particles.length < params.maxParticles) {
    newParticle();
  }

  // Update physics engine at fixed rate (30 FPS physics)
  Engine.update(engine, 1000 / 30);

  // Update and render particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].show();
    if (particles[i].isOffScreen()) {
      World.remove(world, particles[i].body);
      particles.splice(i, 1);
    }
  }

  // Render plinko pegs
  for (let i = 0; i < plinkos.length; i++) {
    plinkos[i].show();
  }

  // Render boundaries
  for (let i = 0; i < boundaries.length; i++) {
    boundaries[i].show();
  }
}

// Handle window resize
function windowResized() {
  updateCanvasSize();
}

// Expose to global scope for p5.js
window.preload = preload;
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
