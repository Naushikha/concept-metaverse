import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, OrbitControls, Text } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useGameStore, type Player } from "../utils/store";
import * as THREE from "three";

declare global {
  interface Window {
    keyState: Record<string, boolean>;
  }
}

function Player({ player }: { player: Player }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...player.position);
      groupRef.current.rotation.y = player.rotationY;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 2]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      <mesh position={[0, 1.1, 0.5]}>
        <boxGeometry args={[0.5, 0.2, 0.2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <Billboard>
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
        >
          {player.username}
        </Text>
      </Billboard>
    </group>
  );
}

function MyPlayerController({ room }: { room: any }) {
  const myId = useGameStore((s) => s.myId);
  const players = useGameStore((s) => s.players);
  // get initial position and rotation from the player's state
  const initialPlayer = players[myId];
  const [pos, setPos] = useState([
    initialPlayer.position[0],
    initialPlayer.position[1],
    initialPlayer.position[2],
  ]);
  const [rotY, setRotY] = useState(0);

  useFrame((_, delta) => {
    const keys = {
      forward: window.keyState["w"],
      backward: window.keyState["s"],
      left: window.keyState["a"],
      right: window.keyState["d"],
    };

    let dx = 0,
      dz = 0;
    if (keys.forward) dz -= 1;
    if (keys.backward) dz += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    const speed = 5 * delta;
    const angle = Math.atan2(dx, dz);

    if (dx !== 0 || dz !== 0) {
      const newX = pos[0] + Math.sin(angle) * speed;
      const newZ = pos[2] + Math.cos(angle) * speed;
      setPos([newX, pos[1], newZ]);
      setRotY(angle);
      room.send("move", { x: newX, y: pos[1], z: newZ, rotationY: angle });
    }
  });

  if (!players[myId]) return null;

  return (
    <Player
      player={{
        ...players[myId],
        position: pos as [number, number, number],
        rotationY: rotY,
      }}
    />
  );
}

function Game() {
  const players = useGameStore((s) => s.players);
  const room = useGameStore((s) => s.room);

  useEffect(() => {
    const keyState: Record<string, boolean> = {};
    window.keyState = keyState;
    window.addEventListener(
      "keydown",
      (e) => (keyState[e.key.toLowerCase()] = true)
    );
    window.addEventListener(
      "keyup",
      (e) => (keyState[e.key.toLowerCase()] = false)
    );
  }, []);

  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {room && <MyPlayerController room={room} />}
      {Object.values(players).map((p) => (
        <Player key={p.id} player={p} />
      ))}
      <gridHelper args={[100, 100]} />
      <OrbitControls />
    </Canvas>
  );
}

export default Game;
