import { Ionicons } from "@expo/vector-icons";
import { Fragment, useState } from "react";
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { RESULTS } from "react-native-permissions";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { CameraScanner } from "@/components/ui/CameraScanner";
import { goToSettings } from "@/components/ui/CameraScanner/helpers";
import { TextField } from "@/components/ui/TextField";
import { H4, TypographyBodyL } from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { EPermissionTypes, usePermissions } from "@/hooks/usePermissions";
import SearchStartChat from "./SearchStartChat";

export default function AddContactModal({
  isOverlayOpen,
  handleCloseOverlay,
}: {
  isOverlayOpen: boolean;
  handleCloseOverlay: () => void;
}) {
  const { askPermissions } = usePermissions(EPermissionTypes.CAMERA);
  const [cameraShown, setCameraShown] = useState(false);
  const [qrText, setQrText] = useState("");

  const takePermissions = async () => {
    askPermissions()
      .then((response) => {
        //permission given for camera
        if (
          response.type === RESULTS.LIMITED ||
          response.type === RESULTS.GRANTED
        ) {
          setCameraShown(true);
        }
      })
      .catch((error) => {
        if ("isError" in error && error.isError) {
          Alert.alert(
            error.errorMessage ||
              "Something went wrong while taking camera permission"
          );
        }
        if ("type" in error) {
          if (error.type === RESULTS.UNAVAILABLE) {
            Alert.alert("This feature is not supported on this device");
          } else if (
            error.type === RESULTS.BLOCKED ||
            error.type === RESULTS.DENIED
          ) {
            Alert.alert(
              "Permission Denied",
              "Please give permission from settings to continue using camera.",
              [
                {
                  text: "Cancel",
                  onPress: () => console.log("Cancel Pressed"),
                  style: "cancel",
                },
                { text: "Go To Settings", onPress: () => goToSettings() },
              ]
            );
          }
        }
      });
  };

  const handleReadCode = (value: string) => {
    console.log(value);
    setQrText(value);
    setCameraShown(false);
  };

  if (cameraShown) {
    return (
      <CameraScanner
        setIsCameraShown={setCameraShown}
        onReadCode={handleReadCode}
      />
    );
  }

  return (
    <Modal
      presentationStyle="fullScreen"
      animationType="slide"
      visible={isOverlayOpen}
      onRequestClose={handleCloseOverlay}
    >
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCloseOverlay}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.dark.white} />
          </TouchableOpacity>
          <H4>Add user</H4>
        </SafeAreaView>

        <View style={styles.inputContainer}>
          <TypographyBodyL>Enter pubkey or npub</TypographyBodyL>
          <TextField
            label="Enter pubkey or npub"
            value={qrText}
            onChangeText={setQrText}
            placeholder="npub1..."
            placeholderTextColor={Colors.dark.deactive}
          />
        </View>

        <View style={styles.searchResults}>
          <Button
            variant="ghost-white"
            onPress={() => setCameraShown(true)}
            leftIcon={
              <Ionicons
                name="scan-outline"
                size={20}
                color={Colors.dark.white}
              />
            }
          >
            Scan QR Code
          </Button>
        </View>
        {qrText && qrText.length > 60 && (
          <Fragment>
            <View>
              <TypographyBodyL>Results:</TypographyBodyL>
            </View>
            <SearchStartChat npub={qrText} onClose={handleCloseOverlay} />
          </Fragment>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundPrimary,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundPrimary,
  },
  inputContainer: {
    padding: 16,
    gap: 8,
  },
  label: {
    marginBottom: 4,
  },
  searchResults: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.deactive,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.deactive,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  backButton: {
    marginRight: 16,
  },
});
