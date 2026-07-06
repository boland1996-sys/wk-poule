import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

// Klein "poppetje" dat op een podium-blok staat: rompje in de kleur van de
// speler, kop, en twee armen omhoog in overwinningspose. Idle bounce + swaai
// per instantie met een eigen faseverschil zodat ze niet synchroon bewegen.
function Mannequin({ color, phase = 0, big = false }) {
  const group = useRef();
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime() + phase;
    group.current.position.y = Math.sin(t * 2.2) * 0.045;
    group.current.rotation.y = Math.sin(t * 0.9) * 0.25;
  });
  const scale = big ? 1.08 : 1;
  return (
    <group ref={group} scale={scale}>
      {/* Romp - iets korter/breder, cartoonachtige verhoudingen voor leesbaarheid op klein formaat */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.24, 0.32, 4, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Kop - groot en duidelijk gescheiden van de romp (bobblehead-stijl) */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.25, 20, 16]} />
        <meshStandardMaterial color="#ffd7ad" roughness={0.6} />
      </mesh>
      {/* Armen omhoog - overwinningspose, ver genoeg gespreid om los van de romp te lezen */}
      <mesh position={[-0.36, 0.24, 0]} rotation={[0, 0, 0.95]}>
        <capsuleGeometry args={[0.07, 0.36, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0.36, 0.24, 0]} rotation={[0, 0, -0.95]}>
        <capsuleGeometry args={[0.07, 0.36, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Los canvasje per podiumplek (i.p.v. 1 grote scene) zodat het meebeweegt met
// de flex-layout van .podium-col zonder 3D-wereldcoordinaten te moeten matchen
// met CSS. Puur decoratief - geen game-state.
export default function PodiumFigure({ color = "#ff6b00", phase = 0, big = false, style }) {
  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0.28, 2.4], fov: 34 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 2]} intensity={1} color="#fff2df" />
        <pointLight position={[-2, 0, 1]} intensity={0.4} color="#ffb347" />
        <Mannequin color={color} phase={phase} big={big} />
      </Canvas>
    </div>
  );
}
