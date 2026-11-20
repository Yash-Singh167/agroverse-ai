'use client';

import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { FarmScene } from './FarmScene';
import { FarmFallback2D } from './FarmFallback2D';
import { FarmPlot } from '@/lib/types';
import { 
  RotateCcw, 
  Eye, 
  Layers, 
  Droplet, 
  Radio, 
  Sparkles, 
  Maximize2, 
  Loader2, 
  CheckCircle2,
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FarmCanvasProps {
  pumpActive: boolean;
  onTogglePump?: () => void;
  liveMoisture: number;
  liveTemp: number;
  liveHumidity: number;
}

const DEFAULT_PLOTS: FarmPlot[] = [
  {
    id: 'plot_1',
    name: 'Plot A · Main Maize',
    crop: 'Sweet Corn (Zea mays)',
    moisture: 34.2,
    condition: 'optimal',
    isIrrigating: false,
    sensorInstalled: true,
    position: [-2.0, 0.2, -1.6],
  },
  {
    id: 'plot_2',
    name: 'Plot B · Vine Tomatoes',
    crop: 'Roma Tomatoes (Solanum lycopersicum)',
    moisture: 48.5,
    condition: 'optimal',
    isIrrigating: false,
    sensorInstalled: false,
    position: [2.0, 0.2, -1.6],
  },
  {
    id: 'plot_3',
    name: 'Plot C · Bell Peppers',
    crop: 'Bell Peppers (Capsicum annuum)',
    moisture: 26.8,
    condition: 'dry',
    isIrrigating: false,
    sensorInstalled: false,
    position: [-2.0, 0.2, 1.6],
  },
  {
    id: 'plot_4',
    name: 'Plot D · Seedling Nursery',
    crop: 'Lettuce & Herbs',
    moisture: 62.0,
    condition: 'optimal',
    isIrrigating: false,
    sensorInstalled: false,
    position: [2.0, 0.2, 1.6],
  },
];

export const FarmCanvas: React.FC<FarmCanvasProps> = ({
  pumpActive,
  onTogglePump,
  liveMoisture,
  liveTemp,
  liveHumidity,
}) => {
  const [mode, setMode] = useState<'3d' | '2d'>('3d');
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot | null>(DEFAULT_PLOTS[0]);
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(0, 11, 14);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const setViewTopDown = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 16, 0.1);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const setViewCloseUp = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(-1.0, 3.5, 1.0);
      controlsRef.current.target.set(-1.2, 0.5, -1.2);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-[580px] sm:h-[640px] rounded-2xl bg-[#070c09] border border-white/[0.08] overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: View Mode Toggle (3D vs 2D Fallback) */}
        <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/[0.1] backdrop-blur-md pointer-events-auto">
          <button
            onClick={() => setMode('3d')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5',
              mode === '3d'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Digital Twin</span>
          </button>

          <button
            onClick={() => setMode('2d')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5',
              mode === '2d'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2D Schematic</span>
          </button>
        </div>

        {/* Right: Camera Presets & Reset (Visible in 3D Mode) */}
        {mode === '3d' && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-black/60 border border-white/[0.1] backdrop-blur-md gap-1">
              <button
                onClick={resetCamera}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-300 hover:bg-white/[0.08] transition-colors"
                title="Isometric View"
              >
                Isometric
              </button>
              <button
                onClick={setViewTopDown}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-300 hover:bg-white/[0.08] transition-colors"
                title="Top-Down View"
              >
                Top-Down
              </button>
              <button
                onClick={setViewCloseUp}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-300 hover:bg-white/[0.08] transition-colors"
                title="Sensor Probe Focus"
              >
                Node Focus
              </button>
            </div>

            <button
              onClick={resetCamera}
              className="p-2 rounded-xl bg-black/60 hover:bg-white/[0.08] border border-white/[0.1] backdrop-blur-md text-zinc-300 hover:text-white transition-colors"
              title="Reset Camera Position"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Render Area */}
      {mode === '3d' ? (
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <PerspectiveCamera makeDefault position={[0, 11, 14]} fov={40} />
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            minDistance={4}
            maxDistance={22}
            maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera going underneath the ground
          />

          <Suspense fallback={null}>
            <FarmScene
              plots={DEFAULT_PLOTS}
              selectedPlotId={selectedPlot?.id ?? null}
              onSelectPlot={(plot) => setSelectedPlot(plot)}
              pumpActive={pumpActive}
              liveMoisture={liveMoisture}
              liveTemp={liveTemp}
              liveHumidity={liveHumidity}
            />
          </Suspense>
        </Canvas>
      ) : (
        <div className="w-full h-full p-4">
          <FarmFallback2D
            plots={DEFAULT_PLOTS}
            selectedPlotId={selectedPlot?.id ?? null}
            onSelectPlot={(plot) => setSelectedPlot(plot)}
            pumpActive={pumpActive}
            liveMoisture={liveMoisture}
          />
        </div>
      )}

      {/* Bottom Floating Plot / Sensor Information Card */}
      {selectedPlot && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20 p-4 rounded-2xl bg-[#0c140f]/90 border border-white/[0.1] backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                {selectedPlot.name}
              </h4>
            </div>
            <button
              onClick={() => setSelectedPlot(null)}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-zinc-400">
              <span className="text-zinc-500">Vegetative Crop:</span>
              <span className="text-zinc-200">{selectedPlot.crop}</span>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500">Current Moisture:</span>
              <span className={cn(
                'text-base font-extrabold',
                (selectedPlot.id === 'plot_1' ? liveMoisture : selectedPlot.moisture) < 30
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              )}>
                {(selectedPlot.id === 'plot_1' ? liveMoisture : selectedPlot.moisture).toFixed(1)}%
              </span>
            </div>

            {selectedPlot.sensorInstalled && (
              <div className="flex justify-between text-zinc-400 pt-1 border-t border-white/[0.04]">
                <span className="text-zinc-500">Telemetry Node:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3" /> ESP8266 Live Node
                </span>
              </div>
            )}

            <div className="flex justify-between text-zinc-400">
              <span className="text-zinc-500">Irrigation State:</span>
              <span className={pumpActive ? 'text-sky-400 font-semibold' : 'text-zinc-400'}>
                {pumpActive ? 'Sprinklers Active' : 'Standby'}
              </span>
            </div>
          </div>

          {onTogglePump && (
            <button
              onClick={onTogglePump}
              className={cn(
                'w-full mt-3 py-2 px-3 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all',
                pumpActive
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-glow'
              )}
            >
              <Droplet className="w-3.5 h-3.5" />
              <span>{pumpActive ? 'Halt Pump Actuator' : 'Trigger Quick Irrigation Test'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
