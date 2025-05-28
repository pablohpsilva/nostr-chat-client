import { Theme } from "@react-navigation/native";
import { Colors } from "./Colors";

export const DefaultTheme: Theme = {
  dark: false,
  colors: {
    primary: Colors.light.primary,
    background: Colors.light.backgroundPrimary,
    card: Colors.light.white,
    text: Colors.light.white,
    border: Colors.light.white,
    notification: "rgb(255, 59, 48)",
  },
  fonts: {
    regular: {
      fontFamily: "Inter-Regular",
      fontWeight: "normal",
    },
    medium: {
      fontFamily: "Inter-Medium",
      fontWeight: "normal",
    },
    bold: {
      fontFamily: "Inter-Bold",
      fontWeight: "600",
    },
    heavy: {
      fontFamily: "Inter-Bold",
      fontWeight: "700",
    },
  },
};

export const DarkTheme: Theme = {
  dark: true,
  colors: {
    primary: Colors.dark.primary,
    background: Colors.dark.backgroundPrimary,
    card: Colors.dark.white,
    text: Colors.dark.white,
    border: Colors.dark.white,
    notification: "rgb(255, 59, 48)",
  },
  fonts: {
    regular: {
      fontFamily: "Inter-Regular",
      fontWeight: "normal",
    },
    medium: {
      fontFamily: "Inter-Medium",
      fontWeight: "normal",
    },
    bold: {
      fontFamily: "Inter-Bold",
      fontWeight: "600",
    },
    heavy: {
      fontFamily: "Inter-Bold",
      fontWeight: "700",
    },
  },
};
