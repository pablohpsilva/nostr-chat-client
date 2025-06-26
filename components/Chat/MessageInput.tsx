import { Ionicons } from "@expo/vector-icons";
import { Fragment, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/Colors";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disable?: boolean;
}

const MessageInput = ({ onSendMessage, disable }: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [maxTextInputLines, setMaxTextInputLines] = useState(0);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
      setMaxTextInputLines(0);
    }
  };

  const handleOnClickLightning = () => {
    alert("Soon... :)");
  };

  const handleOnPressExpandTextInput = () => {
    setMaxTextInputLines(maxTextInputLines ? 0 : 15);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Button
          variant="small-close"
          size="unset"
          onPress={handleOnClickLightning}
        >
          <Ionicons name="attach-outline" size={20} color={Colors.dark.white} />
        </Button>

        <View style={styles.inputWrapper}>
          <Button
            onPress={handleOnPressExpandTextInput}
            style={styles.expandButton}
          >
            <Ionicons
              name="ellipsis-horizontal-outline"
              size={20}
              color={Colors.dark.white}
            />
          </Button>
          <TextInput
            style={[styles.input, { minHeight: maxTextInputLines * 20 }]}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={!disable ? handleSend : () => {}}
            returnKeyType="send"
            placeholderTextColor={Colors.dark.deactive}
          />
        </View>

        <Button variant="small-close" size="unset" onPress={handleSend}>
          <Ionicons name="send-outline" size={20} color={Colors.dark.white} />
        </Button>

        {!newMessage?.length && (
          <Fragment>
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
              <Ionicons
                name="mic-outline"
                size={20}
                color={Colors.dark.white}
              />
            </Button>
          </Fragment>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: Colors.dark.backgroundSecondary,
    height: "auto",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingBottom: 12,
    gap: 8,
    height: "auto",
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    flex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundPrimary,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderRadius: 16,
    borderWidth: 1,
    color: Colors.dark.white,
    borderColor: Colors.dark.backgroundPrimary,
    outline: "none",
    outlineWidth: 0,
    width: "100%",
  },
  sendButtonText: {
    color: Colors.dark.white,
    fontWeight: "500",
  },
  expandButton: {
    position: "absolute",
    top: -25,
    // backgroundColor: "red",
    padding: 5,
    zIndex: 10,
  },
});

export default MessageInput;
