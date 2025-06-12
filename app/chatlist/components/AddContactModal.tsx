import { Ionicons } from "@expo/vector-icons";
import { Fragment, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { RESULTS } from "react-native-permissions";
import { SafeAreaView } from "react-native-safe-area-context";

import { goToSettings } from "@/components/ui/CameraScanner/helpers";
import { TextField } from "@/components/ui/TextField";
import { H4, TypographyBodyL } from "@/components/ui/Typography";
import { Colors } from "@/constants/Colors";
import { EPermissionTypes, usePermissions } from "@/hooks/usePermissions";
import { isValidNpubOrPublicKey } from "@/interal-lib/utils";
import SearchStartChat from "./SearchStartChat";

let CameraScanner: any = null;
if (Platform.OS !== "web" && process.env.NODE_ENV === "production") {
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  console.log("Platform.OS ", Platform.OS);
  const {
    CameraScanner: _CameraScanner,
  } = require("@/components/ui/CameraScanner");
  CameraScanner = _CameraScanner;
}

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

  const handleUseCamera = () => {
    setCameraShown(true);
    takePermissions().then(() => {
      setCameraShown(true);
    });
  };

  const handleReadCode = (value: string) => {
    const valueArray = value?.split(":");
    setQrText(valueArray?.[valueArray?.length - 1]);
    setCameraShown(false);
  };

  return (
    <Modal
      presentationStyle="fullScreen"
      animationType="slide"
      visible={isOverlayOpen}
      onRequestClose={handleCloseOverlay}
    >
      <SafeAreaView edges={["top"]} style={styles.modalSafeArea}>
        {cameraShown ? (
          <CameraScanner
            setIsCameraShown={setCameraShown}
            onReadCode={handleReadCode}
          />
        ) : (
          // <View />
          <View style={styles.container}>
            <View style={styles.searchHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleCloseOverlay}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={Colors.dark.white}
                />
              </TouchableOpacity>
              <H4>Add user</H4>
            </View>

            <View style={styles.inputContainer}>
              <TypographyBodyL>Directly start a chat</TypographyBodyL>

              <TextField
                label="Enter a pubkey or NPUB"
                value={qrText}
                onChangeText={setQrText}
                placeholder="npub1..."
                placeholderTextColor={Colors.dark.deactive}
              />
            </View>

            {/* {Platform.OS !== "web" && (
              <View style={styles.searchResults}>
                <Button
                  variant="ghost-white"
                  onPress={handleUseCamera}
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
            )} */}

            {qrText && isValidNpubOrPublicKey(qrText) && (
              <Fragment>
                <View style={styles.searchResultsTitle}>
                  <TypographyBodyL>Results:</TypographyBodyL>
                </View>
                <View style={styles.searchResultsContainer}>
                  <SearchStartChat npub={qrText} onClose={handleCloseOverlay} />
                </View>
              </Fragment>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundPrimary,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundPrimary,
  },
  inputContainer: {
    padding: 16,
    gap: 8,
  },
  label: {
    marginBottom: 4,
  },
  searchResults: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.deactive,
  },
  searchResultsTitle: {
    paddingHorizontal: 16,
    borderTopColor: Colors.dark.deactive,
  },
  searchResultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopColor: Colors.dark.deactive,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginTop: 16,
  },
  backButton: {
    marginRight: 16,
  },
});
