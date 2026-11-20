'use client';

import { useFedTelemetry } from '@/lib/telemetryContext';

export function useTelemetry(deviceId = 'AGRO_001') {
  const fed = useFedTelemetry();

  return {
    summary: fed.summary,
    farmProfile: fed.farmProfile,
    history: fed.history,
    prediction: fed.prediction,
    events: fed.events,
    loading: fed.loading,
    error: null,
    isRealtime: true,
    refresh: () => {},
    controlPump: async (turnOn: boolean, durationSec?: number) => {
      await fed.togglePump(turnOn);
      return {
        status: 'success',
        message: `Pump relay command confirmed (${turnOn ? 'ON' : 'OFF'})`,
        requested_state: turnOn,
        confirmed_state: turnOn,
      };
    },
    feedData: fed.feedData,
    updateFarmProfile: fed.updateFarmProfile,
    setScenario: fed.setScenario,
    togglePump: fed.togglePump,
    updateThresholds: fed.updateThresholds,
    setOperatingMode: fed.setOperatingMode,
    clearHistory: fed.clearHistory,
  };
}
