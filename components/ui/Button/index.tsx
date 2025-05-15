import { useMemo } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";

export type ButtonProps = TouchableOpacityProps & {
  children: React.ReactNode;
  variant?: "default" | "outlined";
};

export function Button({
  children,
  variant = "default",
  ...props
}: ButtonProps) {
  const style = useMemo(() => {
    console.log("styles?.[variant]", styles?.[variant]);
    if (styles?.[variant]) {
      return styles[variant];
    }

    return styles.default;
  }, [variant]);

  return (
    <TouchableOpacity style={style} {...props}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  default: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  outlined: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b82f6",
    alignItems: "center",
  },
});
