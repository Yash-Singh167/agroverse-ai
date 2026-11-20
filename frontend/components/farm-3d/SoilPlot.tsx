'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SoilCondition } from '@/lib/types';

interface SoilPlotProps {
  id: string;
  name: string;
  crop: string;
  moisture: number; // 0 - 100
  position: [number, number, number];
  size?: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
}

export const SoilPlot: React.FC<SoilPlotProps> = ({
  name,
  crop,
  moisture,
  position,
  size = [3.2, 0.4, 2.2],
  isSelected,
  onSelect,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Calculate target color based on moisture
  const targetColor = useMemo(() => {
    if (moisture < 30) {
      // Dry arid soil (warm dry clay/sand)
      return new THREE.Color('#945d31');
    } else if (moisture > 75) {
      // Excess moisture / waterlogged soil (dark damp earth with blue/teal sheen)
      return new THREE.Color('#253f47');
    } else {
      // Optimal fertile loam
      return new THREE.Color('#433022');
    }
  }, [moisture]);

  // Smooth color transition
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, 0.05);
      if (isSelected) {
        materialRef.current.emissive = new THREE.Color('#10b981');
        materialRef.current.emissiveIntensity = 0.25;
      } else {
        materialRef.current.emissive = new THREE.Color('#000000');
        materialRef.current.emissiveIntensity = 0.0;
      }
    }
  });

  return (
    <group position={position}>
      {/* Plot Base Soil Bed */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          ref={materialRef}
          roughness={moisture > 75 ? 0.3 : 0.85}
          metalness={moisture > 75 ? 0.2 : 0.05}
        />
      </mesh>

      {/* Plot Wooden Raised Bed Perimeter Border */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[size[0] + 0.1, size[1] - 0.05, size[2] + 0.1]} />
        <meshStandardMaterial color="#2d2218" roughness={0.9} />
      </mesh>

      {/* Selection Border Outline */}
      {isSelected && (
        <mesh position={[0, size[1] / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size[0] + 0.15, size[2] + 0.15]} />
          <meshBasicMaterial
            color="#10b981"
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
};
