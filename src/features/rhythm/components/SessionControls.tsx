import { Box, Button, Typography } from "@mui/material";
import type { SessionPhase } from "@/features/rhythm/types/rhythm.types";

interface SessionControlsProps {
  sessionPhase: SessionPhase;
  bpm: number;
  isFallback: boolean;
  visible: boolean;
  startError: string | null;
  onStart: () => void;
  onStop: () => void;
}

export function SessionControls({
  sessionPhase,
  bpm,
  isFallback,
  visible,
  startError,
  onStart,
  onStop,
}: SessionControlsProps) {
  const running = sessionPhase === "running";

  return (
    <Box
      sx={{
        textAlign: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <Typography variant="h4" component="p" gutterBottom>
        {Math.round(bpm)} BPM
      </Typography>
      {isFallback && (
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Holding last cadence
        </Typography>
      )}
      {startError && (
        <Typography variant="body2" color="error" display="block" gutterBottom>
          {startError}
        </Typography>
      )}
      <Button
        type="button"
        variant="contained"
        size="large"
        onClick={() => {
          if (running) {
            onStop();
          } else {
            void onStart();
          }
        }}
        sx={{ minWidth: themeMinTouch }}
      >
        {running ? "Stop" : "Start"}
      </Button>
    </Box>
  );
}

const themeMinTouch = 120;
