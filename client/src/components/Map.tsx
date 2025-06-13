import { useGLTF } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";

export function Map() {
  // load gltf model
  const gltf = useGLTF("./models/18th_century_city_building_low_poly.glb");
  return (
    <group position={[-10, 0, 0]} rotation={[0, 0, 0]} scale={1}>
      <primitive object={gltf.scene} />
      <RigidBody type="fixed" colliders="hull">
        <CuboidCollider args={[6, 10, 16.5]} />
        <CuboidCollider
          args={[35, 0.2, 35]}
          position={[0, -0.2, 0]}
          friction={3}
        />
        <CuboidCollider
          args={[0.4, 0.4, 1.3]}
          position={[9.4, 0.6, -5.7]}
        />
      </RigidBody>
    </group>
  );
}
