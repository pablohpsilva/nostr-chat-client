import { Link, LinkProps } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";

export type LinkButtonProps = LinkProps & {
  children: React.ReactNode;
  variant?: "default" | "outlined";
  size?: "small" | "medium" | "large";
};

export function LinkButton({
  children,
  variant = "default",
  size = "medium",
  ...props
}: LinkButtonProps) {
  const style = useMemo(() => {
    if (styles?.[variant]) {
      return { ...styles[variant], ...styles.sizes[size] };
    }

    return { ...styles.default, ...styles.sizes[size] };
  }, [variant, size]);
  const textStyle = useMemo(() => {
    return {
      ...styles.text,
      ...styles.textSizes[size],
      ...{ color: style.color },
    };
  }, [size, style.color]);

  return (
    <Link style={style} {...props}>
      <Text style={textStyle}>{children}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  default: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#3b82f6",
    alignItems: "center",
    color: "white",
  },
  outlined: {
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#3b82f6",
    color: "#3b82f6",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
  textSizes: {
    small: {
      fontSize: 12,
    },
    medium: {
      fontSize: 16,
    },
    large: {
      fontSize: 18,
    },
  },
  sizes: {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
  },
});
