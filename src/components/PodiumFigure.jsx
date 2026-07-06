import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

// Geeft per dans + tijd de hoek/positie-waarden terug voor elk onderdeel.
// Zelfde 3 dansjes als eerder, nu voor een solide (niet-hologram) poppetje.
function choreograph(dance, t) {
  const s = { armL: 0, armR: 0, legL: 0, legR: 0, hipY: 0, hipZ: 0, torsoY: 0, bounce: 0 };
  if (dance === "floss") {
    const swing = Math.sin(t * 4.2);
    s.armL = 0.9 + swing * 0.6;
    s.armR = -0.9 - swing * 0.6;
    s.torsoY = -swing * 0.4;
    s.hipY = swing * 0.4;
    s.legL = swing * 0.25;
    s.legR = -swing * 0.25;
    s.bounce = Math.abs(Math.sin(t * 4.2)) * 0.045;
  } else if (dance === "takeL") {
    s.armR = -2.3 + Math.sin(t * 3) * 0.05; // hand tegen voorhoofd - de "L"
    s.armL = 0.5 + Math.sin(t * 3 + Math.PI) * 0.2;
    s.hipZ = Math.sin(t * 2.3) * 0.22;
    s.legL = Math.sin(t * 2.3) * 0.4;
    s.legR = -Math.sin(t * 2.3) * 0.4;
    s.bounce = Math.abs(Math.sin(t * 2.3)) * 0.035;
  } else if (dance === "griddy") {
    const kick = Math.sin(t * 7.5);
    s.legL = kick * 0.8;
    s.legR = -kick * 0.8;
    s.armL = 0.6 - kick * 0.45;
    s.armR = -0.6 + kick * 0.45;
    s.hipY = kick * 0.3;
    s.bounce = Math.abs(kick) * 0.08;
  }
  return s;
}

// Solide (niet-hologram) dansend poppetje met een echt gewricht-rig zodat de
// dans - Floss / Take the L / Griddy - duidelijk te zien is. gender bepaalt
// het silhouet: vrouw = rok + paardenstaart, man = twee losse benen.
function DanceFigure({ color, phase = 0, big = false, gender = "m", dance = "floss" }) {
  const hips = useRef();
  const torso = useRef();
  const armL = useRef();
  const armR = useRef();
  const legL = useRef();
  const legR = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase;
    const s = choreograph(dance, t);
    if (hips.current) {
      hips.current.position.y = s.bounce;
      hips.current.rotation.y = s.hipY;
      hips.current.rotation.z = s.hipZ;
    }
    if (torso.current) torso.current.rotation.y = s.torsoY;
    if (armL.current) armL.current.rotation.z = s.armL;
    if (armR.current) armR.current.rotation.z = s.armR;
    if (legL.current) legL.current.rotation.x = s.legL;
    if (legR.current) legR.current.rotation.x = s.legR;
  });

  const scale = big ? 1.08 : 1;
  const isF = gender === "f";
  const skin = "#ffd7ad";

  return (
    <group ref={hips} scale={scale}>
      {/* Benen (man) / rok (vrouw) */}
      {isF ? (
        <mesh position={[0, -0.15, 0]}>
          <coneGeometry args={[0.26, 0.36, 14]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </mesh>
      ) : (
        <>
          <group ref={legL} position={[-0.12, 0, 0]}>
            <mesh position={[0, -0.22, 0]}>
              <capsuleGeometry args={[0.08, 0.34, 4, 8]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          </group>
          <group ref={legR} position={[0.12, 0, 0]}>
            <mesh position={[0, -0.22, 0]}>
              <capsuleGeometry args={[0.08, 0.34, 4, 8]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          </group>
        </>
      )}

      <group ref={torso} position={[0, 0.1, 0]}>
        {/* Romp */}
        <mesh>
          <capsuleGeometry args={[isF ? 0.22 : 0.26, 0.3, 4, 12]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.15} />
        </mesh>
        {/* Hoofd */}
        <group position={[0, 0.54, 0]}>
          <mesh>
            <sphereGeometry args={[isF ? 0.23 : 0.25, 20, 16]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>
          {isF && (
            <mesh position={[0, 0.04, -0.22]} rotation={[0.6, 0, 0]}>
              <capsuleGeometry args={[0.07, 0.24, 4, 8]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          )}
        </group>
        {/* Armen - pivot bij de schouder */}
        <group ref={armL} position={[isF ? -0.32 : -0.38, 0.24, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.075, 0.36, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>
        <group ref={armR} position={[isF ? 0.32 : 0.38, 0.24, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.075, 0.36, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// Los canvasje per podiumplek, met heldere/solide belichting (geen hologram-
// wireframe) zodat de dans goed leesbaar is op klein formaat. Puur decoratief.
export default function PodiumFigure({ color = "#ff6b00", phase = 0, big = false, gender = "m", dance = "floss" }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0.15, 2.7], fov: 36 }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} color="#fff2df" />
        <pointLight position={[-2, 0.5, 1.5]} intensity={0.4} color="#ffb347" />
        <DanceFigure color={color} phase={phase} big={big} gender={gender} dance={dance} />
      </Canvas>
    </div>
  );
}
