/**
 * Plinko Sketch - P5 instance mode version
 * Converted from global mode for LED Dashboard integration
 */

export function createPlinkoSketch(p, container, externalConfig = {}) {
  // Matter.js aliases
  const { Engine, World, Bodies } = Matter;

  // Sketch variables
  let engine, world;
  let particles = [];
  let plinkos = [];
  let boundaries = [];
  let particleImages = [];

  // Configuration - function to get current config values
  const getConfig = () => ({
    cols: externalConfig.cols || 9,
    rows: externalConfig.rows || 9,
    pegSize: externalConfig.pegSize || 6,
    particleSize: externalConfig.particleSize || 51,
    particleSpawnRate: externalConfig.particleSpawnRate || 9,
    maxParticles: externalConfig.maxParticles || 100,
    dropWidth: externalConfig.dropWidth || 170,
    gravity: externalConfig.gravity || 0.2,
    boundaryRadius: externalConfig.boundaryRadius || 350,
    boundaryCenterY: externalConfig.boundaryCenterY ?? -90,
    tunnelWidth: externalConfig.tunnelWidth || 250,
    backgroundColor: externalConfig.backgroundColor || '#d6d6d6',
    backgroundOpacity: externalConfig.backgroundOpacity ?? 1.0,
    // Visibility controls
    showBoundaries: externalConfig.showBoundaries ?? true,
    showPegs: externalConfig.showPegs ?? true,
    // Particle physics
    particleRestitution: externalConfig.particleRestitution ?? 0.1,
    particleFriction: externalConfig.particleFriction ?? 0.55,
    particleDensity: externalConfig.particleDensity ?? 1,
    particleFrictionAir: externalConfig.particleFrictionAir ?? 0.01,
    // Peg physics
    pegRestitution: externalConfig.pegRestitution ?? 0.8,
    pegFriction: externalConfig.pegFriction ?? 0
  });

  // Particle class
  class Particle {
    constructor(x, y, r) {
      this.hue = Math.random() * 360;
      this.image = particleImages.length > 0 ? p.random(particleImages) : null;
      const config = getConfig();
      const options = {
        restitution: config.particleRestitution,
        friction: config.particleFriction,
        density: config.particleDensity,
        frictionAir: config.particleFrictionAir
      };
      x += Math.random() * 2 - 1;
      const collisionRadius = r * 0.35;
      this.body = Bodies.circle(x, y, collisionRadius, options);
      this.body.label = "particle";
      this.r = r;

      Matter.Body.setAngle(this.body, Math.random() * Math.PI * 2);
      Matter.Body.setAngularVelocity(this.body, (Math.random() - 0.5) * 0.1);

      World.add(world, this.body);
    }

    isOffScreen() {
      const x = this.body.position.x;
      const y = this.body.position.y;
      return (x < -50 || x > p.width + 50 || y > p.height + 50);
    }

    show() {
      const pos = this.body.position;
      const angle = this.body.angle;
      p.push();
      p.translate(pos.x, pos.y);
      p.rotate(angle);

      p.drawingContext.shadowBlur = 27;
      p.drawingContext.shadowColor = `rgba(0, 0, 0, 0.5)`;
      p.drawingContext.shadowOffsetX = -2;
      p.drawingContext.shadowOffsetY = 10;

      if (this.image) {
        p.imageMode(p.CENTER);
        p.drawingContext.save();
        p.drawingContext.beginPath();
        p.drawingContext.arc(0, 0, this.r, 0, Math.PI * 2);
        p.drawingContext.clip();

        const diameter = this.r * 2;
        const aspectRatio = this.image.width / this.image.height;
        const imgWidth = diameter;
        const imgHeight = diameter / aspectRatio;

        p.image(this.image, 0, 0, imgWidth, imgHeight);
        p.drawingContext.restore();
      } else {
        p.fill(this.hue, 100, 100);
        p.noStroke();
        p.ellipse(0, 0, this.r * 2);
      }

      p.drawingContext.shadowBlur = 0;
      p.drawingContext.shadowOffsetX = 0;
      p.drawingContext.shadowOffsetY = 0;

      p.pop();
    }
  }

  // Plinko peg class
  class Plinko {
    constructor(x, y, r) {
      const config = getConfig();
      const options = {
        restitution: config.pegRestitution,
        friction: config.pegFriction,
        isStatic: true
      };
      this.body = Bodies.circle(x, y, r, options);
      this.body.label = "plinko";
      this.r = r;
      World.add(world, this.body);
    }

    show() {
      p.noStroke();
      p.fill(127);
      const pos = this.body.position;
      p.push();
      p.translate(pos.x, pos.y);
      p.ellipse(0, 0, this.r * 2);
      p.pop();
    }
  }

  // Boundary wall class
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
      p.noStroke();
      p.fill(180, 180, 180);
      const pos = this.body.position;
      const angle = this.body.angle;
      p.push();
      p.translate(pos.x, pos.y);
      p.rotate(angle);
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.w, this.h);
      p.pop();
    }
  }

  // Create plinko pegs
  function createPlinkos() {
    const config = getConfig();
    const spacing = p.width / config.cols;
    const centerX = p.width / 2;
    const centerY = (p.height / 2) + config.boundaryCenterY;
    const radius = config.boundaryRadius;

    for (let j = 0; j < config.rows; j++) {
      for (let i = 0; i < config.cols + 1; i++) {
        let x = i * spacing;
        if (j % 2 === 0) {
          x += spacing / 2;
        }
        const y = spacing + j * spacing;

        if (config.boundaryRadius <= 0) {
          plinkos.push(new Plinko(x, y, config.pegSize));
        } else {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < radius - config.pegSize) {
            plinkos.push(new Plinko(x, y, config.pegSize));
          }
        }
      }
    }
  }

  // Create circular boundary with tunnel
  function createBoundaries() {
    const config = getConfig();
    if (config.boundaryRadius <= 0) return;

    const centerX = p.width / 2;
    const centerY = (p.height / 2) + config.boundaryCenterY;
    const radius = config.boundaryRadius;
    const wallThickness = 30;
    const numSegments = 200;
    const tunnelAngleRange = Math.atan2(config.tunnelWidth / 2, radius) * 2;

    let leftTunnelX, rightTunnelX, tunnelY;

    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2;
      const bottomAngleStart = (Math.PI / 2) - (tunnelAngleRange / 2);
      const bottomAngleEnd = (Math.PI / 2) + (tunnelAngleRange / 2);

      if (angle >= bottomAngleStart && angle <= bottomAngleEnd) {
        if (!leftTunnelX) {
          leftTunnelX = centerX + Math.cos(bottomAngleStart) * radius;
          tunnelY = centerY + Math.sin(bottomAngleStart) * radius;
        }
        rightTunnelX = centerX + Math.cos(bottomAngleEnd) * radius;
        continue;
      }

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const segmentLength = (2 * Math.PI * radius) / numSegments * 1.2;

      boundaries.push(new BoundaryWall(x, y, segmentLength, wallThickness, angle));
    }

    // Tunnel walls
    const corridorHeight = p.height - tunnelY + 50;
    boundaries.push(new BoundaryWall(leftTunnelX, tunnelY + corridorHeight / 2, wallThickness, corridorHeight, 0));
    boundaries.push(new BoundaryWall(rightTunnelX, tunnelY + corridorHeight / 2, wallThickness, corridorHeight, 0));
  }

  // Clear and regenerate
  function regenerate() {
    // Don't regenerate if world isn't initialized yet
    if (!world) return;

    // Clear particles
    for (let i = particles.length - 1; i >= 0; i--) {
      World.remove(world, particles[i].body);
    }
    particles = [];

    // Clear plinkos
    for (let i = plinkos.length - 1; i >= 0; i--) {
      World.remove(world, plinkos[i].body);
    }
    plinkos = [];

    // Clear boundaries
    for (let i = boundaries.length - 1; i >= 0; i--) {
      World.remove(world, boundaries[i].body);
    }
    boundaries = [];

    createPlinkos();
    createBoundaries();
  }

  // P5 sketch methods
  return {
    preload: () => {
      const imageFiles = ['1_01.png', '1_02.png', '10_01.png', '10_02.png'];
      for (let filename of imageFiles) {
        particleImages.push(p.loadImage(`assets/${filename}`));
      }
    },

    setup: () => {
      p.createCanvas(container.offsetWidth, container.offsetHeight);
      p.colorMode(p.HSB, 100);

      engine = Engine.create();
      world = engine.world;
      world.gravity.y = getConfig().gravity;

      createPlinkos();
      createBoundaries();

      // Create initial particle
      const centerX = p.width / 2;
      particles.push(new Particle(centerX, -100, getConfig().particleSize));

      console.log('Plinko game initialized:', p.width, 'x', p.height);
    },

    draw: () => {
      p.clear();

      const config = getConfig();

      // Update gravity in case it changed
      if (world) {
        world.gravity.y = config.gravity;
      }

      // Draw background circle
      if (config.boundaryRadius > 0 && config.backgroundOpacity > 0) {
        const centerX = p.width / 2;
        const centerY = (p.height / 2) + config.boundaryCenterY;
        p.noStroke();

        // Convert hex color to RGB with opacity
        const hexColor = config.backgroundColor.replace('#', '');
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        const alpha = Math.floor(config.backgroundOpacity * 255);

        p.fill(r, g, b, alpha);
        p.ellipse(centerX, centerY, config.boundaryRadius * 2);
      }

      // Spawn particles
      if (p.frameCount % config.particleSpawnRate === 0 && particles.length < config.maxParticles) {
        const centerX = p.width / 2;
        const randomOffset = (Math.random() - 0.5) * 2 * config.dropWidth;
        particles.push(new Particle(centerX + randomOffset, -100, config.particleSize));
      }

      // Update physics
      Engine.update(engine, 1000 / 30);

      // Render and clean particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].show();
        if (particles[i].isOffScreen()) {
          World.remove(world, particles[i].body);
          particles.splice(i, 1);
        }
      }

      // Render pegs and boundaries (with visibility controls)
      if (config.showPegs) {
        plinkos.forEach(plinko => plinko.show());
      }
      if (config.showBoundaries) {
        boundaries.forEach(boundary => boundary.show());
      }
    },

    windowResized: () => {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      regenerate();
    }
  };
}
