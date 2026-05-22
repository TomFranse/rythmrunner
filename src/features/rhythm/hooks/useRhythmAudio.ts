import { useEffect, useState } from "react";
import {
  getAudioLayerState,
  getTransportBpm,
  setTransportBpm,
  subscribeAudioLayerState,
} from "@/features/rhythm/services/audioEngineService";
import type { AudioLayerState, SessionPhase } from "@/features/rhythm/types/rhythm.types";

export interface UseRhythmAudioOptions {
  sessionPhase: SessionPhase;
  bpm: number;
}

export interface UseRhythmAudioResult {
  layerState: AudioLayerState;
  transportBpm: number;
}

export function useRhythmAudio({ sessionPhase, bpm }: UseRhythmAudioOptions): UseRhythmAudioResult {
  const [layerState, setLayerState] = useState<AudioLayerState>(getAudioLayerState);
  const [transportBpm, setTransportBpmState] = useState(getTransportBpm);

  useEffect(() => {
    if (sessionPhase !== "running") {
      setLayerState(getAudioLayerState());
      setTransportBpmState(getTransportBpm());
      return undefined;
    }

    return subscribeAudioLayerState((state) => {
      setLayerState(state);
      setTransportBpmState(getTransportBpm());
    });
  }, [sessionPhase]);

  useEffect(() => {
    if (sessionPhase !== "running") {
      return;
    }
    setTransportBpm(bpm);
  }, [bpm, sessionPhase]);

  return { layerState, transportBpm };
}
