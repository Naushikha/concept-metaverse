import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useGameStore, type Player } from "../utils/store";
import * as THREE from "three";
import ThirdPersonCamera from "./ThirdPersonCamera";
import { usePointerLock } from "./usePointerLock";
import { PlayerModelMale } from "./PlayerModelMale";
import { PlayerModelFemale } from "./PlayerModelFemale";

declare global {
  interface Window {
    keyState: Record<string, boolean>;
  }
}

function Player({ player }: { player: Player }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3(...player.position));
  const displayedPosition = useRef(new THREE.Vector3(...player.position));
  const currentRotationY = useRef(player.rotationY);

  // update target position when player updates
  useEffect(() => {
    targetPosition.current.set(...player.position);
    currentRotationY.current = player.rotationY;
  }, [player.position, player.rotationY]);

  useFrame(() => {
    if (groupRef.current) {
      // Interpolate position
      displayedPosition.current.lerp(targetPosition.current, 0.1);
      groupRef.current.position.copy(displayedPosition.current);

      // Smooth rotation (optional)
      groupRef.current.rotation.y +=
        (currentRotationY.current - groupRef.current.rotation.y) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* <mesh>
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
      </mesh> */}
      {player.skin === "default-male" && (
        <PlayerModelMale actionName={player.state} topColor={player.color} />
      )}
      {player.skin === "default-female" && (
        <PlayerModelFemale actionName={player.state} topColor={player.color} />
      )}

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
  const initialPlayer = players[myId];

  const [pos, setPos] = useState<[number, number, number]>([
    initialPlayer.position[0],
    initialPlayer.position[1],
    initialPlayer.position[2],
  ]);
  const [rotationY, setRotationY] = useState(initialPlayer.rotationY || 0);

  const vel = useRef(new THREE.Vector3());

  // Mouse rotation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setRotationY((prev) => {
        const newRot = prev - e.movementX * 0.002;
        room.send("rotate", { rotationY: newRot });
        return newRot;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [room]);

  useFrame((_, delta) => {
    const keys = window.keyState || {};
    const moveSpeed = 5;
    const moveVec = new THREE.Vector3();

    if (keys["w"]) moveVec.z += 1;
    if (keys["s"]) moveVec.z -= 1;
    if (keys["a"]) moveVec.x += 1;
    if (keys["d"]) moveVec.x -= 1;

    // Normalize and rotate moveVec based on player rotation
    if (moveVec.lengthSq() > 0) {
      moveVec.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
      vel.current.copy(moveVec).multiplyScalar(moveSpeed * delta);

      const newPos = [
        pos[0] + vel.current.x,
        pos[1],
        pos[2] + vel.current.z,
      ] as [number, number, number];

      setPos(newPos);
      room.send("move", {
        x: newPos[0],
        y: newPos[1],
        z: newPos[2],
        rotationY,
      });
      room.send("changeState", { state: "Running" });
    } else room.send("changeState", { state: "Idle" });
  });

  if (!players[myId]) return null;

  return (
    <Player
      player={{
        ...players[myId],
        position: pos,
        rotationY,
      }}
    />
  );
}

function Game() {
  const players = useGameStore((s) => s.players);
  const room = useGameStore((s) => s.room);
  const myId = useGameStore((s) => s.myId);
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  usePointerLock(canvasRef); // lock on click

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
    <Canvas ref={canvasRef} camera={{ position: [0, 5, 10], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      {room && <MyPlayerController room={room} />}
      {Object.values(players)
        .filter((p) => p.id !== myId)
        .map((p) => (
          <Player key={p.id} player={p} />
        ))}
      <gridHelper args={[100, 100]} />
      {myId && players[myId] && (
        <ThirdPersonCamera
          playerPos={players[myId].position}
          playerRotY={players[myId].rotationY}
        />
      )}
    </Canvas>
  );
}

export default Game;
