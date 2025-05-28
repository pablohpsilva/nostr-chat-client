import { useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { Colors } from "@/constants/Colors";
import { View } from "react-native";
import { TypographyOverline } from "../Typography";

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({
  label,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.wrapper}>
      <TypographyOverline style={styles.label}>{label}</TypographyOverline>
      <TextInput
        style={[
          styles.input,
          { borderColor: isFocused ? Colors.dark.lime : Colors.dark.purple },
        ]}
        placeholderTextColor={Colors.dark.white}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 8,
  },
  label: {
    textTransform: "uppercase",
    opacity: 0.6,
  },
  input: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderStyle: "solid",
    backgroundColor: "transparent",
    color: Colors.dark.white,
    outline: "none",
    outlineColor: "transparent",
  },
});
