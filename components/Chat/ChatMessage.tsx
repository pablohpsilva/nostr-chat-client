import dayjs from "dayjs";
import { StyleSheet, View } from "react-native";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { TypographyCaptionXS } from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";

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
        styles.defaultShadow,
        isFromMe ? styles.myMessage : styles.otherMessage,
      ]}
    >
      <MarkdownRenderer text={content} />
      <TypographyCaptionXS
        style={[styles.timestamp, isFromMe && styles.myTimestamp]}
      >
        {dayjs(new Date(timestamp * 1000)).format("YYYY-MM-DD HH:mm")}
      </TypographyCaptionXS>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    maxWidth: 240,
    marginVertical: 4,
  },
  defaultShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  timestamp: {
    marginTop: 4,
    opacity: 0.5,
  },
  myTimestamp: {
    textAlign: "right",
  },
});

export default ChatMessage;
