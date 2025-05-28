import { StyleSheet } from "react-native";

export const elementStyleSheet = StyleSheet.create({
  defaultShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rounded: {
    backgroundColor: "#3b82f6",
    borderRadius: 25,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  "text-primary": {
    backgroundColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  "text-white": {
    backgroundColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  "ghost-02": {
    backgroundColor: "transparent",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  "ghost-white": {
    backgroundColor: "transparent",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  social: {
    backgroundColor: "#1f2937",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    backgroundColor: "#3b82f6",
    borderRadius: 25,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  "circle-add": {
    backgroundColor: "#3b82f6",
    borderRadius: 50,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  "circle-attachment": {
    backgroundColor: "#3b82f6",
    borderRadius: 50,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  "small-close": {
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6b7280",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  text: {
    fontSize: 16,
  },
  "text-size-unset": {
    fontSize: 10,
  },
  "text-size-small": {
    fontSize: 14,
  },
  "text-size-medium": {
    fontSize: 16,
  },
  "text-size-large": {
    fontSize: 18,
  },
  "size-unset": {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  "size-small": {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  "size-medium": {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  "size-large": {
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
});

export const buttonTextStyles = (variant: string, size: string) => {
  const baseTextStyle = {
    ...elementStyleSheet.text,
    ...elementStyleSheet[`text-size-${size}` as keyof typeof elementStyleSheet],
  };

  // Handle text color based on variant
  if (variant === "text-primary") {
    return { ...baseTextStyle, color: "#3b82f6" };
  }
  if (variant === "text-white") {
    return { ...baseTextStyle, color: "#ffffff" };
  }
  if (variant === "ghost-02") {
    return { ...baseTextStyle, color: "#3b82f6" };
  }
  if (variant === "ghost-white") {
    return { ...baseTextStyle, color: "#ffffff" };
  }
  if (variant === "social") {
    return { ...baseTextStyle, color: "#ffffff" };
  }
  if (variant === "icon") {
    return { ...baseTextStyle, color: "#ffffff" };
  }
  if (variant === "circle-add" || variant === "circle-attachment") {
    return { ...baseTextStyle, color: "#ffffff" };
  }
  if (variant === "small-close") {
    return { ...baseTextStyle, color: "#ffffff" };
  }

  return { ...baseTextStyle, color: "#ffffff" };
};

export const buttonStyles = (variant: string, size: string) => {
  const sizeStyle =
    elementStyleSheet[`size-${size}` as keyof typeof elementStyleSheet];

  if (elementStyleSheet?.[variant as keyof typeof elementStyleSheet]) {
    const variantStyle =
      elementStyleSheet[variant as keyof typeof elementStyleSheet];

    // Exclude text styles from variant style
    const { fontSize, fontWeight, ...viewStyle } = variantStyle as any;

    const shadowStyle = [
      "rounded",
      "icon",
      "circle-add",
      "circle-attachment",
      "small-close",
    ].includes(variant)
      ? elementStyleSheet.defaultShadow
      : {};

    return {
      ...viewStyle,
      ...sizeStyle,
      ...shadowStyle,
    };
  }

  const { fontSize, fontWeight, ...roundedViewStyle } =
    elementStyleSheet.rounded as any;
  return {
    ...roundedViewStyle,
    ...sizeStyle,
  };
};
