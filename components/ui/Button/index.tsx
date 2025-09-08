import { useMemo } from "react";
import { TouchableOpacity, type TouchableOpacityProps } from "react-native";

import { TypographyButtonS } from "../Typography";
import { buttonStyles, buttonTextStyles } from "./styles";

export type ButtonProps = TouchableOpacityProps & {
  children: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
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
  size?: "unset" | "small" | "medium" | "large";
};

export function Button({
  children,
  variant = "rounded",
  size = "medium",
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const style = useMemo(
    () => buttonStyles(variant, size, Boolean(leftIcon || rightIcon)),
    [variant, size]
  );

  const textStyle = useMemo(() => {
    return buttonTextStyles(variant, size);
  }, [size, variant]);

  return (
    <TouchableOpacity style={style} {...props}>
      {leftIcon}
      {typeof children === "string" ? (
        <TypographyButtonS style={textStyle} selectable={false}>
          {children}
        </TypographyButtonS>
      ) : (
        children
      )}
      {rightIcon}
    </TouchableOpacity>
  );
}

export { LinkButton } from "./LinkButton";
