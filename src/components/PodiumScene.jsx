import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, DoubleSide } from "three";

// Volgorde in de scene = volgorde van de CSS-kolommen (2e, 1e, 3e - klassiek podium).
const RANK_X = [-1.7, 0, 1.7];
const RANK_Y = [0.1, 0.34, -0.06];
const RANK_RADIUS = [0.4, 0.46, 0.36];
// Dans per podiumplek (niet per persoon - wie er ook op die plek staat doet die dans).
const RANK_DANCE = ["takeL", "floss", "griddy"];
const NEON = "#7dfcff";

// Enige vrouw in de poule op dit moment - simpele lijst i.p.v. een aanname,
// makkelijk uit te breiden als er meer vrouwen meedoen.
const FEMALE_USERS = new Set(["monica"]);

function CameraTilt() {
  const { camera } = useThree();
  useEffect(() => { camera.lookAt(0, 0.25, 0); }, [camera]);
  return null;
}

function EnergyRing({ radius }) {
  const ring = useRef();
  useFrame((_, delta) => { if (ring.current) ring.current.rotation.z += delta * 0.6; });
  return (
    <mesh ref={ring} rotation={[Math.PI / 2.15, 0, 0]}>
      <torusGeometry args={[radius * 0.85, 0.01, 8, 56]} />
      <meshBasicMaterial color={NEON} transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function Platform({ x, y, color, radius }) {
  return (
    <group position={[x, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius * 1.04, 0.05, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[radius * 0.94, radius * 1.15, 6]} />
        <meshBasicMaterial color={NEON} transparent opacity={0.9} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <EnergyRing radius={radius} />
    </group>
  );
}

// Hologram-materiaal: zwakke gekleurde vulling + felle cyaan wireframe-rand.
function HoloMesh({ children, color, scale = 1 }) {
  return (
    <>
      <mesh>{children}<meshStandardMaterial color={color} transparent opacity={0.4} emissive={color} emissiveIntensity={0.6} /></mesh>
      <mesh scale={scale}>{children}<meshBasicMaterial color={NEON} wireframe transparent opacity={0.55} /></mesh>
    </>
  );
}

// Geeft per dans + tijd de houoek/positie-waarden terug voor elk onderdeel.
function choreograph(dance, t) {
  const s = { armL: 0, armR: 0, legL: 0, legR: 0, hipY: 0, hipZ: 0, torsoY: 0, bounce: 0 };
  if (dance === "floss") {
    const swing = Math.sin(t * 4.2);
    s.armL = 0.9 + swing * 0.6;
    s.armR = -0.9 - swing * 0.6;
    s.torsoY = -swing * 0.4;
    s.hipY = swing * 0.4;
    s.bounce = Math.abs(Math.sin(t * 4.2)) * 0.035;
  } else if (dance === "takeL") {
    s.armR = -2.3 + Math.sin(t * 3) * 0.05; // hand tegen voorhoofd - de "L"
    s.armL = 0.5 + Math.sin(t * 3 + Math.PI) * 0.2;
    s.hipZ = Math.sin(t * 2.3) * 0.2;
    s.legL = Math.sin(t * 2.3) * 0.35;
    s.legR = -Math.sin(t * 2.3) * 0.35;
    s.bounce = Math.abs(Math.sin(t * 2.3)) * 0.025;
  } else if (dance === "griddy") {
    const kick = Math.sin(t * 7.5);
    s.legL = kick * 0.75;
    s.legR = -kick * 0.75;
    s.armL = 0.6 - kick * 0.45;
    s.armR = -0.6 + kick * 0.45;
    s.hipY = kick * 0.3;
    s.bounce = Math.abs(kick) * 0.06;
  }
  return s;
}

// Poppetje met eenvoudig gewricht-rig (heup > romp/hoofd/armen, losse benen) zodat
// het echte dansbewegingen kan maken. gender bepaalt silhouet: vrouw = rok +
// paardenstaart, man = twee losse benen.
function DanceFigure({ x, y, color, phase = 0, big = false, gender = "m", dance = "floss" }) {
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
      hips.current.position.set(x, y + 0.32 + s.bounce, 0);
      hips.current.rotation.y = s.hipY;
      hips.current.rotation.z = s.hipZ;
    }
    if (torso.current) torso.current.rotation.y = s.torsoY;
    if (armL.current) armL.current.rotation.z = s.armL;
    if (armR.current) armR.current.rotation.z = s.armR;
    if (legL.current) legL.current.rotation.x = s.legL;
    if (legR.current) legR.current.rotation.x = s.legR;
  });

  const scale = big ? 0.62 : 0.56;
  const isF = gender === "f";

  return (
    <group ref={hips} scale={scale}>
      {/* Benen (mannen) / rok (vrouwen) - vanuit de heup */}
      {isF ? (
        <mesh position={[0, -0.14, 0]}>
          <coneGeometry args={[0.24, 0.34, 10]} />
          <meshStandardMaterial color={color} transparent opacity={0.4} emissive={color} emissiveIntensity={0.6} />
        </mesh>
      ) : (
        <>
          <group ref={legL} position={[-0.11, -0.02, 0]}>
            <group position={[0, -0.2, 0]}><HoloMesh color={color} scale={1.08}><capsuleGeometry args={[0.075, 0.32, 4, 8]} /></HoloMesh></group>
          </group>
          <group ref={legR} position={[0.11, -0.02, 0]}>
            <group position={[0, -0.2, 0]}><HoloMesh color={color} scale={1.08}><capsuleGeometry args={[0.075, 0.32, 4, 8]} /></HoloMesh></group>
          </group>
        </>
      )}

      <group ref={torso} position={[0, 0.06, 0]}>
        {/* Romp */}
        <HoloMesh color={color} scale={1.06}><capsuleGeometry args={[isF ? 0.2 : 0.24, 0.3, 4, 12]} /></HoloMesh>
        {/* Hoofd */}
        <group position={[0, 0.5, 0]}>
          <HoloMesh color={color} scale={1.05}><sphereGeometry args={[isF ? 0.22 : 0.25, 20, 16]} /></HoloMesh>
          {/* Paardenstaart voor het vrouwelijke poppetje */}
          {isF && (
            <group position={[0, 0.06, -0.2]} rotation={[0.6, 0, 0]}>
              <HoloMesh color={color} scale={1.1}><capsuleGeometry args={[0.06, 0.22, 4, 8]} /></HoloMesh>
            </group>
          )}
        </group>
        {/* Armen - pivot bij de schouder */}
        <group ref={armL} position={[isF ? -0.3 : -0.36, 0.22, 0]}>
          <group position={[0, -0.17, 0]}><HoloMesh color={color} scale={1.08}><capsuleGeometry args={[0.065, 0.34, 4, 8]} /></HoloMesh></group>
        </group>
        <group ref={armR} position={[isF ? 0.3 : 0.36, 0.22, 0]}>
          <group position={[0, -0.17, 0]}><HoloMesh color={color} scale={1.08}><capsuleGeometry args={[0.065, 0.34, 4, 8]} /></HoloMesh></group>
        </group>
      </group>
    </group>
  );
}

// Deeltjes die langzaam omhoog "verdampen" boven elk platform.
function RisingSparks({ x, y, count = 18, color }) {
  const points = useRef();
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.55;
      pos[i * 3 + 1] = y + Math.random() * 1.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.55;
      speed[i] = 0.12 + Math.random() * 0.2;
    }
    return { pos, speed, top: y + 1.1, bottom: y };
  }, [x, y, count]);
  useFrame((_, delta) => {
    if (!points.current) return;
    const arr = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += data.speed[i] * delta;
      if (arr[i * 3 + 1] > data.top) arr[i * 3 + 1] = data.bottom;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.04} transparent opacity={0.6} blending={AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// Hightech podium-scene: 3 platforms met neon-rand, roterende energiering,
// dansende hologram-poppetjes (Floss / Take the L / Griddy) en opstijgende
// deeltjes. Puur decoratief. people[] volgt de CSS-kolomvolgorde (2e,1e,3e):
// [{ color, username }].
export default function PodiumScene({ people = [] }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 1.3, 4.3], fov: 30 }}
    >
      <CameraTilt />
      <fog attach="fog" args={["#1c1c1e", 3, 6.5]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 3, 2]} intensity={0.9} color="#fff2df" />
      <pointLight position={[0, 1.5, 2]} intensity={0.5} color={NEON} />
      <gridHelper args={[10, 10, "#c96b1f", "#2a1c10"]} position={[0, -0.55, 0]} />
      {RANK_X.map((x, i) => people[i] && (
        <group key={i}>
          <Platform x={x} y={RANK_Y[i]} color={people[i].color} radius={RANK_RADIUS[i]} />
          <DanceFigure
            x={x} y={RANK_Y[i]} color={people[i].color} phase={i * 1.7} big={i === 1}
            gender={FEMALE_USERS.has((people[i].username || "").toLowerCase()) ? "f" : "m"}
            dance={RANK_DANCE[i]}
          />
          <RisingSparks x={x} y={RANK_Y[i]} color={people[i].color} />
        </group>
      ))}
    </Canvas>
  );
}
