import React, { useEffect, useRef } from 'react';

// Loads three.js from CDN exactly once, no matter how many orbs are mounted.
let threeLoadPromise = null;
function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threeLoadPromise) return threeLoadPromise;

  threeLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => resolve(window.THREE);
    script.onerror = () => reject(new Error('Failed to load three.js from CDN'));
    document.head.appendChild(script);
  });

  return threeLoadPromise;
}

/**
 * MemoryOrb3D — glassmorphic floating orb with a glowing core.
 * Signature visual motif for MemoryForge: represents persistent memory / cognition.
 *
 * Props:
 *  - size: 'full' (fills parent, for full-page backgrounds) | number (px, for contained use)
 *  - interactive: if true, orb subtly drifts toward mouse position
 *  - className: optional extra classes on the wrapper div
 */
export default function MemoryOrb3D({ size = 320, interactive = false, className = '' }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ raf: null, renderer: null, scene: null, mounted: true });

  useEffect(() => {
    stateRef.current.mounted = true;
    const mountEl = mountRef.current;
    if (!mountEl) return;

    let cleanupFns = [];

    loadThree().then((THREE) => {
      if (!stateRef.current.mounted || !mountEl) return;

      const width = mountEl.clientWidth;
      const height = mountEl.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.z = 6;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      mountEl.appendChild(renderer.domElement);

      stateRef.current.renderer = renderer;
      stateRef.current.scene = scene;

      // Lighting — required for the glass material to read correctly
      const ambient = new THREE.AmbientLight(0x8ca6ff, 0.6);
      scene.add(ambient);
      const keyLight = new THREE.PointLight(0xffffff, 1.6, 14);
      keyLight.position.set(3, 3, 4);
      scene.add(keyLight);
      const fillLight = new THREE.PointLight(0x5c78ff, 1.1, 14);
      fillLight.position.set(-3, -2, 3);
      scene.add(fillLight);

      // Glassmorphic outer shell — frosted, transparent, refractive
      const glassGeo = new THREE.SphereGeometry(1.15, 64, 64);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xaab8ff,
        transparent: true,
        opacity: 0.28,
        roughness: 0.08,
        metalness: 0,
        transmission: 0.88,
        thickness: 1.2,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        ior: 1.4,
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      scene.add(glass);

      // Glowing inner core, visible through the glass
      const coreGeo = new THREE.SphereGeometry(0.4, 32, 32);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x5c78ff,
        transparent: true,
        opacity: 0.65,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      scene.add(core);

      // Soft ambient glow halo around the whole orb
      const glowGeo = new THREE.SphereGeometry(1.4, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x384dff,
        transparent: true,
        opacity: 0.08,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      scene.add(glow);

      // Sparse orbiting particles for depth, kept light so the glass stays the focus
      const particleCount = 160;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const r = 1.9 + Math.random() * 1.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x8ca6ff,
        size: 0.03,
        transparent: true,
        opacity: 0.6,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // Optional subtle mouse-follow
      let targetX = 0, targetY = 0;
      const handleMouseMove = (e) => {
        if (!interactive) return;
        targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
        targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
      };
      if (interactive) {
        window.addEventListener('mousemove', handleMouseMove);
        cleanupFns.push(() => window.removeEventListener('mousemove', handleMouseMove));
      }

      const animate = () => {
        if (!stateRef.current.mounted) return;
        stateRef.current.raf = requestAnimationFrame(animate);

        const t = Date.now() * 0.001;
        glass.rotation.y += 0.003;
        glass.rotation.x = Math.sin(t * 0.4) * 0.08;
        core.scale.setScalar(1 + Math.sin(t * 1.2) * 0.08);
        particles.rotation.y -= 0.0012;
        glow.scale.setScalar(1 + Math.sin(t) * 0.04);

        if (interactive) {
          camera.position.x += (targetX - camera.position.x) * 0.02;
          camera.position.y += (-targetY - camera.position.y) * 0.02;
          camera.lookAt(0, 0, 0);
        }

        renderer.render(scene, camera);
      };
      animate();

      // Resize handling
      const handleResize = () => {
        if (!mountEl) return;
        const w = mountEl.clientWidth;
        const h = mountEl.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);
      cleanupFns.push(() => window.removeEventListener('resize', handleResize));

      cleanupFns.push(() => {
        cancelAnimationFrame(stateRef.current.raf);
        glassGeo.dispose();
        glassMat.dispose();
        coreGeo.dispose();
        coreMat.dispose();
        glowGeo.dispose();
        glowMat.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mountEl) {
          mountEl.removeChild(renderer.domElement);
        }
      });
    });

    return () => {
      stateRef.current.mounted = false;
      cleanupFns.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  const wrapperStyle =
    size === 'full'
      ? { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }
      : { position: 'relative', width: size, height: size, overflow: 'hidden', flexShrink: 0 };

  return <div ref={mountRef} style={wrapperStyle} className={className} aria-hidden="true" />;
}
