import { TypographyBodyL } from "@/components/ui/Typography";
import { StyleSheet, View } from "react-native";

export interface EmptyChatProps {
  onBackClick?: () => void;
}

const EmptyChat = () => {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <TypographyBodyL>No messages shared so far.</TypographyBodyL>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EmptyChat;
