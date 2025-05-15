import { StyleSheet, Text, View } from "react-native";

interface ChatMessageProps {
  isFromMe: boolean;
  content: string;
  timestamp: number;
}

const ChatMessage = ({ isFromMe, content, timestamp }: ChatMessageProps) => {
  return (
    <View
      style={[
        styles.container,
        isFromMe ? styles.myMessage : styles.otherMessage,
      ]}
    >
      <Text style={isFromMe ? styles.myText : styles.otherText}>{content}</Text>
      <Text style={styles.timestamp}>
        {new Date(timestamp * 1000).toLocaleTimeString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    maxWidth: 240,
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#3b82f6", // blue-500
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb", // gray-200
  },
  myText: {
    color: "#ffffff",
  },
  otherText: {
    color: "#000000",
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
});

export default ChatMessage;
