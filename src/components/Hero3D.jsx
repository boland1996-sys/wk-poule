import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

// Detecteert of prefers-reduced-motion actief staat, live (luistert naar wijzigingen).
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Ruwe hardware-heuristiek zodat oudere/goedkopere telefoons de CSS-banner
// krijgen i.p.v. de zwaardere 3D-canvas.
export function isLowPowerDevice() {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  return cores <= 2 || mem <= 2;
}

// Pauzeert de render-loop zodra het tabblad niet zichtbaar is (batterij sparen).
function usePageVisible() {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return visible;
}

function FacetedBall() {
  const group = useRef();
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.22;
    group.current.rotation.x += delta * 0.06;
  });
  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshStandardMaterial
          color="#ff6b00"
          metalness={0.35}
          roughness={0.35}
          flatShading
          emissive="#8a2e00"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh scale={1.04}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color="#ffb347" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Sparks({ count = 140 }) {
  const points = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.4 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);
  useFrame((_, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.05;
  });
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffb347" size={0.035} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

// 3D-achtergrond voor de Stand-hero. Puur decoratief: geen game-state,
// geen countdown-logica - die blijft in CountdownCard/banner-JSX zelf.
export default function Hero3D({ className, style }) {
  const visible = usePageVisible();
  return (
    <div className={className} style={{ position: "absolute", inset: 0, ...style }}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 5], fov: 40 }}
      >
        <ambientLight intensity={0.45} />
        <pointLight position={[3, 3, 3]} intensity={1.3} color="#ff8c00" />
        <pointLight position={[-3, -2, 2]} intensity={0.55} color="#ffb347" />
        <FacetedBall />
        <Sparks />
      </Canvas>
    </div>
  );
}
