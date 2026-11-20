'use client';

import React from 'react';
import { SoilPlot } from './SoilPlot';
import { CropPlants } from './CropPlants';
import { IrrigationNetwork } from './IrrigationNetwork';
import { WaterFlowParticles } from './WaterFlowParticles';
import { WaterTankAndPump } from './WaterTankAndPump';
import { SensorMarker3D } from './SensorMarker3D';
import { FarmPlot } from '@/lib/types';

interface FarmSceneProps {
  plots: FarmPlot[];
  selectedPlotId: string | null;
  onSelectPlot: (plot: FarmPlot) => void;
  pumpActive: boolean;
  liveMoisture: number;
  liveTemp: number;
  liveHumidity: number;
}

export const FarmScene: React.FC<FarmSceneProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
  pumpActive,
  liveMoisture,
  liveTemp,
  liveHumidity,
}) => {
  const plotPositions = plots.map((p) => p.position);

  return (
    <group>
      {/* Dynamic Directional Sunlight with Soft Shadows */}
      <ambientLight intensity={0.65} color="#e6f4ea" />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={40}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        color="#fffbeb"
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.35} color="#38bdf8" />

      {/* Main Ground Farm Terrain Base */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[9.5, 9.5, 0.1, 48]} />
        <meshStandardMaterial color="#1a2e22" roughness={0.9} />
      </mesh>

      {/* Outer Ground Ring Contour */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <cylinderGeometry args={[10.5, 10.5, 0.08, 48]} />
        <meshStandardMaterial color="#0e1b14" roughness={0.95} />
      </mesh>

      {/* Agricultural Plots & Crops */}
      {plots.map((plot) => {
        // Plot 1 mirrors the live ESP8266 moisture sensor
        const currentPlotMoisture = plot.id === 'plot_1' ? liveMoisture : plot.moisture;

        return (
          <group key={plot.id}>
            <SoilPlot
              id={plot.id}
              name={plot.name}
              crop={plot.crop}
              moisture={currentPlotMoisture}
              position={plot.position}
              isSelected={selectedPlotId === plot.id}
              onSelect={() => onSelectPlot(plot)}
            />

            <CropPlants
              plotPosition={plot.position}
              moisture={currentPlotMoisture}
              cropType={plot.crop}
            />

            {plot.sensorInstalled && (
              <SensorMarker3D
                id={`sensor_${plot.id}`}
                name={`Probe ${plot.name}`}
                position={[plot.position[0] + 0.8, plot.position[1] + 0.2, plot.position[2] + 0.4]}
                moisture={currentPlotMoisture}
                temperature={liveTemp}
                humidity={liveHumidity}
                isSelected={selectedPlotId === plot.id}
                onSelect={() => onSelectPlot(plot)}
              />
            )}
          </group>
        );
      })}

      {/* Irrigation Piping System */}
      <IrrigationNetwork
        pumpActive={pumpActive}
        plotPositions={plotPositions}
      />

      {/* Water Spraying Particles */}
      <WaterFlowParticles
        pumpActive={pumpActive}
        plotPositions={plotPositions}
      />

      {/* Water Tank & Pump Subassembly */}
      <WaterTankAndPump
        position={[-5.8, 0, 0]}
        pumpActive={pumpActive}
      />

      {/* Perimeter Farm Path Decals / Walkway Stones */}
      {[-4, -2, 0, 2, 4].map((x, i) => (
        <mesh key={i} position={[x, 0.01, 3.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.9, 0.5]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};
