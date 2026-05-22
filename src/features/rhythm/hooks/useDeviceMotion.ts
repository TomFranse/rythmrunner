import { useCallback, useEffect, useRef, useState } from "react";
import {
  intervalMsForBpm,
  magnitudeForSimulatorPeak,
  magnitudeForSimulatorValley,
  DEFAULT_SIMULATOR_BPM,
} from "@/features/rhythm/services/motionSimulatorService";
import { TARGET_SAMPLE_RATE_HZ } from "@/features/rhythm/services/stepDetectionService";
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
  const simulatorStridePhase = useRef(0);
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
      const strideMs = intervalMsForBpm(simulatorBpm);
      const sampleMs = 1000 / TARGET_SAMPLE_RATE_HZ;
      simulatorNextAt.current = performance.now();
      simulatorStridePhase.current = 0;

      const timer = window.setInterval(() => {
        const now = performance.now();
        if (now < simulatorNextAt.current) {
          return;
        }
        simulatorNextAt.current = now + sampleMs;

        const phase = simulatorStridePhase.current;
        simulatorStridePhase.current += sampleMs;
        if (simulatorStridePhase.current >= strideMs) {
          simulatorStridePhase.current = 0;
        }

        const peakCenter = strideMs * 0.5;
        const y =
          Math.abs(phase - peakCenter) < sampleMs * 2
            ? magnitudeForSimulatorPeak()
            : magnitudeForSimulatorValley();

        setLatestSample({
          x: 0,
          y,
          z: 0,
          timestamp: now,
        });
      }, sampleMs);

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
