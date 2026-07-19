import { createTheme } from "@mantine/core";
import { generateColors } from "@mantine/colors-generator";

const theme = createTheme({
  breakpoints: {
    xs: "36em",
    sm: "48em",
    md: "62em",
    lg: "75em",
    xl: "88em",
  },
  colors: {
    brand: generateColors("#493ae1"),
    visualizer: generateColors("#ae4bec"),
    stt: generateColors("#34c5b2"),
    metadata: generateColors("#fc9e5b"),
  },
  primaryColor: "brand",
});

export default theme;
