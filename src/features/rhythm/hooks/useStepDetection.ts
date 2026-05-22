import { useEffect, useRef, useState } from "react";
import {
  createStepDetector,
  processMotionSample,
} from "@/features/rhythm/services/stepDetectionService";
import type { StepDetectionState } from "@/features/rhythm/types/rhythm.types";

export interface UseStepDetectionOptions {
  enabled: boolean;
  magnitude: number | null;
  timestamp: number | null;
}

const INITIAL_STATE: StepDetectionState = {
  bpm: 60,
  lastStepAt: null,
  isFallback: false,
  sampleRate: 0,
};

export function useStepDetection({
  enabled,
  magnitude,
  timestamp,
}: UseStepDetectionOptions): StepDetectionState {
  const detectorRef = useRef<ReturnType<typeof createStepDetector> | null>(null);
  const [state, setState] = useState<StepDetectionState>(INITIAL_STATE);

  useEffect(() => {
    if (!enabled) {
      detectorRef.current = null;
      setState(INITIAL_STATE);
      return;
    }
    if (detectorRef.current === null) {
      detectorRef.current = createStepDetector();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || magnitude === null || timestamp === null) {
      return;
    }
    const detector = detectorRef.current;
    if (!detector) {
      return;
    }
    const result = processMotionSample(detector, magnitude, timestamp);
    setState({
      bpm: result.bpm,
      lastStepAt: detector.lastPeakAt,
      isFallback: result.isFallback,
      sampleRate: 25,
    });
  }, [enabled, magnitude, timestamp]);

  return state;
}
