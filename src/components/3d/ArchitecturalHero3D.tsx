'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { Sparkles, Eye, ArrowDown, Rotate3d, Layers } from 'lucide-react';

// Hotspot feature points corresponding to scroll progression
const ARCHITECTURAL_STAGES = [
  {
    step: '01',
    title: 'Monolithic Travertine Core',
    subtitle: 'Bedrock Foundation',
    description:
      'Massive chiseled travertine masses anchor the residence into the coastal topography, establishing permanent thermal mass and structural poise.',
    camPos: { x: 18, y: 12, z: 22 },
    target: { x: 0, y: 3, z: 0 },
    featurePos: { x: -4, y: 4, z: 1 },
    timeRange: [0.0, 0.28],
  },
  {
    step: '02',
    title: 'Cantilevered Timber Canopy',
    subtitle: 'Brise-Soleil Engineering',
    description:
      'Twelve-metre unsupported overhangs shielded with rhythmic Swiss larch louvers provide passive solar shading and dramatic shadow play throughout the day.',
    camPos: { x: -14, y: 10, z: 16 },
    target: { x: 2, y: 5, z: -1 },
    featurePos: { x: 0, y: 7, z: 3 },
    timeRange: [0.28, 0.54],
  },
  {
    step: '03',
    title: 'Seamless Thermal Glazing',
    subtitle: 'Frameless Sky-Frame Apertures',
    description:
      'Motorised triple-glazed glass sheets disappear into recessed wall cavities, dissolving the spatial boundary between salon and open-air loggia.',
    camPos: { x: -5, y: 4.5, z: 11 },
    target: { x: -1, y: 3.5, z: 0 },
    featurePos: { x: -2, y: 3, z: 4 },
    timeRange: [0.54, 0.78],
  },
  {
    step: '04',
    title: 'Infinity Reflecting Watercourt',
    subtitle: 'Reflective Surface & Cooling',
    description:
      'A 24-metre mirror-calm reflecting reservoir lined with honed Vals quartzite reflects the sky, lowering ambient microclimate temperatures naturally.',
    camPos: { x: 10, y: 3.5, z: 12 },
    target: { x: -2, y: 1.5, z: 0 },
    featurePos: { x: 4, y: 0.5, z: 5 },
    timeRange: [0.78, 1.0],
  },
];

export default function ArchitecturalHero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Check WebGL availability
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (!canvasRef.current || !containerRef.current) return;

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3ede3);
    scene.fog = new THREE.FogExp2(0xf3ede3, 0.018);

    const width = canvasRef.current.clientWidth || window.innerWidth;
    const height = canvasRef.current.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 120);
    camera.position.set(18, 12, 22);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // --- LIGHTING ---
    // Warm low-angle architectural sun
    const sunLight = new THREE.DirectionalLight(0xffeedd, 2.6);
    sunLight.position.set(35, 40, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Sky and Ground ambient bounce
    const hemiLight = new THREE.HemisphereLight(0xebe2d4, 0xd8c8b2, 1.2);
    scene.add(hemiLight);

    // Warm Interior Glows (soft point lights inside glass pavilions)
    const interiorLight1 = new THREE.PointLight(0xffa855, 3.5, 15);
    interiorLight1.position.set(-2, 3.5, 0);
    scene.add(interiorLight1);

    const interiorLight2 = new THREE.PointLight(0xffaa66, 2.8, 14);
    interiorLight2.position.set(2, 7.2, 0);
    scene.add(interiorLight2);

    // --- PROCEDURAL ARCHITECTURAL VILLA MODEL ---
    const rootVilla = new THREE.Group();
    scene.add(rootVilla);

    // Materials
    const travertineMat = new THREE.MeshStandardMaterial({
      color: 0xdfd4c4,
      roughness: 0.85,
      metalness: 0.05,
    });

    const darkGraniteMat = new THREE.MeshStandardMaterial({
      color: 0x24221c,
      roughness: 0.9,
      metalness: 0.1,
    });

    const warmLarchWoodMat = new THREE.MeshStandardMaterial({
      color: 0x9e6844,
      roughness: 0.7,
      metalness: 0.05,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x8ab2b8,
      transparent: true,
      opacity: 0.42,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.7,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x47787f,
      roughness: 0.06,
      metalness: 0.35,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb58e57,
      roughness: 0.35,
      metalness: 0.8,
    });

    // 1. Monolithic Ground Podium / Terraced Base
    const podiumGeo = new THREE.BoxGeometry(32, 1.2, 28);
    const podium = new THREE.Mesh(podiumGeo, travertineMat);
    podium.position.set(0, -0.6, 0);
    podium.receiveShadow = true;
    rootVilla.add(podium);

    // 2. Wide Ground Terrace & Steps
    const terraceGeo = new THREE.BoxGeometry(22, 0.4, 18);
    const terrace = new THREE.Mesh(terraceGeo, travertineMat);
    terrace.position.set(-2, 0.2, 2);
    terrace.receiveShadow = true;
    rootVilla.add(terrace);

    // 3. Infinity Reflecting Pool
    const poolBasinGeo = new THREE.BoxGeometry(16, 0.6, 6);
    const poolBasin = new THREE.Mesh(poolBasinGeo, darkGraniteMat);
    poolBasin.position.set(3, 0.1, 7);
    rootVilla.add(poolBasin);

    const waterGeo = new THREE.PlaneGeometry(15.6, 5.6);
    const water = new THREE.Mesh(waterGeo, poolWaterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(3, 0.42, 7);
    water.receiveShadow = true;
    rootVilla.add(water);

    // 4. Ground Floor Main Living Pavilion (Travertine shear wall + Glass curtain)
    // Core shear wall
    const shearWallGeo = new THREE.BoxGeometry(1.4, 5, 12);
    const shearWall = new THREE.Mesh(shearWallGeo, travertineMat);
    shearWall.position.set(-8, 2.5, 0);
    shearWall.castShadow = true;
    shearWall.receiveShadow = true;
    rootVilla.add(shearWall);

    // Secondary vertical stone mass (chimney core)
    const chimneyGeo = new THREE.BoxGeometry(3, 11, 2.5);
    const chimney = new THREE.Mesh(chimneyGeo, travertineMat);
    chimney.position.set(-4, 5.5, -3);
    chimney.castShadow = true;
    chimney.receiveShadow = true;
    rootVilla.add(chimney);

    // Ground floor glass salon enclosure
    const gfGlassGeo = new THREE.BoxGeometry(14, 4.4, 8);
    const gfGlass = new THREE.Mesh(gfGlassGeo, glassMat);
    gfGlass.position.set(-0.5, 2.6, 0);
    gfGlass.castShadow = true;
    rootVilla.add(gfGlass);

    // Interior structural columns (slim bronze mullions)
    for (let i = -5; i <= 5; i += 3.2) {
      const colGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.4, 12);
      const col = new THREE.Mesh(colGeo, brassMat);
      col.position.set(i, 2.6, 3.9);
      col.castShadow = true;
      rootVilla.add(col);
    }

    // Interior warm travertine fireplace block
    const hearthGeo = new THREE.BoxGeometry(3.5, 1.2, 1);
    const hearth = new THREE.Mesh(hearthGeo, darkGraniteMat);
    hearth.position.set(-3, 1, 0);
    rootVilla.add(hearth);

    // 5. First Floor Intermediate Floor Plate (Thin floating concrete slab)
    const slab1Geo = new THREE.BoxGeometry(20, 0.45, 14);
    const slab1 = new THREE.Mesh(slab1Geo, travertineMat);
    slab1.position.set(0, 5, 0);
    slab1.castShadow = true;
    slab1.receiveShadow = true;
    rootVilla.add(slab1);

    // 6. Upper Floor Master Suite (Cantilevered Dramatic Volume)
    const upperSuiteGeo = new THREE.BoxGeometry(11, 4, 7);
    const upperSuite = new THREE.Mesh(upperSuiteGeo, travertineMat);
    // Cantilevered over the pool toward the front
    upperSuite.position.set(2.5, 7.2, 1.5);
    upperSuite.castShadow = true;
    upperSuite.receiveShadow = true;
    rootVilla.add(upperSuite);

    // Upper floor panoramic front glass wall
    const upperGlassGeo = new THREE.BoxGeometry(10.2, 3.4, 0.2);
    const upperGlass = new THREE.Mesh(upperGlassGeo, glassMat);
    upperGlass.position.set(2.5, 7.2, 5.05);
    rootVilla.add(upperGlass);

    // 7. Cantilevered Timber Louvers / Brise-Soleil Screen
    const louverCount = 14;
    for (let i = 0; i < louverCount; i++) {
      const louverGeo = new THREE.BoxGeometry(0.08, 3.6, 1.2);
      const louver = new THREE.Mesh(louverGeo, warmLarchWoodMat);
      louver.position.set(-1.8 + i * 0.65, 7.2, 5.7);
      louver.rotation.y = 0.35; // Angled slats for sun shading
      louver.castShadow = true;
      rootVilla.add(louver);
    }

    // 8. Flat Floating Roof Canopy
    const roofSlabGeo = new THREE.BoxGeometry(15, 0.4, 11);
    const roofSlab = new THREE.Mesh(roofSlabGeo, travertineMat);
    roofSlab.position.set(2, 9.4, 1.5);
    roofSlab.castShadow = true;
    roofSlab.receiveShadow = true;
    rootVilla.add(roofSlab);

    // 9. Minimalist Sculptural Landscaping (Mediterranean Cypress & Olive Planters)
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3d4a34, roughness: 0.85 });

    // Italian Cypress columns
    const cypressPositions = [
      { x: -11, z: -4, h: 9 },
      { x: -12.5, z: -2, h: 11 },
      { x: 12, z: -6, h: 8 },
      { x: 13.5, z: -4, h: 10 },
    ];

    cypressPositions.forEach((pos) => {
      const cyTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2, 8), treeTrunkMat);
      cyTrunk.position.set(pos.x, 1, pos.z);
      cyTrunk.castShadow = true;
      rootVilla.add(cyTrunk);

      const cyFoliage = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, pos.h, 12),
        foliageMat
      );
      cyFoliage.position.set(pos.x, 1 + pos.h / 2, pos.z);
      cyFoliage.castShadow = true;
      rootVilla.add(cyFoliage);
    });

    // Sunken Fire Pit Lounge
    const firePitGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 24);
    const firePit = new THREE.Mesh(firePitGeo, darkGraniteMat);
    firePit.position.set(-7, 0.4, 7);
    rootVilla.add(firePit);

    const flameGlow = new THREE.PointLight(0xff5511, 1.8, 6);
    flameGlow.position.set(-7, 0.8, 7);
    scene.add(flameGlow);

    // --- ANIMATION INTERPOLATION VARIABLES ---
    const currentCamPos = new THREE.Vector3().copy(camera.position);
    const targetCamPos = new THREE.Vector3().copy(camera.position);
    const currentLookAt = new THREE.Vector3(0, 3, 0);
    const targetLookAt = new THREE.Vector3(0, 3, 0);

    // Pointer interaction offset
    const pointerOffset = { x: 0, y: 0 };
    const onPointerMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      pointerOffset.x = normX * 0.8;
      pointerOffset.y = -normY * 0.6;
    };
    window.addEventListener('mousemove', onPointerMove, { passive: true });

    // --- GSAP SCROLLTRIGGER PIN & TIMELINE ---
    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: '+=2800',
      pin: true,
      scrub: 1.2,
      onUpdate: (self) => {
        const prog = self.progress;
        setScrollProgress(prog);

        // Determine active architectural feature
        let stageIndex = 0;
        if (prog >= 0.78) stageIndex = 3;
        else if (prog >= 0.52) stageIndex = 2;
        else if (prog >= 0.26) stageIndex = 1;
        else stageIndex = 0;

        setActiveStageIndex(stageIndex);

        // Smooth camera waypoint interpolation based on scroll
        const stages = ARCHITECTURAL_STAGES;
        if (prog < 0.33) {
          const t = prog / 0.33;
          targetCamPos.lerpVectors(
            new THREE.Vector3(stages[0].camPos.x, stages[0].camPos.y, stages[0].camPos.z),
            new THREE.Vector3(stages[1].camPos.x, stages[1].camPos.y, stages[1].camPos.z),
            t
          );
          targetLookAt.lerpVectors(
            new THREE.Vector3(stages[0].target.x, stages[0].target.y, stages[0].target.z),
            new THREE.Vector3(stages[1].target.x, stages[1].target.y, stages[1].target.z),
            t
          );
        } else if (prog < 0.66) {
          const t = (prog - 0.33) / 0.33;
          targetCamPos.lerpVectors(
            new THREE.Vector3(stages[1].camPos.x, stages[1].camPos.y, stages[1].camPos.z),
            new THREE.Vector3(stages[2].camPos.x, stages[2].camPos.y, stages[2].camPos.z),
            t
          );
          targetLookAt.lerpVectors(
            new THREE.Vector3(stages[1].target.x, stages[1].target.y, stages[1].target.z),
            new THREE.Vector3(stages[2].target.x, stages[2].target.y, stages[2].target.z),
            t
          );
        } else {
          const t = (prog - 0.66) / 0.34;
          targetCamPos.lerpVectors(
            new THREE.Vector3(stages[2].camPos.x, stages[2].camPos.y, stages[2].camPos.z),
            new THREE.Vector3(stages[3].camPos.x, stages[3].camPos.y, stages[3].camPos.z),
            t
          );
          targetLookAt.lerpVectors(
            new THREE.Vector3(stages[2].target.x, stages[2].target.y, stages[2].target.z),
            new THREE.Vector3(stages[3].target.x, stages[3].target.y, stages[3].target.z),
            t
          );
        }
      },
    });

    // Resize listener
    const onResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Render loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle water shimmer
      water.position.y = 0.42 + Math.sin(elapsed * 1.5) * 0.015;

      // Smooth camera position damping
      currentCamPos.x += (targetCamPos.x + pointerOffset.x - currentCamPos.x) * 0.04;
      currentCamPos.y += (targetCamPos.y + pointerOffset.y - currentCamPos.y) * 0.04;
      currentCamPos.z += (targetCamPos.z - currentCamPos.z) * 0.04;

      currentLookAt.x += (targetLookAt.x - currentLookAt.x) * 0.04;
      currentLookAt.y += (targetLookAt.y - currentLookAt.y) * 0.04;
      currentLookAt.z += (targetLookAt.z - currentLookAt.z) * 0.04;

      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', onResize);
      trigger.kill();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  const activeStage = ARCHITECTURAL_STAGES[activeStageIndex];

  return (
    <div
      ref={containerRef}
      id="architecture-3d"
      className="relative w-full h-screen bg-limestone-100 overflow-hidden select-none border-y border-charcoal-800/10"
    >
      {/* 3D WebGL Canvas */}
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing"
          aria-label="Interactive 3D Architectural Villa model. Scroll down to tour the structural components."
        />
      ) : (
        /* WebGL Fallback: Cinematic Architectural Imagery Sequence */
        <div className="absolute inset-0 bg-limestone-200 flex items-center justify-center p-8">
          <div className="max-w-xl text-center space-y-4">
            <span className="font-mono text-xs uppercase tracking-widestEditorial text-terracotta">
              Architectural Study
            </span>
            <h3 className="font-serif text-3xl text-charcoal-800">
              {activeStage.title}
            </h3>
            <p className="text-charcoal-600 text-sm leading-relaxed">
              {activeStage.description}
            </p>
          </div>
        </div>
      )}

      {/* Top Editorial Header Overlay */}
      <div className="absolute top-8 left-6 lg:left-16 right-6 lg:right-16 z-20 flex justify-between items-start pointer-events-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widestEditorial text-charcoal-600">
              Interactive Architectural Monograph
            </span>
          </div>
          <h2 className="font-serif text-2xl lg:text-3xl text-charcoal-800 font-normal">
            The Geometry of Sanctuary
          </h2>
          <p className="text-xs text-charcoal-500 font-mono mt-0.5">
            A procedural spatial study in travertine, timber & light
          </p>
        </div>

        {/* Scroll Progress Dial */}
        <div className="hidden sm:flex flex-col items-end">
          <div className="font-mono text-xs tracking-wider text-charcoal-700">
            SEQUENCE {(scrollProgress * 100).toFixed(0)}%
          </div>
          <div className="w-32 h-[2px] bg-charcoal-800/20 mt-1.5 overflow-hidden">
            <div
              className="h-full bg-terracotta transition-all duration-75"
              style={{ width: `${Math.max(5, scrollProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Editorial Callout Card (Updates with scroll position) */}
      <div className="absolute bottom-10 left-6 lg:left-16 right-6 lg:right-auto z-20 max-w-md pointer-events-auto">
        <div className="bg-limestone-100/95 backdrop-blur-md p-6 lg:p-8 border border-charcoal-800/15 shadow-elevation transition-all duration-500">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-800/10 mb-4">
            <span className="font-mono text-xs text-terracotta tracking-widest">
              STUDY {activeStage.step} / 04
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-500">
              {activeStage.subtitle}
            </span>
          </div>

          <h3 className="font-serif text-xl lg:text-2xl text-charcoal-800 mb-2 font-medium">
            {activeStage.title}
          </h3>

          <p className="text-charcoal-600 text-xs lg:text-sm leading-relaxed mb-6 font-light">
            {activeStage.description}
          </p>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-charcoal-800/10">
            {ARCHITECTURAL_STAGES.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => {
                  setActiveStageIndex(idx);
                  // Optional quick jump
                }}
                className={`py-1 text-[10px] font-mono tracking-widest text-center border-b-2 transition-all ${
                  idx === activeStageIndex
                    ? 'border-terracotta text-charcoal-900 font-bold'
                    : 'border-transparent text-charcoal-400 hover:text-charcoal-700'
                }`}
              >
                {s.step}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Architectural Coordinates & Interaction Hint */}
      <div className="absolute bottom-10 right-6 lg:right-16 z-20 hidden md:flex flex-col items-end gap-3 pointer-events-none">
        <div className="flex items-center gap-2 bg-limestone-100/90 backdrop-blur-sm px-3 py-1.5 border border-charcoal-800/15 text-[10px] font-mono text-charcoal-600">
          <Rotate3d className="w-3.5 h-3.5 text-terracotta" />
          <span>Move cursor to shift perspective • Scroll to traverse scene</span>
        </div>
        <div className="text-[10px] font-mono text-charcoal-400 tracking-wider">
          LAT 39°32&apos;N / LONG 02°24&apos;E • ELEV 140M
        </div>
      </div>
    </div>
  );
}
