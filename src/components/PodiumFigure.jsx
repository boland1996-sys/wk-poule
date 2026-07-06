import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BackSide } from "three";

// Geeft per dans + tijd de hoek/positie-waarden terug voor elk onderdeel.
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

// Blokkig lichaamsdeel + cartoon-omtrek (inverted-hull: iets opgeschaalde
// donkere kopie met binnenkant-normalen naar buiten), zodat elk los onderdeel
// een duidelijke silhouet-rand krijgt en de dans goed leesbaar blijft.
function Block({ args, color, outline = 1.15 }) {
  return (
    <>
      <mesh>
        <boxGeometry args={args} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh scale={outline}>
        <boxGeometry args={args} />
        <meshBasicMaterial color="#141014" side={BackSide} />
      </mesh>
    </>
  );
}
function Ball({ radius, color, outline = 1.12, segs = 16 }) {
  return (
    <>
      <mesh>
        <sphereGeometry args={[radius, segs, segs]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh scale={outline}>
        <sphereGeometry args={[radius, segs, segs]} />
        <meshBasicMaterial color="#141014" side={BackSide} />
      </mesh>
    </>
  );
}

// Chunky, felgekleurd "actiefiguurtje" (dikke blokvormen + cartoon-omtrek +
// witte handschoenen/donkere schoenen als contrastpunten) zodat armen/benen
// duidelijk los van de romp aftekenen tijdens het dansen. gender bepaalt het
// silhouet: vrouw = rok + paardenstaart + strik, man = twee losse benen.
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

  const scale = big ? 1.1 : 1;
  const isF = gender === "f";
  const skin = "#ffd7ad";
  const shoe = "#171417";
  const glove = "#f5f2ea";
  const hair = "#3a2416";

  return (
    <group ref={hips} scale={scale}>
      {/* Benen (man) / rok (vrouw) - vanuit de heup */}
      {isF ? (
        <group position={[0, -0.2, 0]}>
          <mesh>
            <coneGeometry args={[0.26, 0.34, 8]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <mesh scale={1.12}>
            <coneGeometry args={[0.26, 0.34, 8]} />
            <meshBasicMaterial color="#141014" side={BackSide} />
          </mesh>
        </group>
      ) : (
        <>
          <group ref={legL} position={[-0.13, -0.02, 0]}>
            <group position={[0, -0.22, 0]}><Block args={[0.16, 0.4, 0.16]} color={color} /></group>
            <group position={[0, -0.44, 0.02]}><Block args={[0.17, 0.1, 0.24]} color={shoe} outline={1.2} /></group>
          </group>
          <group ref={legR} position={[0.13, -0.02, 0]}>
            <group position={[0, -0.22, 0]}><Block args={[0.16, 0.4, 0.16]} color={color} /></group>
            <group position={[0, -0.44, 0.02]}><Block args={[0.17, 0.1, 0.24]} color={shoe} outline={1.2} /></group>
          </group>
        </>
      )}

      <group ref={torso} position={[0, 0.14, 0]}>
        {/* Romp */}
        <Block args={[isF ? 0.42 : 0.48, 0.42, 0.28]} color={color} />
        {/* Hoofd - groot/cartoonachtig voor leesbaarheid */}
        <group position={[0, 0.58, 0]}>
          <Ball radius={isF ? 0.27 : 0.29} color={skin} />
          {/* Gezicht - simpele oogjes zodat de kijkrichting/houding meeleeft */}
          <mesh position={[-0.1, 0.02, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#171417" /></mesh>
          <mesh position={[0.1, 0.02, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#171417" /></mesh>
          {isF ? (
            <>
              {/* Paardenstaart */}
              <group position={[0, 0.08, -0.24]} rotation={[0.5, 0, 0]}><Block args={[0.12, 0.32, 0.12]} color={hair} /></group>
              {/* Strik */}
              <mesh position={[0, 0.24, -0.14]}><boxGeometry args={[0.14, 0.08, 0.08]} /><meshStandardMaterial color={color} /></mesh>
            </>
          ) : (
            /* Kort haar-kapje voor het mannelijke poppetje */
            <group position={[0, 0.16, -0.02]}><Block args={[0.42, 0.16, 0.42]} color={hair} outline={1.08} /></group>
          )}
        </group>
        {/* Armen - pivot bij de schouder, witte handschoen als contrastpunt */}
        <group ref={armL} position={[isF ? -0.32 : -0.36, 0.28, 0]}>
          <group position={[0, -0.2, 0]}><Block args={[0.15, 0.38, 0.15]} color={color} /></group>
          <group position={[0, -0.42, 0]}><Ball radius={0.11} color={glove} /></group>
        </group>
        <group ref={armR} position={[isF ? 0.32 : 0.36, 0.28, 0]}>
          <group position={[0, -0.2, 0]}><Block args={[0.15, 0.38, 0.15]} color={color} /></group>
          <group position={[0, -0.42, 0]}><Ball radius={0.11} color={glove} /></group>
        </group>
      </group>
    </group>
  );
}

// Los canvasje per podiumplek, met heldere/solide belichting zodat de dans
// goed leesbaar is op klein formaat. Puur decoratief.
export default function PodiumFigure({ color = "#ff6b00", phase = 0, big = false, gender = "m", dance = "floss" }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ position: [0, 0.18, 3.05], fov: 36 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} color="#fff2df" />
        <pointLight position={[-2, 0.5, 1.5]} intensity={0.4} color="#ffb347" />
        <DanceFigure color={color} phase={phase} big={big} gender={gender} dance={dance} />
      </Canvas>
    </div>
  );
}
