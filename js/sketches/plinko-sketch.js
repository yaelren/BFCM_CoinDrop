/**
 * Plinko Sketch - P5 instance mode version
 * Converted from global mode for LED Dashboard integration
 */

export function createPlinkoSketch(p, container, externalConfig = {}) {
  // Matter.js aliases
  const { Engine, World, Bodies } = Matter;

  // Reference dimensions for responsive scaling
  // Based on LED Dashboard reference size (4640x1760)
  const REFERENCE_WIDTH = 4640;
  const REFERENCE_HEIGHT = 1760;
  
  // Scale factor - will be calculated based on actual canvas size
  let scaleFactor = 1;

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
    maxParticles: externalConfig.maxParticles || 300,
    dropWidth: externalConfig.dropWidth || 170,
    gravity: externalConfig.gravity || 0.2,
    boundaryRadius: externalConfig.boundaryRadius || 350,
    boundaryCenterY: externalConfig.boundaryCenterY ?? -90,
    tunnelWidth: externalConfig.tunnelWidth || 250,
    backgroundColor: externalConfig.backgroundColor || '#d6d6d6',
    backgroundOpacity: externalConfig.backgroundOpacity ?? 1.0,
    // Peg positioning offsets
    pegOffsetX: externalConfig.pegOffsetX ?? 0,
    pegOffsetY: externalConfig.pegOffsetY ?? 0,
    // Peg spacing multipliers (1.0 = default, <1.0 = closer, >1.0 = further apart)
    pegSpacingX: externalConfig.pegSpacingX ?? 1.0,
    pegSpacingY: externalConfig.pegSpacingY ?? 1.0,
    // Peg removal configuration
    // Format: { rowIndex: [colIndex1, colIndex2, ...] }
    // Example: { 0: [5, 10], 1: [3] } removes pegs at column 5 and 10 in row 0, column 3 in row 1
    removedPegs: externalConfig.removedPegs ?? {},
    // Peg selection mode for interactive removal
    pegSelectionMode: externalConfig.pegSelectionMode ?? false,
    // Visibility controls
    showBoundaries: externalConfig.showBoundaries ?? true,
    showPegs: externalConfig.showPegs ?? true,
    showClearanceZone: externalConfig.showClearanceZone ?? false,
    // Particle physics
    particleRestitution: externalConfig.particleRestitution ?? 0.1,
    particleFriction: externalConfig.particleFriction ?? 0.55,
    particleDensity: externalConfig.particleDensity ?? 1,
    particleFrictionAir: externalConfig.particleFrictionAir ?? 0.01,
    // Peg physics
    pegRestitution: externalConfig.pegRestitution ?? 0.8,
    pegFriction: externalConfig.pegFriction ?? 0,
    // Coin collider size (ratio of visual size)
    coinColliderRatio: externalConfig.coinColliderRatio ?? 0.87,
    // Particle drop shadow
    particleShadowBlur: externalConfig.particleShadowBlur ?? 27,
    particleShadowColor: externalConfig.particleShadowColor ?? '#000000',
    particleShadowOpacity: externalConfig.particleShadowOpacity ?? 0.5,
    particleShadowOffsetX: externalConfig.particleShadowOffsetX ?? -2,
    particleShadowOffsetY: externalConfig.particleShadowOffsetY ?? 10
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
      const collisionRadius = r * config.coinColliderRatio;
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
      const config = getConfig();

      // Convert hex color + opacity to rgba for shadow
      const hexColor = config.particleShadowColor.replace('#', '');
      const r = parseInt(hexColor.substr(0, 2), 16);
      const g = parseInt(hexColor.substr(2, 2), 16);
      const b = parseInt(hexColor.substr(4, 2), 16);

      // Draw shadow as a separate ellipse underneath
      p.push();
      p.translate(pos.x + config.particleShadowOffsetX, pos.y + config.particleShadowOffsetY);
      p.rotate(angle);
      p.noStroke();
      // Use canvas fillStyle to avoid HSB color mode interference
      p.drawingContext.fillStyle = `rgba(${r}, ${g}, ${b}, ${config.particleShadowOpacity})`;
      p.drawingContext.filter = `blur(${config.particleShadowBlur}px)`;
      p.drawingContext.beginPath();
      p.drawingContext.arc(0, 0, this.r, 0, Math.PI * 2);
      p.drawingContext.fill();
      p.drawingContext.filter = 'none';
      p.pop();

      // Draw the actual coin
      p.push();
      p.translate(pos.x, pos.y);
      p.rotate(angle);

      if (this.image) {
        p.imageMode(p.CENTER);
        const diameter = this.r * 2;
        const aspectRatio = this.image.width / this.image.height;
        const imgWidth = diameter;
        const imgHeight = diameter / aspectRatio;

        p.image(this.image, 0, 0, imgWidth, imgHeight);
      } else {
        p.fill(this.hue, 100, 100);
        p.noStroke();
        p.ellipse(0, 0, this.r * 2);
      }

      p.pop();
    }
  }

  // Plinko peg class
  class Plinko {
    constructor(x, y, r, row, col) {
      const config = getConfig();
      const options = {
        restitution: config.pegRestitution,
        friction: config.pegFriction,
        isStatic: true
      };
      this.body = Bodies.circle(x, y, r, options);
      this.body.label = "plinko";
      this.r = r;
      this.row = row;
      this.col = col;
      World.add(world, this.body);
    }

    show() {
      const config = getConfig();
      const pos = this.body.position;

      // Check if in selection mode
      if (config.pegSelectionMode) {
        // Highlight peg on hover
        const d = p.dist(p.mouseX, p.mouseY, pos.x, pos.y);
        if (d < this.r * 2) {
          p.fill(255, 200, 0, 150); // Yellow highlight
          p.stroke(255, 200, 0);
          p.strokeWeight(2);
        } else {
          p.noStroke();
          p.fill(127);
        }
      } else {
        p.noStroke();
        p.fill(127);
      }

      p.push();
      p.translate(pos.x, pos.y);
      p.ellipse(0, 0, this.r * 2);

      // Show row/col labels in selection mode
      if (config.pegSelectionMode) {
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(8);
        p.text(`${this.row},${this.col}`, 0, 0);
      }

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
    const baseSpacing = p.width / config.cols;

    // Apply spacing multipliers
    const spacingX = baseSpacing * config.pegSpacingX;
    const spacingY = baseSpacing * config.pegSpacingY;

    const centerX = p.width / 2;
    const centerY = (p.height / 2) + (config.boundaryCenterY * scaleFactor);
    const radius = config.boundaryRadius * scaleFactor;

    // Apply peg offsets (scaled to reference dimensions)
    const pegOffsetX = config.pegOffsetX * scaleFactor;
    const pegOffsetY = config.pegOffsetY * scaleFactor;

    // Calculate starting Y position at the top of the circle, accounting for offset
    // This ensures the peg grid starts inside the boundary even with offsets
    const startY = centerY - radius + Math.max(0, -pegOffsetY);

    for (let j = 0; j < config.rows; j++) {
      for (let i = 0; i < config.cols + 1; i++) {
        // Check if this peg should be removed
        const removedInRow = config.removedPegs[j] || [];
        if (removedInRow.includes(i)) {
          continue; // Skip this peg
        }

        let x = i * spacingX;
        if (j % 2 === 0) {
          x += spacingX / 2;
        }
        const y = startY + j * spacingY;

        // Apply offsets to peg position
        const offsetX = x + pegOffsetX;
        const offsetY = y + pegOffsetY;

        if (config.boundaryRadius <= 0) {
          plinkos.push(new Plinko(offsetX, offsetY, config.pegSize * scaleFactor, j, i));
        } else {
          const dx = offsetX - centerX;
          const dy = offsetY - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate clearance: particle size + peg size + safety margin (all scaled)
          const minClearance = (config.particleSize * scaleFactor) + (config.pegSize * scaleFactor) + (40 * scaleFactor);
          if (distance < radius - minClearance) {
            plinkos.push(new Plinko(offsetX, offsetY, config.pegSize * scaleFactor, j, i));
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
    const centerY = (p.height / 2) + (config.boundaryCenterY * scaleFactor);
    const radius = config.boundaryRadius * scaleFactor;
    const wallThickness = 30 * scaleFactor;
    const numSegments = 200;
    const tunnelAngleRange = Math.atan2((config.tunnelWidth * scaleFactor) / 2, radius) * 2;

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

  // Drop coins method (called by order processor)
  function dropCoins(tens, ones) {
    const centerX = p.width / 2;
    const config = getConfig();
    const particleRadius = config.particleSize * scaleFactor;
    
    // Calculate total amount
    const totalAmount = (tens * 10) + ones;
    
    // Load coin images for selection
    const oneDollarImages = particleImages.filter((_, i) => i === 0 || i === 1);   // 1_01.png, 1_02.png
    const tenDollarImages = particleImages.filter((_, i) => i === 2 || i === 3);  // 10_01.png, 10_02.png
    const fiftyDollarImages = particleImages.filter((_, i) => i === 4);           // 50_01.png
    
    // Smart coin selection based on total amount
    let fiftyCoins = 0;
    let tenCoins = 0;
    let oneCoins = 0;
    
    if (totalAmount >= 300) {
      // For amounts >= $300, use $50 coins efficiently
      fiftyCoins = Math.floor(totalAmount / 50);
      const remainder = totalAmount % 50;
      tenCoins = Math.floor(remainder / 10);
      oneCoins = remainder % 10;
      // console.log(`💰 High value purchase: ${fiftyCoins}×$50 + ${tenCoins}×$10 + ${oneCoins}×$1 = $${totalAmount}`);
    } else {
      // For amounts < $300, use the original tens/ones logic
      tenCoins = tens;
      oneCoins = ones;
    }
    
    // Drop $50 coins
    for (let i = 0; i < fiftyCoins; i++) {
      const randomOffset = (Math.random() - 0.5) * 2 * (config.dropWidth * scaleFactor);
      const particle = new Particle(centerX + randomOffset, -100, particleRadius);
      if (fiftyDollarImages.length > 0) {
        particle.image = fiftyDollarImages[0];
      }
      particles.push(particle);
    }
    
    // Drop $10 coins with random image selection
    for (let i = 0; i < tenCoins; i++) {
      const randomOffset = (Math.random() - 0.5) * 2 * (config.dropWidth * scaleFactor);
      const particle = new Particle(centerX + randomOffset, -100, particleRadius);
      if (tenDollarImages.length > 0) {
        particle.image = tenDollarImages[Math.floor(Math.random() * tenDollarImages.length)];
      }
      particles.push(particle);
    }
    
    // Drop $1 coins with random image selection
    for (let i = 0; i < oneCoins; i++) {
      const randomOffset = (Math.random() - 0.5) * 2 * (config.dropWidth * scaleFactor);
      const particle = new Particle(centerX + randomOffset, -100, particleRadius);
      if (oneDollarImages.length > 0) {
        particle.image = oneDollarImages[Math.floor(Math.random() * oneDollarImages.length)];
      }
      particles.push(particle);
    }
    
    // console.log(`💰 Dropped ${fiftyCoins}×$50 + ${tenCoins}×$10 + ${oneCoins}×$1 = ${fiftyCoins + tenCoins + oneCoins} coins (total: $${totalAmount})`);
  }

  // P5 sketch methods
  return {
    preload: () => {
      const imageFiles = ['1_01.png', '1_02.png', '10_01.png', '10_02.png', '50_01.png'];
      for (let filename of imageFiles) {
        particleImages.push(p.loadImage(`assets/${filename}`));
      }
    },

    setup: () => {
      p.createCanvas(container.offsetWidth, container.offsetHeight);
      p.colorMode(p.HSB, 100);

      // Calculate scale factor based on canvas width relative to reference
      scaleFactor = p.width / REFERENCE_WIDTH;
      // console.log(`Plinko scale factor: ${scaleFactor.toFixed(4)} (canvas: ${p.width}px, ref: ${REFERENCE_WIDTH}px)`);

      engine = Engine.create();
      world = engine.world;
      world.gravity.y = getConfig().gravity;

      createPlinkos();
      createBoundaries();

      // Create initial particle
      const centerX = p.width / 2;
      particles.push(new Particle(centerX, -100, getConfig().particleSize * scaleFactor));

      // console.log('Plinko game initialized:', p.width, 'x', p.height);
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
        const centerY = (p.height / 2) + (config.boundaryCenterY * scaleFactor);
        p.noStroke();

        // Convert hex color to RGB with opacity
        const hexColor = config.backgroundColor.replace('#', '');
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        const alpha = Math.floor(config.backgroundOpacity * 255);

        p.fill(r, g, b, alpha);
        p.ellipse(centerX, centerY, (config.boundaryRadius * scaleFactor) * 2);
      }

      // Spawn particles (DISABLED - controlled by dropCoins() method)
      // if (p.frameCount % config.particleSpawnRate === 0 && particles.length < config.maxParticles) {
      //   const centerX = p.width / 2;
      //   const randomOffset = (Math.random() - 0.5) * 2 * (config.dropWidth * scaleFactor);
      //   particles.push(new Particle(centerX + randomOffset, -100, config.particleSize * scaleFactor));
      // }

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

      // Draw clearance zone (debug visualization)
      if (config.showClearanceZone && config.boundaryRadius > 0) {
        const centerX = p.width / 2;
        const centerY = (p.height / 2) + (config.boundaryCenterY * scaleFactor);
        const radius = config.boundaryRadius * scaleFactor;
        const minClearance = (config.particleSize * scaleFactor) + (config.pegSize * scaleFactor) + (40 * scaleFactor);
        const clearanceRadius = radius - minClearance;

        p.push();
        p.stroke(255, 0, 0); // Bright red
        p.strokeWeight(3);
        p.noFill();
        p.ellipse(centerX, centerY, clearanceRadius * 2);
        
        // Add text label
        p.fill(255, 0, 0);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text(`Clearance Zone: ${clearanceRadius.toFixed(0)}px`, centerX, centerY - clearanceRadius - 20);
        p.pop();
      }
    },

    windowResized: () => {
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);

      // Recalculate scale factor on resize
      scaleFactor = p.width / REFERENCE_WIDTH;
      // console.log(`Plinko resized - new scale factor: ${scaleFactor.toFixed(4)}`);

      regenerate();
    },

    mousePressed: () => {
      const config = getConfig();

      // Only handle clicks in selection mode
      if (!config.pegSelectionMode) return;

      // Check if we clicked on a peg
      for (let plinko of plinkos) {
        const pos = plinko.body.position;
        const d = p.dist(p.mouseX, p.mouseY, pos.x, pos.y);

        if (d < plinko.r * 2) {
          // Toggle this peg in removedPegs
          const row = plinko.row;
          const col = plinko.col;

          // Create a copy of removedPegs to modify
          const newRemovedPegs = { ...externalConfig.removedPegs };

          if (!newRemovedPegs[row]) {
            newRemovedPegs[row] = [];
          } else {
            newRemovedPegs[row] = [...newRemovedPegs[row]];
          }

          const colIndex = newRemovedPegs[row].indexOf(col);
          if (colIndex > -1) {
            // Peg is marked for removal, restore it
            newRemovedPegs[row].splice(colIndex, 1);
            if (newRemovedPegs[row].length === 0) {
              delete newRemovedPegs[row];
            }
            // console.log(`✅ Restored peg at row ${row}, col ${col}`);
          } else {
            // Add peg to removal list
            newRemovedPegs[row].push(col);
            // console.log(`❌ Marked peg for removal: row ${row}, col ${col}`);
          }

          // Update external config and regenerate
          externalConfig.removedPegs = newRemovedPegs;
          regenerate();

          // Log current removed pegs config
          // console.log('Current removedPegs config:', JSON.stringify(newRemovedPegs, null, 2));

          break; // Only handle one peg click at a time
        }
      }
    },

    // API for external control
    dropCoins: dropCoins
  };
}
