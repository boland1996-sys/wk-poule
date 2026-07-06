import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

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

// position: waar de bal in de scene staat - standaard rechts-onder zodat
// titeltekst links altijd vrij blijft (zelfde hoek als de oude ⚽-watermark).
function FacetedBall({ position = [1.5, -0.4, 0] }) {
  const group = useRef();
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.22;
    group.current.rotation.x += delta * 0.06;
  });
  return (
    <group ref={group} position={position} scale={0.85}>
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
// maskLeft: vervaagt de linkerkant naar transparant, zodat titeltekst die daar
// staat (bv. "WK 2026") nooit met de bal kan overlappen, ongeacht schermbreedte.
export default function Hero3D({ className, style, maskLeft = true }) {
  const visible = usePageVisible();
  const mask = maskLeft ? "linear-gradient(to right, transparent 0%, transparent 40%, black 62%)" : undefined;
  return (
    <div
      className={className}
      style={{
        position: "absolute", inset: 0,
        maskImage: mask, WebkitMaskImage: mask,
        ...style,
      }}
    >
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
