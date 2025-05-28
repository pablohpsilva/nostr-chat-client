import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoadingMessages?: boolean;
}

const MessageInput = ({
  onSendMessage,
  isLoadingMessages,
}: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleOnClickLightning = () => {
    alert("Soon... :)");
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["bottom"]}>
        <View style={styles.inputContainer}>
          <Button
            variant="small-close"
            size="unset"
            onPress={handleOnClickLightning}
          >
            <Ionicons
              name="attach-outline"
              size={20}
              color={Colors.dark.white}
            />
          </Button>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={!isLoadingMessages ? handleSend : () => {}}
            returnKeyType="send"
            placeholderTextColor={Colors.dark.deactive}
          />

          <Button
            variant="small-close"
            size="unset"
            onPress={handleOnClickLightning}
          >
            <Ionicons
              name="flash-outline"
              size={20}
              color={Colors.dark.white}
            />
          </Button>

          <Button
            variant="small-close"
            size="unset"
            onPress={handleOnClickLightning}
          >
            <Ionicons name="mic-outline" size={20} color={Colors.dark.white} />
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundPrimary,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    color: Colors.dark.white,
    borderColor: Colors.dark.backgroundPrimary,
    outline: "none",
    outlineWidth: 0,
  },
  sendButtonText: {
    color: Colors.dark.white,
    fontWeight: "500",
  },
});

export default MessageInput;
