import { Box, Typography, Container } from "@mui/material";

export const HomePage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Rhythm Runner
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Generate beats from gyroscope data
        </Typography>
      </Box>
    </Container>
  );
};
