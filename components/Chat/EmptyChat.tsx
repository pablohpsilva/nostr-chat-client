import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { TypographyBodyL } from "@/components/ui/Typography";

export interface EmptyChatProps {
  onBackClick?: () => void;
  isLoading?: boolean;
  loadPreviousMessages?: () => void;
}

const EmptyChat = ({ isLoading, loadPreviousMessages }: EmptyChatProps) => {
  return (
    <View style={styles.container}>
      <View>
        <Button
          disabled={isLoading}
          variant="text-primary"
          onPress={loadPreviousMessages}
        >
          {isLoading
            ? "Fetching and decrypting messages..."
            : "Load 10 previous days of messages"}
        </Button>
      </View>

      <View style={styles.messageContainer}>
        <TypographyBodyL>No messages shared so far.</TypographyBodyL>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EmptyChat;
