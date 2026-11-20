'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IrrigationNetworkProps {
  pumpActive: boolean;
  plotPositions: [number, number, number][];
}

export const IrrigationNetwork: React.FC<IrrigationNetworkProps> = ({
  pumpActive,
  plotPositions,
}) => {
  const pulseMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Animate water flow through the pipes when pump is active
  useFrame((state) => {
    if (pulseMaterialRef.current) {
      if (pumpActive) {
        const t = state.clock.getElapsedTime();
        const pulse = (Math.sin(t * 8) + 1) / 2;
        pulseMaterialRef.current.emissive = new THREE.Color('#38bdf8');
        pulseMaterialRef.current.emissiveIntensity = 0.4 + pulse * 0.8;
        pulseMaterialRef.current.color = new THREE.Color('#0284c7');
      } else {
        pulseMaterialRef.current.emissive = new THREE.Color('#000000');
        pulseMaterialRef.current.emissiveIntensity = 0.0;
        pulseMaterialRef.current.color = new THREE.Color('#334155');
      }
    }
  });

  return (
    <group>
      {/* Central Distribution Trunk Pipe running along the X axis from tank */}
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 10.5, 16]} />
        <meshStandardMaterial
          ref={pulseMaterialRef}
          color="#334155"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Lateral Drip Irrigation Lines to each plot */}
      {plotPositions.map((pos, idx) => (
        <group key={idx}>
          {/* Connector T-Junction Pipe */}
          <mesh position={[pos[0], 0.25, pos[2] > 0 ? pos[2] / 2 : pos[2] / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, Math.abs(pos[2]), 12]} />
            <meshStandardMaterial color="#475569" roughness={0.5} />
          </mesh>

          {/* Drip line directly running across the plot bed */}
          <mesh position={[pos[0], pos[1] + 0.22, pos[2]]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 2.9, 12]} />
            <meshStandardMaterial
              color={pumpActive ? '#0284c7' : '#475569'}
              emissive={pumpActive ? '#38bdf8' : '#000000'}
              emissiveIntensity={pumpActive ? 0.5 : 0.0}
              roughness={0.4}
            />
          </mesh>

          {/* Micro Drip Emitters along the bed */}
          {[-1.0, -0.5, 0, 0.5, 1.0].map((xOffset, emitterIdx) => (
            <mesh
              key={emitterIdx}
              position={[pos[0] + xOffset, pos[1] + 0.23, pos[2]]}
            >
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color={pumpActive ? '#38bdf8' : '#1e293b'}
                emissive={pumpActive ? '#0284c7' : '#000000'}
                emissiveIntensity={pumpActive ? 0.8 : 0.0}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};
