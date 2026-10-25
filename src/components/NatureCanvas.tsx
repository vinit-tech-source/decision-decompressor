import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type NatureSceneType = 'forest' | 'ripples' | 'meadow';

interface NatureCanvasProps {
  sceneType?: NatureSceneType;
  interactive?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export function NatureCanvas({
  sceneType = 'forest',
  interactive = true,
  theme = 'dark',
  className = '',
}: NatureCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let width = container.clientWidth || 300;
    let height = container.clientHeight || 300;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const fogColor = theme === 'dark' ? 0x1B1F1C : 0xF4F1EA;
    scene.fog = new THREE.FogExp2(fogColor, 0.03);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 9);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x76967A, theme === 'dark' ? 0.9 : 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xECE6D8, 1.4);
    dirLight.position.set(5, 12, 7);
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(
      theme === 'dark' ? 0x8FB394 : 0x6F9473,
      theme === 'dark' ? 0x2A332C : 0xDCD5C6,
      0.8
    );
    scene.add(hemiLight);

    // 3. Scene Content Assembly
    const disposables: { dispose: () => void }[] = [];

    // Helper: Ground Plane
    const groundGeo = new THREE.PlaneGeometry(120, 120, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? 0x212822 : 0xEDE7DB,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.5;
    scene.add(groundMesh);
    disposables.push(groundGeo, groundMat);

    // Scene Variations
    let updateDynamicScene: (elapsed: number) => void = () => {};

    if (sceneType === 'forest') {
      // Procedural 3D Trees with stylized foliage (3-part groups)
      const treeGroup = new THREE.Group();
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d352c, roughness: 0.9 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x5a7d60, roughness: 0.8, flatShading: true });
      const accentFoliageMat = new THREE.MeshStandardMaterial({ color: 0x769e7d, roughness: 0.7, flatShading: true });
      disposables.push(trunkMat, foliageMat, accentFoliageMat);

      const treePositions = [
        [-3.5, 0, -2],
        [-1.8, 0, -4],
        [0.5, 0, -5],
        [2.8, 0, -3],
        [4.2, 0, -1.5],
        [-4.5, 0, 1],
        [3.8, 0, 1.5],
      ];

      treePositions.forEach(([tx, ty, tz], i) => {
        const singleTree = new THREE.Group();
        const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 2.5, 6);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.25;
        singleTree.add(trunk);
        disposables.push(trunkGeo);

        // Lower foliage cone
        const f1Geo = new THREE.ConeGeometry(1.2, 1.8, 7);
        const f1 = new THREE.Mesh(f1Geo, i % 2 === 0 ? foliageMat : accentFoliageMat);
        f1.position.y = 2.4;
        singleTree.add(f1);
        disposables.push(f1Geo);

        // Upper foliage cone
        const f2Geo = new THREE.ConeGeometry(0.85, 1.5, 6);
        const f2 = new THREE.Mesh(f2Geo, i % 2 === 0 ? accentFoliageMat : foliageMat);
        f2.position.y = 3.3;
        singleTree.add(f2);
        disposables.push(f2Geo);

        singleTree.position.set(tx, ty, tz);
        singleTree.scale.setScalar(0.85 + (i % 3) * 0.15);
        treeGroup.add(singleTree);
      });
      scene.add(treeGroup);

      // Floating spores / dandelion seeds
      const particleCount = 180;
      const particleGeo = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 16;
        posArray[i + 1] = Math.random() * 6;
        posArray[i + 2] = (Math.random() - 0.5) * 14;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particleMat = new THREE.PointsMaterial({
        size: 0.08,
        color: 0xCDE0D0,
        transparent: true,
        opacity: 0.65,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);
      disposables.push(particleGeo, particleMat);

      updateDynamicScene = (elapsed) => {
        const positions = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          positions[idx + 1] -= 0.005; // gentle descent
          positions[idx] += Math.sin(elapsed * 0.5 + i) * 0.004;
          if (positions[idx + 1] < -0.2) {
            positions[idx + 1] = 6;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;

        // Gentle tree swaying
        treeGroup.children.forEach((tree, idx) => {
          tree.rotation.z = Math.sin(elapsed * 0.8 + idx) * 0.025;
        });
      };
    } else if (sceneType === 'ripples') {
      // Zen Water Ripples mesh
      const waterGeo = new THREE.PlaneGeometry(60, 60, 64, 64);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = new THREE.MeshStandardMaterial({
        color: theme === 'dark' ? 0x274332 : 0x5a8368,
        roughness: 0.15,
        metalness: 0.35,
        wireframe: false,
        flatShading: true,
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.y = 0.15;
      scene.add(waterMesh);
      disposables.push(waterGeo, waterMat);

      // Stepping stones
      const stoneMat = new THREE.MeshStandardMaterial({
        color: theme === 'dark' ? 0x3d433e : 0x8a8479,
        roughness: 0.9,
      });
      disposables.push(stoneMat);
      const stonePositions = [
        [-1.8, 0.25, 0],
        [0.2, 0.25, -1.5],
        [2.0, 0.25, 0.5],
        [-0.5, 0.25, 2.0],
        [1.2, 0.25, 2.5],
      ];
      stonePositions.forEach(([sx, sy, sz], i) => {
        const sGeo = new THREE.CylinderGeometry(0.7 + i * 0.08, 0.9 + i * 0.08, 0.35, 8);
        const stone = new THREE.Mesh(sGeo, stoneMat);
        stone.position.set(sx, sy, sz);
        stone.rotation.y = i * 1.1;
        scene.add(stone);
        disposables.push(sGeo);
      });

      // Floating lily pads
      const lilyMat = new THREE.MeshStandardMaterial({
        color: theme === 'dark' ? 0x4a7251 : 0x739c7b,
        roughness: 0.7,
      });
      disposables.push(lilyMat);
      const lilyPositions = [
        [-2.8, 0.22, 1.2],
        [1.5, 0.22, -2.2],
        [-1.2, 0.22, -2.8],
        [3.0, 0.22, 1.8],
      ];
      lilyPositions.forEach(([lx, ly, lz], i) => {
        const lilyGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.02, 12);
        const pad = new THREE.Mesh(lilyGeo, lilyMat);
        pad.position.set(lx, ly, lz);
        scene.add(pad);
        disposables.push(lilyGeo);
      });

      updateDynamicScene = (elapsed) => {
        const pos = waterGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const v = pos.getZ(i);
          const dist = Math.sqrt(u * u + v * v);
          const wave = Math.sin(dist * 1.8 - elapsed * 2.2) * 0.14 + Math.cos(u * 1.2 + elapsed) * 0.04;
          pos.setY(i, wave);
        }
        pos.needsUpdate = true;
      };
    } else {
      // Living Meadow with swaying stalks & gentle hills
      const meadowGroup = new THREE.Group();
      const bladeMat = new THREE.MeshStandardMaterial({
        color: theme === 'dark' ? 0x517a57 : 0x779e7e,
        roughness: 0.7,
        side: THREE.DoubleSide,
      });
      const flowerMat = new THREE.MeshStandardMaterial({
        color: theme === 'dark' ? 0xD7E2D8 : 0xFDFCF9,
        roughness: 0.8,
      });
      disposables.push(bladeMat, flowerMat);

      const stalkCount = 140;
      for (let i = 0; i < stalkCount; i++) {
        const bladeGeo = new THREE.ConeGeometry(0.04, 1.4 + Math.random() * 0.8, 4);
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        const bx = (Math.random() - 0.5) * 14;
        const bz = (Math.random() - 0.5) * 12;
        blade.position.set(bx, 0.6, bz);
        blade.rotation.x = (Math.random() - 0.5) * 0.2;
        blade.rotation.z = (Math.random() - 0.5) * 0.2;
        meadowGroup.add(blade);
        disposables.push(bladeGeo);

        // Occasional gentle blossom head
        if (i % 6 === 0) {
          const blossomGeo = new THREE.SphereGeometry(0.09, 6, 6);
          const blossom = new THREE.Mesh(blossomGeo, flowerMat);
          blossom.position.set(bx, 1.8 + Math.random() * 0.3, bz);
          meadowGroup.add(blossom);
          disposables.push(blossomGeo);
        }
      }
      scene.add(meadowGroup);

      updateDynamicScene = (elapsed) => {
        meadowGroup.children.forEach((obj, i) => {
          obj.rotation.z = Math.sin(elapsed * 1.3 + i * 0.25) * 0.12;
        });
      };
    }

    // 4. Mouse / Touch interaction handlers
    function handlePointerMove(e: PointerEvent) {
      if (!interactive) return;
      const rect = container?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 1.2;
      mouseRef.current.targetY = y * 0.8;
    }

    window.addEventListener('pointermove', handlePointerMove);

    // 5. Resize Handling
    function handleResize() {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // 6. Animation Loop & Accessibility (prefers-reduced-motion and tab visibility)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Render static single frame without continuous loop
      renderer.render(scene, camera);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        resizeObserver.disconnect();
        disposables.forEach((item) => {
          try {
            item.dispose();
          } catch {
            // Ignore
          }
        });
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    }

    let timer = new (THREE as any).Timer();
    let isTabHidden = document.visibilityState === 'hidden';

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        isTabHidden = true;
      } else {
        isTabHidden = false;
        timer.update(); // reset delta to prevent sudden jump
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    function animate() {
      if (!isTabHidden) {
        timer.update();
        const delta = timer.getDelta();
        const elapsed = timer.getElapsed();

        // Smooth mouse damping
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * (delta * 3);
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * (delta * 3);

        camera.position.x = mouseRef.current.x * 2.5;
        camera.position.y = 3 + mouseRef.current.y * 1.2;
        camera.lookAt(0, 1.2, 0);

        updateDynamicScene(elapsed);
        renderer.render(scene, camera);
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();

      disposables.forEach((item) => {
        try {
          item.dispose();
        } catch {
          // Ignore
        }
      });

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [sceneType, interactive]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      aria-hidden="true"
    />
  );
}
