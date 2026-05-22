import { useCallback, useEffect, useRef, useState } from "react";
import {
  intervalMsForBpm,
  magnitudeForSimulatorPeak,
  DEFAULT_SIMULATOR_BPM,
} from "@/features/rhythm/services/motionSimulatorService";
import {
  createGravityEstimator,
  sampleFromDeviceMotion,
} from "@/features/rhythm/services/motionSamplingService";
import { computeMagnitude } from "@/features/rhythm/services/stepDetectionService";
import type { MotionSample } from "@/features/rhythm/types/rhythm.types";
import { isMotionSupported } from "@/features/rhythm/services/motionPermissionService";

export interface UseDeviceMotionOptions {
  enabled: boolean;
  simulatorEnabled: boolean;
  simulatorBpm?: number;
}

export function useDeviceMotion({
  enabled,
  simulatorEnabled,
  simulatorBpm = DEFAULT_SIMULATOR_BPM,
}: UseDeviceMotionOptions) {
  const [latestSample, setLatestSample] = useState<MotionSample | null>(null);
  const simulatorNextAt = useRef(0);
  const gravityEstimatorRef = useRef(createGravityEstimator());

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const sample = sampleFromDeviceMotion(event, gravityEstimatorRef.current);
    if (sample === null) {
      return;
    }
    setLatestSample(sample);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    gravityEstimatorRef.current = createGravityEstimator();

    if (simulatorEnabled || !isMotionSupported()) {
      const intervalMs = intervalMsForBpm(simulatorBpm);
      simulatorNextAt.current = performance.now();

      const timer = window.setInterval(() => {
        const now = performance.now();
        if (now < simulatorNextAt.current) {
          return;
        }
        simulatorNextAt.current = now + intervalMs;
        setLatestSample({
          x: 0,
          y: magnitudeForSimulatorPeak(),
          z: 0,
          timestamp: now,
        });
      }, 50);

      return () => {
        window.clearInterval(timer);
      };
    }

    window.addEventListener("devicemotion", handleMotion);
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [enabled, handleMotion, simulatorBpm, simulatorEnabled]);

  const latestMagnitude =
    latestSample === null ? null : computeMagnitude(latestSample.x, latestSample.y, latestSample.z);

  return { latestSample, latestMagnitude };
}
