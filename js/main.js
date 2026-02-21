/* ============================================
   idfkit Landing Page — 3D Line Animation

   A building "shoebox" energy model rendered
   as animated wireframe lines. Heat flows are
   shown as red/warm strings; cold flows as
   blue/cool strings — visualizing thermal
   energy transfer through the building envelope.
   ============================================ */

(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  // ── WebGL support check ─────────────────────────────
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL not supported');
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }

  // ── Renderer ───────────────────────────────────────
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  camera.position.set(0, 2.5, 14);
  camera.lookAt(0, 0, 0);

  let sceneOffsetX = 0;

  // ── Mouse ──────────────────────────────────────────
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  // ── Color palette: reds→blues for heat→cold ────────
  const C = {
    // Warm (heat gain / solar)
    warmHot:   new THREE.Color(0xff3333),  // intense red
    warm:      new THREE.Color(0xff6b4a),  // red-orange
    warmMid:   new THREE.Color(0xf59e0b),  // amber
    warmGlow:  new THREE.Color(0xff8a65),  // soft warm

    // Cool (heat loss / cold)
    coolDeep:  new THREE.Color(0x1d4ed8),  // deep blue
    cool:      new THREE.Color(0x3b82f6),  // blue
    coolLight: new THREE.Color(0x60a5fa),  // light blue
    coolIce:   new THREE.Color(0x93c5fd),  // ice blue

    // Neutral / structure
    structure: new THREE.Color(0x94a3b8),  // slate
    structDim: new THREE.Color(0x475569),  // dim slate
    grid:      new THREE.Color(0x1e293b),  // dark slate
    white:     new THREE.Color(0xe2e8f0),  // near white
  };

  // ── Main group ─────────────────────────────────────
  const world = new THREE.Group();
  scene.add(world);

  // ============================================================
  //  1. GROUND GRID — perspective grid fading to edges
  // ============================================================
  function buildGroundGrid() {
    const g = new THREE.Group();
    const size = 24, div = 48, y = -1.5;
    const step = size / div;

    for (let i = 0; i <= div; i++) {
      const pos = -size / 2 + i * step;
      const fade = 1 - Math.pow(Math.abs(pos) / (size / 2), 2);
      const op = Math.max(0.015, 0.09 * fade);

      // x-parallel
      const gx = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size / 2, y, pos),
        new THREE.Vector3(size / 2, y, pos),
      ]);
      const lx = new THREE.Line(gx, new THREE.LineBasicMaterial({
        color: C.grid, transparent: true, opacity: 0,
      }));
      lx.userData = { delay: 0.3 + i * 0.015, target: op };
      g.add(lx);

      // z-parallel
      const gz = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pos, y, -size / 2),
        new THREE.Vector3(pos, y, size / 2),
      ]);
      const lz = new THREE.Line(gz, new THREE.LineBasicMaterial({
        color: C.grid, transparent: true, opacity: 0,
      }));
      lz.userData = { delay: 0.3 + i * 0.015, target: op };
      g.add(lz);
    }
    return g;
  }

  // ============================================================
  //  2. SHOEBOX WIREFRAME — the building envelope
  // ============================================================
  function buildShoebox() {
    const g = new THREE.Group();
    const w = 4.5, h = 2.8, d = 3.2;
    const hw = w / 2, hh = h / 2, hd = d / 2;

    const verts = [
      [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd],
      [-hw, -hh, hd],  [hw, -hh, hd],  [hw, hh, hd],  [-hw, hh, hd],
    ];

    const edges = [
      [0,1],[1,2],[2,3],[3,0],  // back face
      [4,5],[5,6],[6,7],[7,4],  // front face
      [0,4],[1,5],[2,6],[3,7],  // connecting edges
    ];

    // Roof ridge line
    const roofPeak = 0.7;

    edges.forEach((e, i) => {
      const a = new THREE.Vector3(...verts[e[0]]);
      const b = new THREE.Vector3(...verts[e[1]]);
      const segs = 32;
      const pts = [];
      for (let j = 0; j <= segs; j++) {
        pts.push(new THREE.Vector3().lerpVectors(a, b, j / segs));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);

      // Gradient: warm at top edges, cool at bottom
      const cols = new Float32Array((segs + 1) * 3);
      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        const pt = pts[j];
        // Blend based on height: bottom=blue, top=red
        const heightT = (pt.y + hh) / h; // 0 at bottom, 1 at top
        const c = new THREE.Color().lerpColors(C.coolLight, C.warm, heightT * 0.5);
        // Desaturate toward structure color
        c.lerp(C.structure, 0.4);
        cols[j * 3] = c.r;
        cols[j * 3 + 1] = c.g;
        cols[j * 3 + 2] = c.b;
      }
      geom.setAttribute('color', new THREE.BufferAttribute(cols, 3));

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0,
      });
      const line = new THREE.Line(geom, mat);
      line.userData = { delay: 0.4 + i * 0.07, target: 1.0 };
      g.add(line);
    });

    return g;
  }

  // ============================================================
  //  3. INTERIOR ZONES — partition walls as dashed lines
  // ============================================================
  function buildInterior() {
    const g = new THREE.Group();
    const w = 4.5, h = 2.8, d = 3.2;
    const hw = w / 2, hh = h / 2, hd = d / 2;

    const partitions = [
      // Two vertical partitions creating 3 zones
      { pairs: [
        [[-hw * 0.35, -hh, -hd], [-hw * 0.35, -hh, hd]],
        [[-hw * 0.35, hh, -hd], [-hw * 0.35, hh, hd]],
        [[-hw * 0.35, -hh, -hd], [-hw * 0.35, hh, -hd]],
        [[-hw * 0.35, -hh, hd], [-hw * 0.35, hh, hd]],
      ]},
      { pairs: [
        [[hw * 0.35, -hh, -hd], [hw * 0.35, -hh, hd]],
        [[hw * 0.35, hh, -hd], [hw * 0.35, hh, hd]],
        [[hw * 0.35, -hh, -hd], [hw * 0.35, hh, -hd]],
        [[hw * 0.35, -hh, hd], [hw * 0.35, hh, hd]],
      ]},
    ];

    let idx = 0;
    partitions.forEach((p) => {
      p.pairs.forEach((pair) => {
        const a = new THREE.Vector3(...pair[0]);
        const b = new THREE.Vector3(...pair[1]);
        const segs = 16;
        const pts = [];
        for (let j = 0; j <= segs; j++) {
          pts.push(new THREE.Vector3().lerpVectors(a, b, j / segs));
        }
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
          color: C.structDim, transparent: true, opacity: 0,
        });
        const line = new THREE.Line(geom, mat);
        line.userData = { delay: 1.2 + idx * 0.05, target: 0.25 };
        g.add(line);
        idx++;
      });
    });

    return g;
  }

  // ============================================================
  //  4. HEAT FLOW STRINGS — warm red strings (solar, internal)
  // ============================================================
  function buildHeatStrings() {
    const g = new THREE.Group();
    const strings = [];

    const paths = [
      // Solar rays from upper right — primary cluster
      { a: [7, 7, -2],     b: [1.8, 1.4, 0.3],   c1: C.warmHot,  c2: C.warmMid },
      { a: [6, 6.5, 0],    b: [0.8, 1.4, 1.0],   c1: C.warmHot,  c2: C.warm },
      { a: [8, 6, -1],     b: [2.2, 1.4, -0.8],  c1: C.warmHot,  c2: C.warmMid },
      { a: [5.5, 7, 1],    b: [-0.5, 1.4, 1.2],  c1: C.warm,     c2: C.warmGlow },
      { a: [7.5, 5.5, -3], b: [1.5, 1.4, -1.5],  c1: C.warmHot,  c2: C.warm },

      // Additional solar rays — wider spread
      { a: [9, 7.5, -1.5], b: [2.0, 1.4, -0.2],  c1: C.warmHot,  c2: C.warmGlow },
      { a: [6.5, 8, 1.5],  b: [0.2, 1.4, 0.8],   c1: C.warm,     c2: C.warmMid },
      { a: [8.5, 5, -4],   b: [1.0, 1.4, -1.2],  c1: C.warmHot,  c2: C.warm },
      { a: [5, 8.5, -0.5], b: [-1.2, 1.4, 0.5],  c1: C.warm,     c2: C.warmGlow },
      { a: [7, 5.8, 2],    b: [0.5, 1.4, 1.5],   c1: C.warmHot,  c2: C.warmMid },
      { a: [9.5, 6.5, 0],  b: [2.25, 1.0, 0.6],  c1: C.warmHot,  c2: C.warm },
      { a: [6, 9, -1],     b: [-0.8, 1.4, -0.3],  c1: C.warm,     c2: C.warmGlow },

      // Internal heat rising (occupancy, equipment)
      { a: [-0.5, -1.5, 0],   b: [-0.5, 0.5, 0.3],  c1: C.warmGlow, c2: C.warmMid },
      { a: [1.0, -1.5, 0.5],  b: [1.0, 0.5, 0.8],   c1: C.warmGlow, c2: C.warm },
      { a: [0.3, -1.5, -0.5], b: [0.3, 0.8, -0.2],  c1: C.warmGlow, c2: C.warmMid },
      { a: [-1.2, -1.5, 0.8], b: [-1.2, 0.3, 1.0],  c1: C.warmGlow, c2: C.warm },
      { a: [1.5, -1.5, -0.3], b: [1.5, 0.6, 0.0],   c1: C.warmGlow, c2: C.warmMid },
    ];

    paths.forEach((p, i) => {
      const a = new THREE.Vector3(...p.a);
      const b = new THREE.Vector3(...p.b);
      const segs = 50;
      const pts = [];

      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        const pt = new THREE.Vector3().lerpVectors(a, b, t);
        // Add a sine curve for organic feel
        const bulge = Math.sin(t * Math.PI) * 0.4;
        const perp = new THREE.Vector3().crossVectors(
          new THREE.Vector3().subVectors(b, a).normalize(),
          new THREE.Vector3(0, 1, 0)
        ).normalize();
        pt.add(perp.multiplyScalar(bulge * (i % 2 === 0 ? 1 : -1) * 0.3));
        pts.push(pt);
      }

      const geom = new THREE.BufferGeometry().setFromPoints(pts);

      // Color gradient
      const cols = new Float32Array((segs + 1) * 3);
      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        const c = new THREE.Color().lerpColors(p.c1, p.c2, t);
        cols[j * 3] = c.r;
        cols[j * 3 + 1] = c.g;
        cols[j * 3 + 2] = c.b;
      }
      geom.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      // Store original colors for animation
      const origCols = new Float32Array(cols);

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0,
      });
      const line = new THREE.Line(geom, mat);
      line.userData = {
        delay: 1.6 + i * 0.1,
        target: 0.65,
        speed: 0.8 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        segs,
      };
      g.add(line);
      strings.push({ line, geom, origCols, segs });
    });

    return { group: g, strings };
  }

  // ============================================================
  //  5. COLD FLOW STRINGS — cool blue strings (heat loss)
  // ============================================================
  function buildColdStrings() {
    const g = new THREE.Group();
    const strings = [];

    const paths = [
      // Heat loss through walls (outward from building)
      { a: [2.25, 0, 1.6],      b: [4.5, 0.5, 4.0],    c1: C.cool,     c2: C.coolIce },
      { a: [-2.25, 0.5, 1.6],   b: [-4.5, 1.0, 3.5],   c1: C.cool,     c2: C.coolLight },
      { a: [0, 1.4, 1.6],       b: [0, 3.5, 4.5],       c1: C.coolDeep, c2: C.coolIce },
      { a: [2.25, 0.8, -1.6],   b: [5, 1.2, -3.5],      c1: C.cool,     c2: C.coolIce },
      { a: [-2.25, -0.3, -1.6], b: [-4, -0.5, -4],       c1: C.coolDeep, c2: C.coolLight },

      // Additional wall heat loss — more directions
      { a: [2.25, 1.0, 0.5],    b: [5.5, 1.8, 2.0],     c1: C.cool,     c2: C.coolIce },
      { a: [-2.25, 0.8, -0.5],  b: [-5.5, 1.5, -2.5],   c1: C.cool,     c2: C.coolLight },
      { a: [1.5, 1.4, -1.6],    b: [3.5, 3.0, -4.0],    c1: C.coolDeep, c2: C.coolIce },
      { a: [-1.5, 1.4, 1.6],    b: [-3.5, 3.0, 4.0],    c1: C.coolDeep, c2: C.coolLight },
      { a: [2.25, -0.5, 0],     b: [5.0, -0.8, 1.5],    c1: C.cool,     c2: C.coolIce },
      { a: [-2.25, -0.5, 0],    b: [-5.0, -0.8, -1.5],  c1: C.cool,     c2: C.coolLight },
      { a: [0, 1.4, -1.6],      b: [0, 3.8, -5.0],      c1: C.coolDeep, c2: C.coolIce },

      // Ground heat exchange (downward)
      { a: [-1.2, -1.5, 0],     b: [-1.8, -5, 0.5],     c1: C.coolLight, c2: C.coolDeep },
      { a: [1.2, -1.5, 0.5],    b: [1.8, -4.5, 1.0],    c1: C.coolLight, c2: C.coolDeep },
      { a: [0, -1.5, -0.5],     b: [0.3, -4, -1.0],     c1: C.cool,      c2: C.coolDeep },
      { a: [-0.5, -1.5, 1.0],   b: [-0.8, -5.5, 1.5],   c1: C.coolLight, c2: C.coolDeep },
      { a: [0.8, -1.5, -1.0],   b: [1.2, -5.0, -1.5],   c1: C.cool,      c2: C.coolDeep },
      { a: [-1.8, -1.5, -0.8],  b: [-2.5, -4.8, -1.2],  c1: C.coolLight, c2: C.coolDeep },
    ];

    paths.forEach((p, i) => {
      const a = new THREE.Vector3(...p.a);
      const b = new THREE.Vector3(...p.b);
      const segs = 50;
      const pts = [];

      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        const pt = new THREE.Vector3().lerpVectors(a, b, t);
        const bulge = Math.sin(t * Math.PI) * 0.35;
        const perp = new THREE.Vector3().crossVectors(
          new THREE.Vector3().subVectors(b, a).normalize(),
          new THREE.Vector3(0, 1, 0)
        ).normalize();
        pt.add(perp.multiplyScalar(bulge * (i % 2 === 0 ? -1 : 1) * 0.3));
        pts.push(pt);
      }

      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const cols = new Float32Array((segs + 1) * 3);
      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        const c = new THREE.Color().lerpColors(p.c1, p.c2, t);
        cols[j * 3] = c.r;
        cols[j * 3 + 1] = c.g;
        cols[j * 3 + 2] = c.b;
      }
      geom.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const origCols = new Float32Array(cols);

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0,
      });
      const line = new THREE.Line(geom, mat);
      line.userData = {
        delay: 2.0 + i * 0.1,
        target: 0.55,
        speed: 0.6 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        segs,
      };
      g.add(line);
      strings.push({ line, geom, origCols, segs });
    });

    return { group: g, strings };
  }

  // ============================================================
  //  6. AMBIENT PARTICLES — floating data points
  // ============================================================
  function buildParticles() {
    const count = 240;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const vel = [];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 8;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 0.5;
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Color: mix of warm and cool
      const p = Math.random();
      let c;
      if (p < 0.35)      c = C.warm.clone().lerp(C.warmHot, Math.random());
      else if (p < 0.7)  c = C.cool.clone().lerp(C.coolIce, Math.random());
      else               c = C.structure.clone();
      cols[i * 3]     = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;

      vel.push({
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.002,
        vz: (Math.random() - 0.5) * 0.003,
        ph: Math.random() * Math.PI * 2,
      });
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });

    const pts = new THREE.Points(geom, mat);
    pts.userData = { delay: 2.5, target: 0.55 };
    return { points: pts, vel };
  }

  // ============================================================
  //  7. CONNECTION LINES — faint network mesh
  // ============================================================
  function buildConnections() {
    const g = new THREE.Group();
    const n = 65;
    const nodes = [];

    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 4 + Math.random() * 6;
      nodes.push(new THREE.Vector3(
        r * Math.sin(ph) * Math.cos(th),
        r * Math.sin(ph) * Math.sin(th) - 0.5,
        r * Math.cos(ph)
      ));
    }

    let count = 0;
    for (let i = 0; i < n && count < 80; i++) {
      for (let j = i + 1; j < n && count < 80; j++) {
        const d = nodes[i].distanceTo(nodes[j]);
        if (d < 3.8) {
          const geom = new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[j]]);

          // Color based on position: warm if above, cool if below
          const avgY = (nodes[i].y + nodes[j].y) / 2;
          const c = avgY > 0
            ? C.warm.clone().lerp(C.structure, 0.7)
            : C.cool.clone().lerp(C.structure, 0.7);

          const mat = new THREE.LineBasicMaterial({
            color: c, transparent: true, opacity: 0,
          });
          const line = new THREE.Line(geom, mat);
          line.userData = {
            delay: 2.4 + count * 0.015,
            target: 0.04 + Math.random() * 0.05,
          };
          g.add(line);
          count++;
        }
      }
    }
    return g;
  }

  // ============================================================
  //  8. SCAN LINE — horizontal thermal scan
  // ============================================================
  function buildScanLine() {
    const w = 6;
    const segs = 40;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      pts.push(new THREE.Vector3(-w / 2 + (w * i / segs), 0, 0));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);

    const cols = new Float32Array((segs + 1) * 3);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      // Red in center, blue at edges
      const c = new THREE.Color().lerpColors(C.coolLight, C.warm, Math.sin(t * Math.PI));
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0,
    });
    const line = new THREE.Line(geom, mat);
    line.userData = { delay: 1.5, target: 0.2 };
    return line;
  }

  // ============================================================
  //  9. CONVECTION ARCS — looping airflow lines inside building
  // ============================================================
  function buildConvectionArcs() {
    const g = new THREE.Group();
    const strings = [];
    const w = 4.5, h = 2.8, d = 3.2;
    const hw = w / 2, hh = h / 2, hd = d / 2;

    // Circular-ish arcs inside the building representing air movement
    const arcs = [
      // Left zone — clockwise convection loop
      { cx: -hw * 0.6, cz: 0, rx: 0.6, ry: 1.0, startAngle: 0, dir: 1,
        c1: C.warmGlow, c2: C.coolLight },
      // Center zone — counter-clockwise
      { cx: 0, cz: 0.2, rx: 0.8, ry: 1.1, startAngle: Math.PI * 0.5, dir: -1,
        c1: C.warm, c2: C.cool },
      // Right zone — clockwise
      { cx: hw * 0.6, cz: -0.1, rx: 0.6, ry: 1.0, startAngle: Math.PI, dir: 1,
        c1: C.warmGlow, c2: C.coolLight },
      // Front-to-back draft
      { cx: 0, cz: 0, rx: 1.2, ry: 0.5, startAngle: 0, dir: 1,
        c1: C.cool, c2: C.warm },
    ];

    arcs.forEach((arc, i) => {
      const segs = 60;
      const pts = [];
      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        const angle = arc.startAngle + arc.dir * t * Math.PI * 1.6;
        const x = arc.cx + Math.cos(angle) * arc.rx;
        const y = Math.sin(angle) * arc.ry * 0.6;
        const z = arc.cz + Math.sin(angle * 0.5) * 0.3;
        pts.push(new THREE.Vector3(x, y, z));
      }

      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const cols = new Float32Array((segs + 1) * 3);
      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        const c = new THREE.Color().lerpColors(arc.c1, arc.c2, t);
        cols[j * 3] = c.r;
        cols[j * 3 + 1] = c.g;
        cols[j * 3 + 2] = c.b;
      }
      geom.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const origCols = new Float32Array(cols);

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0,
      });
      const line = new THREE.Line(geom, mat);
      line.userData = {
        delay: 2.6 + i * 0.12,
        target: 0.3,
        speed: 0.5 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        segs,
      };
      g.add(line);
      strings.push({ line, geom, origCols, segs });
    });

    return { group: g, strings };
  }

  // ============================================================
  //  10. RADIATION RINGS — concentric heat radiation circles
  // ============================================================
  function buildRadiationRings() {
    const g = new THREE.Group();
    const rings = [
      { y: 1.4, r: 2.8,  c: C.warmMid,   op: 0.12 },
      { y: 1.4, r: 3.6,  c: C.warm,      op: 0.08 },
      { y: 1.4, r: 4.5,  c: C.warmGlow,  op: 0.05 },
      { y: -1.5, r: 2.5, c: C.coolLight,  op: 0.10 },
      { y: -1.5, r: 3.4, c: C.cool,       op: 0.07 },
      { y: -1.5, r: 4.2, c: C.coolDeep,   op: 0.04 },
    ];

    rings.forEach((ring, i) => {
      const segs = 80;
      const pts = [];
      for (let j = 0; j <= segs; j++) {
        const angle = (j / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(
          Math.cos(angle) * ring.r,
          ring.y,
          Math.sin(angle) * ring.r
        ));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: ring.c, transparent: true, opacity: 0,
      });
      const line = new THREE.Line(geom, mat);
      line.userData = { delay: 2.8 + i * 0.1, target: ring.op };
      g.add(line);
    });

    return g;
  }

  // ============================================================
  //  11. VERTICAL SCAN LINES — multiple sweeping thermal scans
  // ============================================================
  function buildVerticalScans() {
    const g = new THREE.Group();
    const scans = [];
    const configs = [
      { h: 5, x: -1.5, z: 1.61 },
      { h: 4, x: 1.8,  z: 1.61 },
      { h: 3.5, x: 0, z: -1.61 },
    ];

    configs.forEach((cfg, i) => {
      const segs = 30;
      const pts = [];
      for (let j = 0; j <= segs; j++) {
        pts.push(new THREE.Vector3(0, -cfg.h / 2 + (cfg.h * j / segs), 0));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);

      const cols = new Float32Array((segs + 1) * 3);
      for (let j = 0; j <= segs; j++) {
        const t = j / segs;
        const c = new THREE.Color().lerpColors(C.coolDeep, C.warmHot, t);
        cols[j * 3] = c.r;
        cols[j * 3 + 1] = c.g;
        cols[j * 3 + 2] = c.b;
      }
      geom.setAttribute('color', new THREE.BufferAttribute(cols, 3));

      const mat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0,
      });
      const line = new THREE.Line(geom, mat);
      line.userData = { delay: 1.8 + i * 0.15, target: 0.15 };
      line.position.z = cfg.z;
      g.add(line);
      scans.push({ line, baseX: cfg.x, speed: 0.25 + i * 0.1 });
    });

    return { group: g, scans };
  }

  // ============================================================
  //  12. ENVELOPE GLOW LINES — secondary wireframe halo
  // ============================================================
  function buildEnvelopeGlow() {
    const g = new THREE.Group();
    const w = 4.5, h = 2.8, d = 3.2;

    // Multiple glow shells at increasing scales for a bloom effect
    const shells = [
      { scale: 1.04, color: C.coolLight, target: 0.35, linewidth: 1 },
      { scale: 1.10, color: C.cool,      target: 0.20, linewidth: 1 },
      { scale: 1.18, color: C.coolDeep,  target: 0.10, linewidth: 1 },
    ];

    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];

    shells.forEach((shell, si) => {
      const hw = w / 2 * shell.scale, hh = h / 2 * shell.scale, hd = d / 2 * shell.scale;
      const verts = [
        [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd],
        [-hw, -hh, hd],  [hw, -hh, hd],  [hw, hh, hd],  [-hw, hh, hd],
      ];

      edges.forEach((e, i) => {
        const a = new THREE.Vector3(...verts[e[0]]);
        const b = new THREE.Vector3(...verts[e[1]]);
        const segs = 20;
        const pts = [];
        for (let j = 0; j <= segs; j++) {
          pts.push(new THREE.Vector3().lerpVectors(a, b, j / segs));
        }
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
          color: shell.color, transparent: true, opacity: 0,
        });
        const line = new THREE.Line(geom, mat);
        line.userData = { delay: 1.0 + si * 0.3 + i * 0.04, target: shell.target };
        g.add(line);
      });
    });

    return g;
  }

  // ============================================================
  //  BUILD SCENE
  // ============================================================
  const grid       = buildGroundGrid();
  const shoebox    = buildShoebox();
  const interior   = buildInterior();
  const { group: heatGroup, strings: heatStrings } = buildHeatStrings();
  const { group: coldGroup, strings: coldStrings } = buildColdStrings();
  const { points: particles, vel: particleVel }    = buildParticles();
  const connections = buildConnections();
  const scanLine   = buildScanLine();
  const { group: convectionGroup, strings: convectionStrings } = buildConvectionArcs();
  const radiationRings = buildRadiationRings();
  const { group: vertScansGroup, scans: vertScans } = buildVerticalScans();
  const envelopeGlow = buildEnvelopeGlow();

  world.add(grid);
  world.add(connections);
  world.add(envelopeGlow);
  world.add(shoebox);
  world.add(interior);
  world.add(convectionGroup);
  world.add(heatGroup);
  world.add(coldGroup);
  world.add(radiationRings);
  world.add(particles);
  world.add(scanLine);
  world.add(vertScansGroup);

  // ============================================================
  //  ANIMATION
  // ============================================================
  let t0 = null;
  let sy = 0;

  // Fade-in logic
  function fadeIn(obj, elapsed) {
    if (!obj.userData || obj.userData.delay === undefined) return;
    const dt = Math.max(0, elapsed - obj.userData.delay);
    if (dt <= 0) return;
    const p = Math.min(1, dt / 0.9);
    const eased = 1 - Math.pow(1 - p, 3);
    obj.material.opacity = eased * obj.userData.target;
  }

  function walkAndFade(group, elapsed) {
    group.children.forEach((c) => {
      if (c.material) fadeIn(c, elapsed);
      if (c.children && c.children.length) walkAndFade(c, elapsed);
    });
  }

  // Flowing brightness wave on energy strings
  function pulseStrings(strings, time) {
    strings.forEach(({ line, geom, origCols, segs }) => {
      const { speed, phase } = line.userData;
      const colors = geom.attributes.color;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        // Traveling wave
        const wave = Math.sin((t * 8 - time * speed * 2.5 + phase) * Math.PI) * 0.5 + 0.5;
        const brightness = 0.35 + wave * 0.65;
        colors.array[i * 3]     = origCols[i * 3] * brightness;
        colors.array[i * 3 + 1] = origCols[i * 3 + 1] * brightness;
        colors.array[i * 3 + 2] = origCols[i * 3 + 2] * brightness;
      }
      colors.needsUpdate = true;
    });
  }

  // Float particles
  function moveParticles(time) {
    const p = particles.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = particleVel[i];
      p.array[i * 3]     += Math.sin(time * 0.5 + v.ph) * v.vx;
      p.array[i * 3 + 1] += Math.cos(time * 0.3 + v.ph) * v.vy;
      p.array[i * 3 + 2] += Math.sin(time * 0.4 + v.ph * 2) * v.vz;
    }
    p.needsUpdate = true;
  }

  // Scan line sweep
  function moveScan(time) {
    scanLine.position.y = Math.sin(time * 0.35) * 2.0;
    scanLine.position.z = 1.61;
  }

  // ── RENDER LOOP ────────────────────────────────────
  function loop(ts) {
    requestAnimationFrame(loop);
    if (!t0) t0 = ts;
    const elapsed = (ts - t0) / 1000;

    // Smooth mouse
    mouse.x += (mouse.tx - mouse.x) * 0.025;
    mouse.y += (mouse.ty - mouse.y) * 0.025;

    // Entrance fade-in
    walkAndFade(world, elapsed);

    // Animations
    if (elapsed > 1.5) {
      pulseStrings(heatStrings, elapsed);
      pulseStrings(coldStrings, elapsed);
      pulseStrings(convectionStrings, elapsed);
    }
    moveParticles(elapsed);
    moveScan(elapsed);

    // Vertical scan lines sweep horizontally
    vertScans.forEach(({ line, baseX, speed }) => {
      line.position.x = baseX + Math.sin(elapsed * speed) * 2.5;
    });

    // Gentle rotation + mouse parallax
    world.rotation.y = Math.sin(elapsed * 0.08) * 0.35 + mouse.x * 0.12;
    world.rotation.x = Math.sin(elapsed * 0.06) * 0.06 + mouse.y * 0.06 - 0.08;

    world.position.x = sceneOffsetX;

    // Subtle breathing
    const br = 1 + Math.sin(elapsed * 0.4) * 0.008;
    shoebox.scale.set(br, br, br);

    // Envelope glow pulse — gentle oscillating brightness
    const glowPulse = 0.8 + Math.sin(elapsed * 0.6) * 0.2;
    envelopeGlow.children.forEach((child) => {
      if (child.material && child.userData && child.userData.target !== undefined) {
        child.userData._glowMul = glowPulse;
      }
    });

    // Scroll parallax & fade
    const scrollFade = Math.max(0, 1 - sy / (window.innerHeight * 0.55));
    world.position.y = -sy * 0.0015;

    // Apply scroll fade to all visible materials
    world.traverse((obj) => {
      if (obj.material && obj.userData && obj.userData.target !== undefined) {
        if (elapsed > (obj.userData.delay || 0) + 0.9) {
          const glowMul = obj.userData._glowMul || 1;
          obj.material.opacity = obj.userData.target * scrollFade * glowMul;
        }
      }
    });

    renderer.render(scene, camera);
  }

  loop(0);

  // ── Events ─────────────────────────────────────────
  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('scroll', () => { sy = window.scrollY; }, { passive: true });

  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
})();

// ============================================================
//  UI INTERACTIONS
// ============================================================

// ── Navbar scroll state ──────────────────────────────
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;
  let tick = false;
  window.addEventListener('scroll', () => {
    if (!tick) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        tick = false;
      });
      tick = true;
    }
  }, { passive: true });
})();

// ── Scroll-triggered reveal ──────────────────────────
(function () {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  els.forEach((el) => obs.observe(el));
})();

// ── Code tab switching ───────────────────────────────
(function () {
  const btns = document.querySelectorAll('.code-tab-btn');
  const panels = document.querySelectorAll('.code-panel');
  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      panels.forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const t = document.querySelector(`[data-panel="${btn.dataset.tab}"]`);
      if (t) t.classList.add('active');
    });
  });
})();

// ── Smooth anchor scrolling ──────────────────────────
(function () {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
