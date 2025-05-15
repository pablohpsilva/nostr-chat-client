import { StyleSheet, Text, View } from "react-native";

export interface EmptyChatProps {
  onBackClick?: () => void;
}

const EmptyChat = () => {
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>No messages shared so far.</Text>
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
  messageText: {
    color: "#6b7280", // text-gray-500 equivalent
  },
});

export default EmptyChat;
