'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Radio, Activity } from 'lucide-react';

interface SensorMarker3DProps {
  id: string;
  name: string;
  position: [number, number, number];
  moisture: number;
  temperature: number;
  humidity: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const SensorMarker3D: React.FC<SensorMarker3DProps> = ({
  id,
  name,
  position,
  moisture,
  temperature,
  humidity,
  isSelected,
  onSelect,
}) => {
  const beaconRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (beaconRef.current) {
      beaconRef.current.position.y = 0.95 + Math.sin(t * 3) * 0.04;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 1.5;
      const s = 1 + Math.sin(t * 4) * 0.15;
      ringRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position}>
      {/* Probe Stem into Soil */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Sensor Electronics Casing (ESP8266 + Transceiver) */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>

      {/* Mini Solar Cell on top */}
      <mesh position={[0, 0.86, 0]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.16, 0.015, 0.14]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Whip Antenna */}
      <mesh position={[0.05, 0.95, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.25, 6]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Glowing Beacon Sphere */}
      <mesh
        ref={beaconRef}
        position={[0, 0.95, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial
          color={moisture < 30 ? '#f59e0b' : '#10b981'}
          emissive={moisture < 30 ? '#d97706' : '#34d399'}
          emissiveIntensity={hovered || isSelected ? 1.5 : 0.8}
        />
      </mesh>

      {/* Pulsing Holo Ring */}
      <mesh
        ref={ringRef}
        position={[0, 0.95, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.12, 0.01, 8, 24]} />
        <meshBasicMaterial
          color={moisture < 30 ? '#f59e0b' : '#34d399'}
          transparent
          opacity={hovered || isSelected ? 0.9 : 0.4}
        />
      </mesh>

      {/* Floating 3D HTML Tooltip Badge */}
      <Html position={[0, 1.25, 0]} center distanceFactor={14}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`cursor-pointer transition-transform duration-150 select-none ${
            hovered || isSelected ? 'scale-110' : 'scale-100'
          }`}
        >
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#090e0c]/90 border border-emerald-500/40 shadow-glow backdrop-blur-md whitespace-nowrap">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-200 font-bold">{moisture}%</span>
            <span className="text-[9px] font-mono text-zinc-400">| {temperature}°C</span>
          </div>
        </div>
      </Html>
    </group>
  );
};
