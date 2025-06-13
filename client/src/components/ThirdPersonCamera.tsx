import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRapier } from "@react-three/rapier";

type Props = {
  playerPos: [number, number, number];
  playerRotY: number;
  freeOrbit?: boolean; // ← new prop
};

export default function ThirdPersonCamera({
  playerPos,
  playerRotY,
  freeOrbit = false,
}: Props) {
  const { camera } = useThree();
  const { rapier, world } = useRapier();

  const pitchRef = useRef(0); // vertical angle
  const yawRef = useRef(playerRotY); // horizontal angle for orbit mode
  const isPointerLocked = useRef(false);

  const smoothedPlayerPos = useRef(new THREE.Vector3(...playerPos)); // ← internal smoothed position

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;

      yawRef.current -= e.movementX * 0.002;
      pitchRef.current += e.movementY * 0.002;

      // Clamp vertical pitch
      pitchRef.current = Math.max(0.2, Math.min(Math.PI / 3, pitchRef.current));
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement !== null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
    };
  }, [freeOrbit]);

  useFrame(() => {
    // Smooth the player's position (interpolate towards new target)
    smoothedPlayerPos.current.lerp(new THREE.Vector3(...playerPos), 0.1);

    const target = smoothedPlayerPos.current.clone();
    target.y += 1.65; // eye level
    const distance = 3;
    const height = 0;

    // Use either free orbit angles or follow the player
    const yaw = freeOrbit ? yawRef.current : playerRotY;

    const zoomFactor = Math.cos(pitchRef.current);

    // Horizontal orbit offset
    const horizontalOffset = new THREE.Vector3(
      Math.sin(yaw) * -distance,
      0,
      Math.cos(yaw) * -distance
    ).multiplyScalar(zoomFactor);

    const verticalOffset = new THREE.Vector3(
      0,
      Math.sin(pitchRef.current) * distance,
      0
    );

    const totalOffset = horizontalOffset
      .add(verticalOffset)
      .add(new THREE.Vector3(0, height, 0));

    const desiredCameraPos = target.clone().add(totalOffset);

    // Raycast from target to desired camera position
    const rayDir = desiredCameraPos.clone().sub(target).normalize();
    const maxDist = distance;
    const ray = new rapier.Ray(target, rayDir);

    const hit = world.castRay(ray, maxDist, true);

    const MIN_DISTANCE = 0.3; // Don't allow the camera closer than this
    let finalCameraPos = desiredCameraPos;

    if (hit && hit.timeOfImpact < distance) {
      // If collision, place camera slightly before the hit point
      const clampedTOI = Math.max(hit.timeOfImpact - 0.1, MIN_DISTANCE);
      finalCameraPos = target.clone().add(rayDir.multiplyScalar(clampedTOI));
    }

    camera.position.lerp(finalCameraPos, 0.03);
    camera.lookAt(target);
  });

  return null;
}
