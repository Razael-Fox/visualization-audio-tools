import { createTheme } from "@mantine/core";

const theme = createTheme({
  breakpoints: {
    xs: "36em",
    sm: "48em",
    md: "62em",
    lg: "75em",
    xl: "88em",
  },
  colors: {
    brand: ["#eeecff","#d9d5fe","#afa8f4","#8379ec","#5d50e4","#493ae1","#3929e0","#2b1dc7","#2419b3","#1a149e"],
    visualizer: ["#fbeaff","#eed3fe","#d7a4f7","#c073f1","#ae4bec","#a12ee9","#9b1fe8","#8712cf","#780dba","#6803a3"],
    stt: ["#e3fefa","#d4f6f2","#aeebe3","#85dfd3","#63d5c5","#4ccebd","#34c5b2","#2ab4a2","#19a090","#008b7c"],
    metadata: ["#fff1e2","#ffe3cd","#fec59c","#fc9e5b","#fb8a3b","#fa791e","#fb700e","#df5f01","#c85300","#ae4500"],
  },
  primaryColor: "brand",
  fontFamily: "var(--font-outfit), sans-serif",
  headings: {
    fontFamily: "var(--font-outfit), sans-serif",
  },
});

export default theme;
