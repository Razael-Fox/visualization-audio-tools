import {
  createTheme,
  defaultVariantColorsResolver,
  VariantColorsResolver,
} from "@mantine/core";

const variantColorResolver: VariantColorsResolver = (input) => {
  const defaultResolvedColors = defaultVariantColorsResolver(input);

  if (input.variant === "light") {
    return {
      ...defaultResolvedColors,
      background: `color-mix(in srgb, ${defaultResolvedColors.color} 20%, transparent)`,
      hover: `color-mix(in srgb, ${defaultResolvedColors.color} 30%, transparent)`,
    };
  }

  return defaultResolvedColors;
};

const theme = createTheme({
  variantColorResolver,
  breakpoints: {
    xs: "36em",
    sm: "48em",
    md: "62em",
    lg: "75em",
    xl: "88em",
  },
  colors: {
    brand: [
      "#eeecff",
      "#d9d5fe",
      "#afa8f4",
      "#8379ec",
      "#5d50e4",
      "#493ae1",
      "#3929e0",
      "#2b1dc7",
      "#2419b3",
      "#1a149e",
    ],
    visualizer: [
      "#fbeaff",
      "#eed3fe",
      "#d7a4f7",
      "#c073f1",
      "#ae4bec",
      "#a12ee9",
      "#9b1fe8",
      "#8712cf",
      "#780dba",
      "#6803a3",
    ],
    stt: [
      "#e3fefa",
      "#d4f6f2",
      "#aeebe3",
      "#85dfd3",
      "#63d5c5",
      "#4ccebd",
      "#34c5b2",
      "#2ab4a2",
      "#19a090",
      "#008b7c",
    ],
    metadata: [
      "#fff1e2",
      "#ffe3cd",
      "#fec59c",
      "#fc9e5b",
      "#fb8a3b",
      "#fa791e",
      "#fb700e",
      "#df5f01",
      "#c85300",
      "#ae4500",
    ],
  },
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 6 },
  autoContrast: true,
  fontFamily: "var(--font-plus-jakarta), sans-serif",
  fontFamilyMonospace: "var(--font-jetbrains-mono), monospace",
  headings: {
    fontFamily: "var(--font-outfit), sans-serif",
  },
});

export default theme;
