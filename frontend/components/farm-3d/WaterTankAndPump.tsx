'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaterTankAndPumpProps {
  position?: [number, number, number];
  pumpActive: boolean;
}

export const WaterTankAndPump: React.FC<WaterTankAndPumpProps> = ({
  position = [-5.0, 0, 0],
  pumpActive,
}) => {
  const pumpMeshRef = useRef<THREE.Group>(null);
  const ledMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    // Animate subtle pump vibration when running
    if (pumpMeshRef.current && pumpActive) {
      const t = state.clock.getElapsedTime();
      pumpMeshRef.current.position.y = 0.35 + Math.sin(t * 50) * 0.004;
    } else if (pumpMeshRef.current) {
      pumpMeshRef.current.position.y = 0.35;
    }

    // LED pump indicator
    if (ledMaterialRef.current) {
      if (pumpActive) {
        const pulse = (Math.sin(state.clock.getElapsedTime() * 10) + 1) / 2;
        ledMaterialRef.current.color = new THREE.Color('#10b981');
        ledMaterialRef.current.emissive = new THREE.Color('#34d399');
        ledMaterialRef.current.emissiveIntensity = 0.6 + pulse * 0.8;
      } else {
        ledMaterialRef.current.color = new THREE.Color('#475569');
        ledMaterialRef.current.emissive = new THREE.Color('#000000');
        ledMaterialRef.current.emissiveIntensity = 0.0;
      }
    }
  });

  return (
    <group position={position}>
      {/* Concrete Equipment Pad */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[2.4, 0.2, 2.8]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* Main Water Storage Silo / Tank */}
      <group position={[-0.4, 0.2, 0]}>
        {/* Main Tank Body */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.75, 0.75, 2.2, 24]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
        </mesh>

        {/* Tank Roof Cone */}
        <mesh position={[0, 2.45, 0]} castShadow>
          <coneGeometry args={[0.8, 0.35, 24]} />
          <meshStandardMaterial color="#0369a1" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* Tank Reinforcement Metal Bands */}
        {[-0.6, 0, 0.6].map((yOffset, i) => (
          <mesh key={i} position={[0, 1.2 + yOffset, 0]}>
            <torusGeometry args={[0.76, 0.02, 8, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}

        {/* Water Level Sight Gauge Tube */}
        <mesh position={[0.78, 1.2, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.8, 8]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* Industrial Submersible/Relay Water Pump */}
      <group ref={pumpMeshRef} position={[0.65, 0.35, 0]}>
        {/* Motor Housing */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.55, 16]} />
          <meshStandardMaterial color="#0f766e" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Pump Impeller Housing */}
        <mesh position={[0.32, 0, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.18, 16]} />
          <meshStandardMaterial color="#134e4a" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Suction Pipe from Tank */}
        <mesh position={[-0.45, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} />
        </mesh>

        {/* Discharge Pipe going into farm distribution manifold */}
        <mesh position={[0.42, 0.25, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.45, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} />
        </mesh>

        {/* Power / Relay Junction Box */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.25, 0.18, 0.22]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Active Power Indicator LED */}
        <mesh position={[0.13, 0.27, 0.08]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial ref={ledMaterialRef} color="#475569" />
        </mesh>
      </group>
    </group>
  );
};
