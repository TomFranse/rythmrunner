import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

export const MainLayout = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
      }}
    >
      <Outlet />
    </Box>
  );
};
