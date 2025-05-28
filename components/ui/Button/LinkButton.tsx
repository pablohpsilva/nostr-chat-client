import { Link, LinkProps } from "expo-router";
import { useMemo } from "react";
import { Text } from "react-native";

import { buttonStyles, buttonTextStyles } from "./styles";

export type LinkButtonProps = LinkProps & {
  children: React.ReactNode;
  variant?:
    | "rounded"
    | "text-primary"
    | "text-white"
    | "ghost-02"
    | "ghost-white"
    | "social"
    | "icon"
    | "circle-add"
    | "circle-attachment"
    | "small-close";
  size?: "small" | "medium" | "large";
};

export function LinkButton({
  children,
  variant = "rounded",
  size = "medium",
  ...props
}: LinkButtonProps) {
  const style = useMemo(() => buttonStyles(variant, size), [variant, size]);

  const textStyle = useMemo(() => {
    return buttonTextStyles(variant, size);
  }, [size, variant]);

  return (
    <Link style={style} {...props}>
      <Text style={textStyle}>{children}</Text>
    </Link>
  );
}
