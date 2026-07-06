import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdditiveBlending } from "three";
import { WORLD_TEAMS, latLonToVec3 } from "./worldTeams.js";

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

const GLOBE_R = 1.4;

// Gestileerde aardbol: lat/lon-wireframe (via de sphere-segmenten zelf) + een
// gloeiende punt per WK2026-deelnemer op de echte positie van dat land.
function Globe({ position = [1.6, -0.3, 0] }) {
  const group = useRef();
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.16;
  });

  const markerPositions = useMemo(() => {
    const arr = new Float32Array(WORLD_TEAMS.length * 3);
    WORLD_TEAMS.forEach((t, i) => {
      const [x, y, z] = latLonToVec3(t.lat, t.lon, GLOBE_R * 1.015);
      arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z;
    });
    return arr;
  }, []);

  return (
    <group ref={group} position={position} rotation={[0.15, 0, -0.05]} scale={0.95}>
      {/* Vaste, donkere kern zodat de bol niet als lege ballon oogt */}
      <mesh>
        <sphereGeometry args={[GLOBE_R * 0.985, 48, 32]} />
        <meshStandardMaterial color="#241a12" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Lat/lon-raster (de segmenten van de sphere zelf vormen de meridianen/parallellen) */}
      <mesh>
        <sphereGeometry args={[GLOBE_R, 24, 16]} />
        <meshBasicMaterial color="#ffb347" wireframe transparent opacity={0.35} />
      </mesh>
      {/* Zachte gloed net binnen het raster */}
      <mesh>
        <sphereGeometry args={[GLOBE_R * 0.99, 32, 24]} />
        <meshStandardMaterial color="#ff6b00" emissive="#ff6b00" emissiveIntensity={0.15} transparent opacity={0.08} />
      </mesh>
      {/* Gloeiende punten op de 48 deelnemende landen - additive blending zodat ze
          duidelijk oplichten t.o.v. het amberkleurige raster */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[markerPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#fff2d0"
          size={0.09}
          sizeAttenuation
          transparent
          opacity={1}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function Stars({ count = 140 }) {
  const points = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.6 + Math.random() * 1.8;
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
      <pointsMaterial color="#ffb347" size={0.03} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// 3D-achtergrond voor de Stand-hero. Puur decoratief: geen game-state,
// geen countdown-logica - die blijft in CountdownCard/banner-JSX zelf.
// maskLeft: vervaagt de linkerkant naar transparant, zodat titeltekst die daar
// staat (bv. "WK 2026") nooit met de globe kan overlappen, ongeacht schermbreedte.
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
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 3, 3]} intensity={1.3} color="#ff8c00" />
        <pointLight position={[-3, -2, 2]} intensity={0.55} color="#ffb347" />
        <Globe />
        <Stars />
      </Canvas>
    </div>
  );
}
