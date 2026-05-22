import { useCallback, useEffect, useState } from "react";
import { useDeviceMotion } from "@/features/rhythm/hooks/useDeviceMotion";
import { useRhythmAudio } from "@/features/rhythm/hooks/useRhythmAudio";
import { useStepDetection } from "@/features/rhythm/hooks/useStepDetection";
import {
  isMotionSupported,
  needsExplicitPermission,
  requestMotionPermission,
} from "@/features/rhythm/services/motionPermissionService";
import {
  startAudioContext,
  startRhythmPlayback,
  stopRhythmPlayback,
} from "@/features/rhythm/services/audioEngineService";
import { COLD_START_BPM } from "@/features/rhythm/services/stepDetectionService";
import { DEFAULT_SIMULATOR_BPM } from "@/features/rhythm/services/motionSimulatorService";
import type { MotionPermissionStatus, SessionPhase } from "@/features/rhythm/types/rhythm.types";

const CONTROLS_HIDE_MS = 3000;

function canUseMotion(
  permissionStatus: MotionPermissionStatus,
  simulatorEnabled: boolean
): boolean {
  return (
    permissionStatus === "granted" ||
    permissionStatus === "unsupported" ||
    permissionStatus === "unknown" ||
    simulatorEnabled
  );
}

export function useRhythmSession() {
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>("idle");
  const [permissionStatus, setPermissionStatus] = useState<MotionPermissionStatus>(
    isMotionSupported() ? "unknown" : "unsupported"
  );
  const [simulatorEnabled, setSimulatorEnabled] = useState(import.meta.env.DEV);
  const [simulatorBpm, setSimulatorBpm] = useState(DEFAULT_SIMULATOR_BPM);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);

  const motionEnabled =
    sessionPhase === "running" && canUseMotion(permissionStatus, simulatorEnabled);

  const { latestSample, latestMagnitude } = useDeviceMotion({
    enabled: motionEnabled,
    simulatorEnabled: simulatorEnabled || permissionStatus === "unsupported",
    simulatorBpm,
  });

  const stepState = useStepDetection({
    enabled: motionEnabled,
    magnitude: latestMagnitude,
    timestamp: latestSample?.timestamp ?? null,
  });

  const { layerState, transportBpm } = useRhythmAudio({
    sessionPhase,
    bpm: stepState.bpm,
  });

  const revealControls = useCallback(() => {
    setControlsVisible(true);
  }, []);

  useEffect(() => {
    if (sessionPhase !== "running") {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [sessionPhase, controlsVisible, stepState.bpm]);

  const handleRequestPermission = useCallback(async () => {
    const status = await requestMotionPermission();
    setPermissionStatus(status);
  }, []);

  const handleStart = useCallback(async () => {
    setStartError(null);
    try {
      await startAudioContext();

      if (needsExplicitPermission() && permissionStatus !== "granted") {
        const status = await requestMotionPermission();
        setPermissionStatus(status);
        if (status !== "granted" && !simulatorEnabled) {
          setStartError("Motion permission is required, or enable the dev simulator.");
          return;
        }
      }

      startRhythmPlayback(COLD_START_BPM);
      setSessionPhase("running");
      setControlsVisible(true);
    } catch (error) {
      stopRhythmPlayback();
      setSessionPhase("idle");
      setStartError(
        error instanceof Error
          ? error.message
          : "Could not start audio. Check browser sound settings."
      );
    }
  }, [permissionStatus, simulatorEnabled]);

  const handleStop = useCallback(() => {
    stopRhythmPlayback();
    setSessionPhase("idle");
    setControlsVisible(true);
    setStartError(null);
  }, []);

  return {
    sessionPhase,
    permissionStatus,
    simulatorEnabled,
    simulatorBpm,
    controlsVisible,
    stepState,
    layerState,
    transportBpm,
    startError,
    setSimulatorEnabled,
    setSimulatorBpm,
    revealControls,
    handleRequestPermission,
    handleStart,
    handleStop,
  };
}
