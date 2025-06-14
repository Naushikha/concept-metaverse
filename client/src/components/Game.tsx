import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, RoundedBox, Text } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import {
  playerRigidBody,
  setPlayerRigidBody,
  useGameStore,
  type Player,
} from "../utils/store";
import * as THREE from "three";
import ThirdPersonCamera from "./ThirdPersonCamera";
import { usePointerLock } from "./usePointerLock";
import { PlayerModelMale } from "./PlayerModels/DefaultMale";
import { PlayerModelFemale } from "./PlayerModels/DefaultFemale";
import { Map } from "./Map";
import { ChatBox } from "./ChatBox";
import { PlayerModelSpiderman } from "./PlayerModels/Spiderman";
import {
  CapsuleCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";

declare global {
  interface Window {
    keyState: Record<string, boolean>;
  }
}

function Player({
  player,
  physicsControlled = false,
}: {
  player: Player;
  physicsControlled?: boolean;
}) {
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
      if (!physicsControlled) {
        displayedPosition.current.lerp(targetPosition.current, 0.1);
        groupRef.current.position.copy(displayedPosition.current);
      }
      // Smooth rotation (optional)
      groupRef.current.rotation.y +=
        (currentRotationY.current - groupRef.current.rotation.y) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {player.skin === "default-male" && (
        <PlayerModelMale actionName={player.state} topColor={player.color} />
      )}
      {player.skin === "default-female" && (
        <PlayerModelFemale actionName={player.state} topColor={player.color} />
      )}
      {player.skin === "spiderman" && (
        <PlayerModelSpiderman
          actionName={player.state}
          topColor={player.color}
        />
      )}

      <Billboard position={[0, 2.1, 0]}>
        <mesh>
          <RoundedBox
            args={[1, 0.3, 0.1]}
            radius={0.06}
            steps={1}
            smoothness={4}
            bevelSegments={4}
            creaseAngle={0.4}
          >
            <meshBasicMaterial color="#000000" transparent opacity={0.3} />
          </RoundedBox>
        </mesh>
        <Text fontSize={0.2} color={player.color} anchorX="center">
          {player.username}
        </Text>
      </Billboard>
    </group>
  );
}

// TODO: Rewrite this shitty ass player controller
function MyPlayerController({ room }: { room: any }) {
  const playerBodyRef = useRef<RapierRigidBody>(null);
  const { rapier, world } = useRapier();

  const myId = useGameStore((s) => s.myId);
  const players = useGameStore((s) => s.players);
  const initialPlayer = players[myId];

  const [rotationY, setRotationY] = useState(initialPlayer.rotationY || 0);

  const vel = useRef(new THREE.Vector3());
  var travelDirection = useRef(""); // , W, A, S, D
  //  = no direction, W = forward, A = left, S = backward, D = right
  const emoting = useRef(false);
  const handledKeys = useRef(new Set<string>());

  const canJump = useRef(true);

  const gsSetMyPlayerState = useGameStore.getState().setMyPlayerState;
  const setMyPlayerState = (state: string) => {
    if (state == useGameStore.getState().players[myId].state) return;
    gsSetMyPlayerState(state); // immediately change my state for user to see
    room.send("changeState", { state: state });
  };

  // Mouse rotation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (emoting.current) return;
      setRotationY((prev) => {
        const newRot = prev - e.movementX * 0.002;
        room.send("rotate", { rotationY: newRot });
        return newRot;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [room]);

  const moveSpeed = 4;
  const jumpPower = 4;
  useFrame((_, delta) => {
    const body = playerBodyRef.current;
    if (!body) return;
    if (!playerRigidBody) setPlayerRigidBody(body); // Use from camera controls
    const bodyPos = body.translation();
    const keys = window.keyState || {};
    const moveVec = new THREE.Vector3();

    if (keys["w"]) moveVec.z += 1;
    if (keys["s"]) moveVec.z += 1;
    if (keys["a"]) moveVec.z += 1;
    if (keys["d"]) moveVec.z += 1;

    if (keys["w"] || keys["d"] || keys["s"] || keys["a"]) {
      let newTravelDirection = "";
      if (keys["w"]) newTravelDirection += "W";
      if (keys["d"]) newTravelDirection += "D";
      if (keys["s"]) newTravelDirection += "S";
      if (keys["a"]) newTravelDirection += "A";

      if (newTravelDirection !== travelDirection.current) {
        // Rotate ONCE in the intended direction
        setRotationY((prevRot) => {
          return prevRot + getMovementAngle(keys);
        });
        travelDirection.current = newTravelDirection;
      } else if (keys["d"] || keys["a"])
        setRotationY((prevRot) => {
          return prevRot + getMovementAngle(keys) * 1 * delta;
        });
    }

    if (!keys["w"] && !keys["s"] && !keys["a"] && !keys["d"]) {
      travelDirection.current = "";
    }

    const origin = body.translation();
    const ray = new rapier.Ray(origin, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, 0.2, true);

    const isGrounded = !!hit;

    if (keys[" "] && isGrounded && canJump.current) {
      setMyPlayerState("Jump");
      body.applyImpulse({ x: 0, y: jumpPower, z: 0 }, true);
      canJump.current = false;

      setTimeout(() => {
        canJump.current = true;
      }, 1000); // 150ms cooldown
    }

    const isMoving = moveVec.lengthSq() > 0;

    // Normalize and rotate moveVec based on player rotation
    if (isMoving && canJump.current) {
      moveVec.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
      vel.current.copy(moveVec).multiplyScalar(moveSpeed * delta);
      const velocity = moveVec.multiplyScalar(moveSpeed);
      body.setLinvel(
        { x: velocity.x, y: body.linvel().y, z: velocity.z },
        true
      );
      setMyPlayerState("Running");
      emoting.current = false;
    } else {
      if (keys["e"] && !handledKeys.current.has("e")) {
        handledKeys.current.add("e");
        setMyPlayerState("Dancing");
        room.send("chat", { text: "Look at me dance! 🎵🎶" });
        emoting.current = true;
      }

      if (keys["q"] && !handledKeys.current.has("q")) {
        handledKeys.current.add("q");
        setMyPlayerState("Waving");
        room.send("chat", { text: "Hey there! 👋" });
        emoting.current = true;
      }
      !emoting.current && canJump.current && setMyPlayerState("Idle");
    }

    // TODO: Make this efficient; this is called every frame
    room.send("move", {
      x: bodyPos.x,
      y: bodyPos.y,
      z: bodyPos.z,
      rotationY,
    });

    // Clean up when key is released
    if (!keys["e"]) handledKeys.current.delete("e");
    if (!keys["q"]) handledKeys.current.delete("q");
  });

  if (!players[myId]) return null;

  return (
    <>
      <RigidBody
        ref={playerBodyRef}
        type="dynamic"
        enabledRotations={[false, false, false]}
        colliders={false}
      >
        <CapsuleCollider args={[0.6, 0.4]} position={[0, 1, 0]} />
        <Player
          player={{
            ...players[myId],
            position: [0, 0, 0], // position will be updated by physics
            rotationY,
          }}
          physicsControlled={true}
        />
      </RigidBody>
    </>
  );
}

function getMovementAngle(keys: Record<string, boolean>): number {
  const up = keys["w"];
  const down = keys["s"];
  const left = keys["a"];
  const right = keys["d"];

  // No movement
  if (!up && !down && !left && !right) return 0;

  let angle = 0;

  if (up && right) angle = -Math.PI / 4; // 45° (top-right)
  else if (up && left) angle = Math.PI / 4; // 135° (top-left)
  else if (down && right) angle = (-3 * Math.PI) / 4; // -135° (bottom-right)
  else if (down && left) angle = (3 * Math.PI) / 4; // 135° (bottom-left)
  else if (up) angle = 0; // 0° (forward)
  else if (down) angle = Math.PI; // 180° (backward)
  else if (right) angle = -Math.PI / 2; // -90° (right)
  else if (left) angle = Math.PI / 2; // 90° (left)

  return angle;
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
    <>
      <ChatBox room={room} />
      <Canvas ref={canvasRef} camera={{ position: [0, 5, 10], fov: 60 }}>
        <Physics debug>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          {Object.values(players)
            .filter((p) => p.id !== myId)
            .map((p) => (
              <Player key={p.id} player={p} />
            ))}
          <gridHelper args={[100, 100]} />
          <Map />
          {room && myId && players[myId] && (
            <>
              <MyPlayerController room={room} />
              <ThirdPersonCamera
                freeOrbit={
                  players[myId].state === "Dancing" ||
                  players[myId].state === "Waving"
                }
                playerPos={players[myId].position}
                playerRotY={players[myId].rotationY}
              />
            </>
          )}
        </Physics>
      </Canvas>
    </>
  );
}

export default Game;
