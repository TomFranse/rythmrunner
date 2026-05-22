import { Box, Button, Typography } from "@mui/material";
import type { MotionPermissionStatus } from "@/features/rhythm/types/rhythm.types";

interface MotionPermissionGateProps {
  status: MotionPermissionStatus;
  onRequestPermission: () => void;
}

export function MotionPermissionGate({ status, onRequestPermission }: MotionPermissionGateProps) {
  if (status === "granted") {
    return null;
  }

  if (status === "unsupported") {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Motion sensors are not available in this browser. Enable simulator mode below.
      </Typography>
    );
  }

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="body1" gutterBottom>
        Rhythm Runner needs motion access to match your running cadence.
      </Typography>
      <Button variant="contained" onClick={onRequestPermission}>
        Enable motion
      </Button>
    </Box>
  );
}
