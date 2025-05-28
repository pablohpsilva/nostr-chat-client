import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";

// Poppins font variants
export type PoppinsVariant =
  | "h0"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "title";

// Inter font variants
export type InterVariant =
  | "title-m"
  | "title-s"
  | "button-l"
  | "button-s"
  | "tab"
  | "body-l"
  | "body-s"
  | "body-s-bold"
  | "body-s-regular"
  | "caption-l"
  | "caption-s"
  | "overline";

export type TypographyVariant = PoppinsVariant | InterVariant;

export interface TypographyProps extends TextProps {
  variant: TypographyVariant;
  lightColor?: string;
  darkColor?: string;
  colorName?: keyof typeof Colors.light & keyof typeof Colors.dark;
}

export function Typography({
  variant,
  style,
  lightColor,
  darkColor,
  colorName = "white",
  ...rest
}: TypographyProps) {
  const color = useThemeColor(
    { light: lightColor, dark: darkColor },
    colorName
  );

  return <Text style={[{ color }, styles[variant], style]} {...rest} />;
  // return <Text style={[styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  // Poppins variants
  h0: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 60,
    lineHeight: 64,
    letterSpacing: 0,
  },
  h1: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: 0,
  },
  h2: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 0,
  },
  h3: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: 0,
  },
  h4: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
  },
  h5: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
  h6: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0,
  },
  title: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },

  // Inter variants
  "title-m": {
    fontFamily: "Inter-SemiBold",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  "title-s": {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  "button-l": {
    fontFamily: "Inter-Bold",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  "button-s": {
    fontFamily: "Inter-Bold",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
  },
  tab: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
  },
  "body-l": {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  "body-s": {
    fontFamily: "Inter-Medium",
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0,
  },
  "body-s-bold": {
    fontFamily: "Inter-Bold",
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0,
  },
  "body-s-regular": {
    fontFamily: "Inter-Regular",
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0,
  },
  "caption-l": {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0,
  },
  "caption-s": {
    fontFamily: "Inter-Medium",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0,
  },
  overline: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
});

// Convenience components for common use cases
export const H0 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h0" {...props} />
);

export const H1 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h1" {...props} />
);

export const H2 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h2" {...props} />
);

export const H3 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h3" {...props} />
);

export const H4 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h4" {...props} />
);

export const H5 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h5" {...props} />
);

export const H6 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h6" {...props} />
);

export const TypographyTitle = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="title" {...props} />
);

export const TypographyTitleM = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="title-m" {...props} />
);

export const TypographyTitleS = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="title-s" {...props} />
);

export const TypographyButtonL = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="button-l" {...props} />
);

export const TypographyButtonS = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="button-s" {...props} />
);

export const TypographyTab = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="tab" {...props} />
);

export const TypographyBodyL = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="body-l" {...props} />
);

export const TypographyBodyS = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="body-s" {...props} />
);

export const TypographyBodySBold = (
  props: Omit<TypographyProps, "variant">
) => <Typography variant="body-s-bold" {...props} />;

export const TypographyBodySRegular = (
  props: Omit<TypographyProps, "variant">
) => <Typography variant="body-s-regular" {...props} />;

export const TypographyCaptionL = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="caption-l" {...props} />
);

export const TypographyCaptionS = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="caption-s" {...props} />
);

export const TypographyOverline = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="overline" {...props} />
);
