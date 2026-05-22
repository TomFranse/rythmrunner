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
  const baseDuration = (60 / Math.max(bpm, 60)).toFixed(2);
  const pulseDuration = reducedMotion ? "0s" : `${baseDuration}s`;
  const peakScale = layers.isPeak ? 1.14 : 1.08;

  return (
    <Box sx={pulsingCirclesViewportSx}>
      {LAYER_ORDER.map((layerId, index) => {
        const layer = layers.beatGridLayers[layerId];
        const size = theme.spacing(12 + index * 6);
        const colorKey = LAYER_COLORS[index % LAYER_COLORS.length];
        const opacity = layer.active ? 0.2 + layer.gain * 0.5 : 0.08;

        return (
          <Box
            key={layerId}
            sx={{
              position: "absolute",
              inset: 0,
              m: "auto",
              width: size,
              height: size,
              borderRadius: "50%",
              bgcolor: colorKey,
              opacity,
              animation:
                reducedMotion || !layer.active
                  ? "none"
                  : `rhythmPulse ${pulseDuration} ease-in-out infinite`,
              "@keyframes rhythmPulse": {
                "0%, 100%": { transform: "scale(0.92)" },
                "50%": { transform: `scale(${peakScale})` },
              },
            }}
          />
        );
      })}
    </Box>
  );
}
