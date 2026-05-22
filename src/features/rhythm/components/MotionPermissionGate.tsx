import { Box, Button } from "@mui/material";
import type { MotionPermissionStatus } from "@/features/rhythm/types/rhythm.types";

interface MotionPermissionGateProps {
  status: MotionPermissionStatus;
  onRequestPermission: () => void;
}

export function MotionPermissionGate({ status, onRequestPermission }: MotionPermissionGateProps) {
  if (status === "granted" || status === "unsupported") {
    return null;
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
      <Button variant="contained" onClick={onRequestPermission}>
        Enable motion
      </Button>
    </Box>
  );
}
