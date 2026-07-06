import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BackSide } from "three";

// Geeft per dans + tijd de hoek-waarden terug voor elk gewricht (schouder EN
// elleboog, heup EN knie apart) - nodig om de herkenbare houdingen echt te
// benaderen (bv. een hand die de knie voorbij het lichaam naar het voorhoofd
// brengt kan niet met één stijve arm, dat heeft een elleboog nodig).
function choreograph(dance, t) {
  const s = {
    armL: { sh: 0, el: 0.25 }, armR: { sh: 0, el: 0.25 },
    legL: { hip: 0, hipZ: 0, knee: 0 }, legR: { hip: 0, hipZ: 0, knee: 0 },
    torsoY: 0, hipY: 0, hipZ: 0, hipX: 0, bounce: 0,
  };
  if (dance === "floss") {
    // Armen als paar side-to-side over het lichaam, heupen/romp tegengesteld.
    const swing = Math.sin(t * 4.4);
    s.armL.sh = 0.2 + swing * 1.2;
    s.armR.sh = -0.2 + swing * 1.2;
    s.armL.el = 0.55 + Math.abs(swing) * 0.35;
    s.armR.el = 0.55 + Math.abs(swing) * 0.35;
    s.torsoY = -swing * 0.4;
    s.hipY = swing * 0.4;
    s.hipX = -swing * 0.14;
    s.legL.hip = swing * 0.22;
    s.legR.hip = -swing * 0.22;
    s.bounce = Math.abs(swing) * 0.06;
  } else if (dance === "takeL") {
    // Rechterarm vormt de "L" (bovenarm opzij-omhoog, onderarm naar het
    // voorhoofd) - alleen mogelijk met een apart elleboog-gewricht.
    const wobble = Math.sin(t * 2.6);
    s.armR.sh = 1.75 + wobble * 0.04;
    s.armR.el = 2.15 + wobble * 0.05;
    s.armL.sh = 0.35 + Math.sin(t * 2.6 + Math.PI) * 0.15;
    s.armL.el = 0.4;
    s.hipZ = Math.sin(t * 2.6) * 0.16;
    s.hipY = Math.sin(t * 1.3) * 0.1;
    // Getaunte stap: heup + knie afwisselend, alsof er gestrut wordt.
    s.legL.hip = Math.sin(t * 2.6) * 0.32;
    s.legL.knee = Math.max(0, Math.sin(t * 2.6)) * 0.5;
    s.legR.hip = -Math.sin(t * 2.6) * 0.32;
    s.legR.knee = Math.max(0, -Math.sin(t * 2.6)) * 0.5;
    s.bounce = Math.abs(Math.sin(t * 2.6)) * 0.04;
  } else if (dance === "griddy") {
    // Snel afwisselend beenwerk: heup zwiept opzij ("flick") + voor-achter,
    // knie buigt mee, armen zwaaien tegengesteld aan de benen.
    const kick = Math.sin(t * 8.2);
    const kick2 = Math.sin(t * 8.2 + Math.PI / 2);
    s.legL.hip = kick * 0.5;
    s.legL.hipZ = Math.max(0, kick) * 0.4;
    s.legL.knee = Math.max(0, kick) * 0.9;
    s.legR.hip = -kick * 0.5;
    s.legR.hipZ = -Math.max(0, -kick) * 0.4;
    s.legR.knee = Math.max(0, -kick) * 0.9;
    s.armL.sh = -kick * 0.75;
    s.armR.sh = kick * 0.75;
    s.armL.el = 0.5 + Math.abs(kick2) * 0.3;
    s.armR.el = 0.5 + Math.abs(kick2) * 0.3;
    s.hipY = kick * 0.32;
    s.hipZ = kick * 0.12;
    s.bounce = Math.abs(kick) * 0.08;
  }
  return s;
}

// Blokkig lichaamsdeel + cartoon-omtrek (inverted-hull).
function Block({ args, color, outline = 1.16 }) {
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
function Ball({ radius, color, outline = 1.13, segs = 16 }) {
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

// Arm met schouder- EN elleboog-gewricht (2 segmenten) zodat houdingen als
// "hand tegen het voorhoofd" (Take the L) anatomisch kunnen.
function Arm({ shoulderRef, elbowRef, side, color, glove }) {
  return (
    <group ref={shoulderRef} position={[side * 0.36, 0.28, 0]}>
      <group position={[0, -0.19, 0]}><Block args={[0.15, 0.36, 0.15]} color={color} /></group>
      <group ref={elbowRef} position={[0, -0.36, 0]}>
        <group position={[0, -0.17, 0]}><Block args={[0.135, 0.32, 0.135]} color={color} /></group>
        <group position={[0, -0.36, 0]}><Ball radius={0.105} color={glove} /></group>
      </group>
    </group>
  );
}
// Been met heup- EN knie-gewricht.
function Leg({ hipRef, kneeRef, side, color, shoe }) {
  return (
    <group ref={hipRef} position={[side * 0.13, -0.02, 0]}>
      <group position={[0, -0.19, 0]}><Block args={[0.16, 0.36, 0.16]} color={color} /></group>
      <group ref={kneeRef} position={[0, -0.36, 0]}>
        <group position={[0, -0.16, 0]}><Block args={[0.15, 0.32, 0.15]} color={color} /></group>
        <group position={[0, -0.34, 0.03]}><Block args={[0.17, 0.1, 0.24]} color={shoe} outline={1.22} /></group>
      </group>
    </group>
  );
}

// Chunky, felgekleurd "actiefiguurtje" met een echt gelede rig (schouder+
// elleboog, heup+knie) zodat de 3 dansjes - Floss / Take the L / Griddy -
// anatomisch kloppend en dus herkenbaar zijn. gender bepaalt het silhouet:
// vrouw = rok + paardenstaart + strik, man = twee losse benen.
function DanceFigure({ color, phase = 0, big = false, gender = "m", dance = "floss" }) {
  const hips = useRef();
  const torso = useRef();
  const armLsh = useRef(); const armLel = useRef();
  const armRsh = useRef(); const armRel = useRef();
  const legLhip = useRef(); const legLknee = useRef();
  const legRhip = useRef(); const legRknee = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase;
    const s = choreograph(dance, t);
    if (hips.current) {
      hips.current.position.set(s.hipX * 0.15, s.bounce, 0);
      hips.current.rotation.y = s.hipY;
      hips.current.rotation.z = s.hipZ;
    }
    if (torso.current) torso.current.rotation.y = s.torsoY;
    if (armLsh.current) armLsh.current.rotation.z = s.armL.sh;
    if (armLel.current) armLel.current.rotation.z = s.armL.el;
    if (armRsh.current) armRsh.current.rotation.z = s.armR.sh;
    if (armRel.current) armRel.current.rotation.z = s.armR.el;
    if (legLhip.current) { legLhip.current.rotation.x = s.legL.hip; legLhip.current.rotation.z = s.legL.hipZ; }
    if (legLknee.current) legLknee.current.rotation.x = -s.legL.knee;
    if (legRhip.current) { legRhip.current.rotation.x = s.legR.hip; legRhip.current.rotation.z = s.legR.hipZ; }
    if (legRknee.current) legRknee.current.rotation.x = -s.legR.knee;
  });

  const scale = big ? 1.12 : 1.0;
  const isF = gender === "f";
  const skin = "#ffd7ad";
  const shoe = "#171417";
  const glove = "#f5f2ea";
  const hair = "#3a2416";

  return (
    <group ref={hips} scale={scale}>
      {/* Benen - altijd aanwezig en bewegend, ook bij het vrouwelijke poppetje */}
      <Leg hipRef={legLhip} kneeRef={legLknee} side={-1} color={color} shoe={shoe} />
      <Leg hipRef={legRhip} kneeRef={legRknee} side={1} color={color} shoe={shoe} />
      {/* Kort rokje - alleen decoratief bovenop de heupen, benen blijven zichtbaar/los */}
      {isF && (
        <group position={[0, -0.02, 0]}>
          <mesh>
            <coneGeometry args={[0.3, 0.22, 10]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <mesh scale={1.12}>
            <coneGeometry args={[0.3, 0.22, 10]} />
            <meshBasicMaterial color="#141014" side={BackSide} />
          </mesh>
        </group>
      )}

      <group ref={torso} position={[0, 0.14, 0]}>
        {/* Romp */}
        <Block args={[isF ? 0.42 : 0.48, 0.42, 0.28]} color={color} />
        {/* Hoofd - groot/cartoonachtig voor leesbaarheid */}
        <group position={[0, 0.58, 0]}>
          <Ball radius={isF ? 0.27 : 0.29} color={skin} />
          <mesh position={[-0.1, 0.02, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#171417" /></mesh>
          <mesh position={[0.1, 0.02, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#171417" /></mesh>
          {isF ? (
            <>
              <group position={[0, 0.08, -0.24]} rotation={[0.5, 0, 0]}><Block args={[0.12, 0.32, 0.12]} color={hair} /></group>
              <mesh position={[0, 0.24, -0.14]}><boxGeometry args={[0.14, 0.08, 0.08]} /><meshStandardMaterial color={color} /></mesh>
            </>
          ) : (
            <group position={[0, 0.16, -0.02]}><Block args={[0.42, 0.16, 0.42]} color={hair} outline={1.1} /></group>
          )}
        </group>
        {/* Armen - schouder + elleboog */}
        <Arm shoulderRef={armLsh} elbowRef={armLel} side={-1} color={color} glove={glove} />
        <Arm shoulderRef={armRsh} elbowRef={armRel} side={1} color={color} glove={glove} />
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
        camera={{ position: [0, 0.1, 3.2], fov: 34 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} color="#fff2df" />
        <pointLight position={[-2, 0.5, 1.5]} intensity={0.4} color="#ffb347" />
        <DanceFigure color={color} phase={phase} big={big} gender={gender} dance={dance} />
      </Canvas>
    </div>
  );
}
