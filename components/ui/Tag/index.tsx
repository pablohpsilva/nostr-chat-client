import { StyleSheet, Text } from "react-native";

import { Colors } from "@/constants/Colors";

interface TagProps {
  tag: string;
  color: string;
  width?: number;
}

export default function Tag({ tag, color, width = 42 }: TagProps) {
  return (
    <Text
      style={[
        styles.nipTag,
        {
          borderColor: color,
          backgroundColor: color,
          width,
        },
      ]}
    >
      {tag}
    </Text>
  );
}

const styles = StyleSheet.create({
  nipTag: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 10,
    color: Colors.dark.white,
    width: 42,
    fontWeight: "700",
    textAlign: "center",
  },
});
