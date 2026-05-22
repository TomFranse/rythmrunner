import { Box, Slider, Switch, Typography, FormControlLabel } from "@mui/material";

interface MotionSimulatorPanelProps {
  enabled: boolean;
  bpm: number;
  onEnabledChange: (enabled: boolean) => void;
  onBpmChange: (bpm: number) => void;
}

export function MotionSimulatorPanel({
  enabled,
  bpm,
  onEnabledChange,
  onBpmChange,
}: MotionSimulatorPanelProps) {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 3,
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Dev: motion simulator
      </Typography>
      <FormControlLabel
        control={
          <Switch checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
        }
        label="Simulate run cadence"
      />
      <Typography variant="caption" color="text.secondary">
        Target BPM: {bpm}
      </Typography>
      <Slider
        min={80}
        max={200}
        step={1}
        value={bpm}
        onChange={(_, value) => onBpmChange(value as number)}
        disabled={!enabled}
      />
    </Box>
  );
}
