'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CropPlantsProps {
  plotPosition: [number, number, number];
  plotSize?: [number, number, number];
  moisture: number;
  cropType?: string;
}

export const CropPlants: React.FC<CropPlantsProps> = ({
  plotPosition,
  plotSize = [3.2, 0.4, 2.2],
  moisture,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Plant color based on moisture health
  const plantColor = useMemo(() => {
    if (moisture < 28) return '#a39149'; // Wilted yellow-green
    if (moisture > 80) return '#1b4a32'; // Over-saturated dark green
    return '#22c55e'; // Lush vibrant emerald green
  }, [moisture]);

  // Generate a grid of crop plants (e.g. 3 rows x 6 columns)
  const plants = useMemo(() => {
    const list: { x: number; z: number; scale: number; phase: number }[] = [];
    const rows = 3;
    const cols = 6;
    const xSpacing = (plotSize[0] * 0.8) / (cols - 1);
    const zSpacing = (plotSize[2] * 0.7) / (rows - 1);
    const startX = -(plotSize[0] * 0.8) / 2;
    const startZ = -(plotSize[2] * 0.7) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          x: startX + c * xSpacing + (Math.random() - 0.5) * 0.05,
          z: startZ + r * zSpacing + (Math.random() - 0.5) * 0.05,
          scale: 0.8 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    return list;
  }, [plotSize]);

  // Subtle wind movement in plants
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.children.forEach((child, index) => {
        const p = plants[index];
        if (p) {
          child.rotation.z = Math.sin(time * 2.5 + p.phase) * 0.08;
          child.rotation.x = Math.cos(time * 2.0 + p.phase) * 0.06;
        }
      });
    }
  });

  const soilTopY = plotPosition[1] + plotSize[1] / 2;

  return (
    <group position={[plotPosition[0], soilTopY, plotPosition[2]]} ref={groupRef}>
      {plants.map((p, idx) => (
        <group key={idx} position={[p.x, 0, p.z]} scale={[p.scale, p.scale, p.scale]}>
          {/* Stem */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.36, 6]} />
            <meshStandardMaterial color={plantColor} roughness={0.7} />
          </mesh>

          {/* Leaves */}
          <mesh position={[0.08, 0.28, 0]} rotation={[0, 0, -0.6]} castShadow>
            <coneGeometry args={[0.07, 0.22, 5]} />
            <meshStandardMaterial color={plantColor} roughness={0.6} />
          </mesh>
          <mesh position={[-0.08, 0.24, 0]} rotation={[0, 0, 0.6]} castShadow>
            <coneGeometry args={[0.07, 0.2, 5]} />
            <meshStandardMaterial color={plantColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.35, 0.07]} rotation={[0.6, 0, 0]} castShadow>
            <coneGeometry args={[0.06, 0.18, 5]} />
            <meshStandardMaterial color={plantColor} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
