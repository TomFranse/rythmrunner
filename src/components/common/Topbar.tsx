import { Link, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";

/**
 * Topbar component that is always visible.
 */
export const Topbar = () => {
  const location = useLocation();

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Box
            component={Link}
            to="/"
            sx={{
              color: location.pathname === "/" ? "primary.main" : "inherit",
              textDecoration: "none",
              "&:hover": {
                textDecoration: "none",
              },
            }}
          >
            Rhythm Runner
          </Box>
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
