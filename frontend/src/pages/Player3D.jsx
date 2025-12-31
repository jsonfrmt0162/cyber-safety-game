
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayerControls } from "../hooks/usePlayerControls";

export default function Player3D({ onMove }) {
  const playerRef = useRef();
  const controls = usePlayerControls();
  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();
  const SPEED = 6;

  useFrame((state, delta) => {
    if (!playerRef.current) return;

    const { forward, backward, left, right } = controls;

    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED * delta);

    playerRef.current.position.add(direction);
    playerRef.current.position.y = 1;

    // follow camera
    const camOffset = new THREE.Vector3(0, 5, 10);
    const desiredCamPos = playerRef.current.position.clone().add(camOffset);
    state.camera.position.lerp(desiredCamPos, 0.15);
    state.camera.lookAt(playerRef.current.position);

    // ✅ tell parent world where the player is
    if (onMove) {
      onMove(playerRef.current.position.clone());
    }
  });

  return (
    <group ref={playerRef} position={[0, 1, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}
