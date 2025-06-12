import * as THREE from "three";
import { useRef, useEffect, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

// type ActionName =
//   | "Dancing"
//   | "Idle"
//   | "Jump"
//   | "Running"
//   | "Walking"
//   | "Waving";

interface PlayerModelMaleProps {
  actionName: string;
  topColor?: string; // hex or css color
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

// https://github.com/pmndrs/react-three-fiber/issues/245
function useMeshCloneForGLTF(URL: string) {
  const gltf = useGLTF(URL);
  const clonedScene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf]);
  return {
    gltfScene: clonedScene,
    gltfMaterials: gltf.materials,
    gltfAnimations: gltf.animations,
  };
}

export function PlayerModelFemale({
  actionName,
  topColor = "#ffffff",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: PlayerModelMaleProps) {
  const group = useRef<THREE.Group>(null!);
  const { gltfScene, gltfAnimations } = useMeshCloneForGLTF(
    "./models/asian_female_animated.glb"
  );
  const { actions } = useAnimations(gltfAnimations, group);

  // Smooth action transition
  useEffect(() => {
    if (!actions || !actionName) return;
    Object.entries(actions).forEach(([name, action]) => {
      if (name === actionName) {
        action && action.reset().fadeIn(0.2).play();
      } else {
        action && action.fadeOut(0.2);
      }
    });
    // Cleanup: fade out all actions on unmount
    return () => {
      Object.values(actions).forEach((action) => action && action.fadeOut(0.2));
    };
  }, [actions, actionName]);

  useEffect(() => {
    if (!gltfScene || !topColor) return;

    const node = gltfScene.getObjectByName(
      "Wolf3D_Outfit_Top001"
    ) as THREE.Mesh;
    if (!node || !node.material) return;

    // Check if we’ve already applied a cloned material to avoid re-cloning
    if (!Array.isArray(node.material) && !node.userData.hasClonedMaterial) {
      const originalMaterial = node.material as THREE.MeshStandardMaterial;
      const newMaterial = originalMaterial.clone();
      newMaterial.color.set(topColor);
      node.material = newMaterial;

      // Mark it so we don't clone again on future re-renders
      node.userData.hasClonedMaterial = true;
    } else if (!Array.isArray(node.material)) {
      // If we already cloned it, just update the color
      (node.material as THREE.MeshStandardMaterial).color.set(topColor);
    }
  }, [gltfScene, topColor]);

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={scale}
      dispose={null}
    >
      <primitive object={gltfScene} />
    </group>
  );
}

// useGLTF.preload("/asian_male_animated.glb");
