'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaterFlowParticlesProps {
  pumpActive: boolean;
  plotPositions: [number, number, number][];
}

export const WaterFlowParticles: React.FC<WaterFlowParticlesProps> = ({
  pumpActive,
  plotPositions,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCountPerPlot = 45;
  const totalParticles = particleCountPerPlot * plotPositions.length;

  const [positions, initialOffsets] = useMemo(() => {
    const pos = new Float32Array(totalParticles * 3);
    const offsets: { x: number; z: number; speed: number; startY: number }[] = [];

    let pIdx = 0;
    plotPositions.forEach((plotPos) => {
      for (let i = 0; i < particleCountPerPlot; i++) {
        const xOffset = (Math.random() - 0.5) * 2.6;
        const zOffset = (Math.random() - 0.5) * 1.6;
        const startY = plotPos[1] + 0.35 + Math.random() * 0.15;
        const speed = 0.015 + Math.random() * 0.02;

        pos[pIdx * 3] = plotPos[0] + xOffset;
        pos[pIdx * 3 + 1] = startY;
        pos[pIdx * 3 + 2] = plotPos[2] + zOffset;

        offsets.push({
          x: plotPos[0] + xOffset,
          z: plotPos[2] + zOffset,
          speed,
          startY,
        });

        pIdx++;
      }
    });

    return [pos, offsets];
  }, [plotPositions, totalParticles]);

  useFrame(() => {
    if (!pointsRef.current || !pumpActive) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < totalParticles; i++) {
      const offset = initialOffsets[i];
      let y = array[i * 3 + 1];
      y -= offset.speed;

      // Reset droplet back to top once it hits soil surface
      if (y < 0.22) {
        y = offset.startY;
      }
      array[i * 3 + 1] = y;
    }

    posAttr.needsUpdate = true;
  });

  if (!pumpActive) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        color="#38bdf8"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
