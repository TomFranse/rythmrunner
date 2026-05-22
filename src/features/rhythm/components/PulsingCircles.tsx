import { Box, useTheme } from "@mui/material";
import type { AudioLayerState } from "@/features/rhythm/types/rhythm.types";

interface PulsingCirclesProps {
  layers: AudioLayerState;
  bpm: number;
  reducedMotion: boolean;
}

const LAYER_COLORS = ["primary.main", "secondary.main", "info.main"];

export function PulsingCircles({ layers, bpm, reducedMotion }: PulsingCirclesProps) {
  const theme = useTheme();
  const pulseDuration = reducedMotion ? "0s" : `${(60 / Math.max(bpm, 60)).toFixed(2)}s`;
  const voiceCount = Math.max(1, layers.pianoVoices);

  return (
    <Box
      sx={{
        position: "relative",
        width: "min(80vw, 360px)",
        height: "min(80vw, 360px)",
        mx: "auto",
      }}
    >
      {Array.from({ length: voiceCount }, (_, index) => {
        const size = theme.spacing(12 + index * 6);
        const colorKey = LAYER_COLORS[index % LAYER_COLORS.length];
        return (
          <Box
            key={colorKey}
            sx={{
              position: "absolute",
              inset: 0,
              m: "auto",
              width: size,
              height: size,
              borderRadius: "50%",
              bgcolor: colorKey,
              opacity: 0.25 + index * 0.12,
              animation: reducedMotion
                ? "none"
                : `rhythmPulse ${pulseDuration} ease-in-out infinite`,
              "@keyframes rhythmPulse": {
                "0%, 100%": { transform: "scale(0.92)" },
                "50%": { transform: "scale(1.08)" },
              },
            }}
          />
        );
      })}
    </Box>
  );
}
