import { useEffect } from "react";
import { getAudioLayerState, setTransportBpm } from "@/features/rhythm/services/audioEngineService";
import type { AudioLayerState, SessionPhase } from "@/features/rhythm/types/rhythm.types";

export interface UseRhythmAudioOptions {
  sessionPhase: SessionPhase;
  bpm: number;
}

export function useRhythmAudio({ sessionPhase, bpm }: UseRhythmAudioOptions): AudioLayerState {
  useEffect(() => {
    if (sessionPhase !== "running") {
      return;
    }
    setTransportBpm(bpm);
  }, [bpm, sessionPhase]);

  return getAudioLayerState();
}
