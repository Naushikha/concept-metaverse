import { useGLTF } from "@react-three/drei";

export function Map() {
  // load gltf model
  const gltf = useGLTF("./models/18th_century_city_building_low_poly.glb");
  return (
    <group position={[0, 0, 0]} rotation={[0, 0, 0]} scale={1}>
      <primitive object={gltf.scene} />
    </group>
  );
}
