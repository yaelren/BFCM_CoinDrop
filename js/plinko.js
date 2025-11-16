// Plinko Game for LED Screen with lil-gui controls
// Based on Daniel Shiffman's Coding Train example
// Enhanced with dynamic controls and responsive design

import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/dist/lil-gui.esm.min.js';

// Matter.js module aliases
const { Engine, World, Events, Bodies } = Matter;

// Configuration object for lil-gui
const params = {
  // Canvas dimensions
  canvasWidthPercent: 33,
  canvasHeight: window.innerHeight,

  // Grid configuration
  cols: 11,
  rows: 10,

  // Peg configuration
  pegSize: 16,

  // Particle configuration
  particleSize: 10,
  particleSpawnRate: 20,
  maxParticles: 100,
  dropWidth: 0, // +- from center

  // Physics parameters
  particleRestitution: 0.5,
  particleFriction: 0,
  particleDensity: 1,
  pegRestitution: 1,
  gravity: 1,

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
let gui;

// Particle class
class Particle {
  constructor(x, y, r) {
    this.hue = Math.random() * 360;
    const options = {
      restitution: params.particleRestitution,
      friction: params.particleFriction,
      density: params.particleDensity
    };
    x += Math.random() * 2 - 1;
    this.body = Bodies.circle(x, y, r, options);
    this.body.label = "particle";
    this.r = r;
    World.add(world, this.body);
  }

  isOffScreen() {
    const x = this.body.position.x;
    const y = this.body.position.y;
    return (x < -50 || x > width + 50 || y > height + 50);
  }

  show() {
    // fill(0,0,0,100);
    fill(this.hue, 100, 100);
    noStroke();
    const pos = this.body.position;
    push();
    translate(pos.x, pos.y);
    ellipse(0, 0, this.r * 2);
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

// Boundary class removed - no longer using walls/buckets

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
}

// Create plinko pegs
function createPlinkos() {
  const spacing = width / params.cols;
  for (let j = 0; j < params.rows; j++) {
    for (let i = 0; i < params.cols + 1; i++) {
      let x = i * spacing;
      if (j % 2 === 0) {
        x += spacing / 2;
      }
      const y = spacing + j * spacing;
      const p = new Plinko(x, y, params.pegSize);
      plinkos.push(p);
    }
  }
}


// Regenerate the entire plinko board
function regeneratePlinkoBoard() {
  clearWorld();
  createPlinkos();
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
  const randomOffset = (Math.random() - 0.5) * 2 * params.dropWidth;
  const spawnX = centerX + randomOffset;
  const p = new Particle(spawnX, 0, params.particleSize);
  particles.push(p);
}

// Update canvas size
function updateCanvasSize() {
  const container = document.getElementById('plinko-container');
  if (container) {
    container.style.width = `${params.canvasWidthPercent}%`;
  }

  const newWidth = window.innerWidth * (params.canvasWidthPercent / 100);
  const newHeight = params.canvasHeight;

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
  canvasFolder.add(params, 'canvasHeight', 400, window.innerHeight * 1.5, 10)
    .name('Height')
    .onChange(updateCanvasSize);

  // Grid folder
  const gridFolder = gui.addFolder('Grid');
  gridFolder.add(params, 'cols', 5, 20, 1)
    .name('Columns')
    .onChange(regeneratePlinkoBoard);
  gridFolder.add(params, 'rows', 5, 20, 1)
    .name('Rows')
    .onChange(regeneratePlinkoBoard);

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
  particleFolder.add(params, 'particleSize', 5, 30, 1)
    .name('Size');
  particleFolder.add(params, 'particleSpawnRate', 5, 60, 1)
    .name('Spawn Rate');
  particleFolder.add(params, 'maxParticles', 50, 300, 10)
    .name('Max Particles');
  particleFolder.add(params, 'dropWidth', 0, 500, 10)
    .name('Drop Width (+/-)');
  particleFolder.add(params, 'particleRestitution', 0, 1, 0.05)
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

// p5.js setup function
function setup() {
  const canvas = createCanvas(
    window.innerWidth * (params.canvasWidthPercent / 100),
    params.canvasHeight
  );
  canvas.parent('plinko-container');
  colorMode(HSB, 100);

  // Initialize Matter.js physics engine
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = params.gravity;

  // Create initial setup
  createPlinkos();

  // Setup GUI controls
  setupGUI();

  // Create initial particle
  newParticle();
}

// p5.js draw loop
function draw() {
  clear();

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
}

// Handle window resize
function windowResized() {
  params.canvasHeight = window.innerHeight;
  updateCanvasSize();
}

// Expose to global scope for p5.js
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
