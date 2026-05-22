import { Box, useTheme } from "@mui/material";
import type { AudioLayerState, BeatGridLayerId } from "@/features/rhythm/types/rhythm.types";
import { pulsingCirclesViewportSx } from "@shared/utils/viewportLayout";

interface PulsingCirclesProps {
  layers: AudioLayerState;
  bpm: number;
  reducedMotion: boolean;
}

const LAYER_ORDER: BeatGridLayerId[] = ["L64", "L32", "L16", "L8"];
const LAYER_COLORS = ["primary.main", "secondary.main", "info.main", "warning.main"];

export function PulsingCircles({ layers, bpm, reducedMotion }: PulsingCirclesProps) {
  const theme = useTheme();
  const beatDuration = (60 / Math.max(bpm, 1)).toFixed(3);
  const peakScale = layers.isPeak ? 1.14 : 1.08;

  return (
    <Box sx={pulsingCirclesViewportSx}>
      {LAYER_ORDER.map((layerId, index) => {
        const layer = layers.beatGridLayers[layerId];
        const size = theme.spacing(12 + index * 6);
        const colorKey = LAYER_COLORS[index % LAYER_COLORS.length];
        const opacity = layer.active ? 0.2 + layer.gain * 0.5 : 0.08;
        const shouldPulse = !reducedMotion && layer.active;

        return (
          <Box
            key={`${layerId}-${layers.beatTick}`}
            sx={{
              position: "absolute",
              inset: 0,
              m: "auto",
              width: size,
              height: size,
              borderRadius: "50%",
              bgcolor: colorKey,
              opacity,
              animation: shouldPulse ? `rhythmPulse ${beatDuration}s ease-out 1` : "none",
              "@keyframes rhythmPulse": {
                "0%": { transform: "scale(0.92)" },
                "45%": { transform: `scale(${peakScale})` },
                "100%": { transform: "scale(0.92)" },
              },
            }}
          />
        );
      })}
    </Box>
  );
}
