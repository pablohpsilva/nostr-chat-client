import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { ICameraScannerProps } from "@/constants/types";
import { useAppStateListener } from "@/hooks/useAppStateListener";
import { useIsFocused } from "@react-navigation/native";
import { TypographyBodyL } from "../Typography";

// Conditionally import VisionCamera only on native platforms
let Camera: any = null;
let useCameraDevice: any = () => null;
let useCodeScanner: any = () => ({});
let RNHoleView: any = null;

if (Platform.OS !== "web") {
  const VisionCamera = require("react-native-vision-camera");
  const { RNHoleView: _RNHoleView } = require("react-native-hole-view");
  Camera = VisionCamera.Camera;
  useCameraDevice = VisionCamera.useCameraDevice;
  useCodeScanner = VisionCamera.useCodeScanner;
  RNHoleView = _RNHoleView;
}

import { Ionicons } from "@expo/vector-icons";
import { getWindowHeight, getWindowWidth, isIos } from "./helpers";

export const CameraScanner = ({
  setIsCameraShown,
  onReadCode,
}: ICameraScannerProps) => {
  // If on web, show a message and return early
  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Modal presentationStyle="fullScreen" animationType="slide">
          <View style={styles.webFallback}>
            <TypographyBodyL style={styles.webFallbackText}>
              Camera scanning is not available on web.
            </TypographyBodyL>
            <TypographyBodyL
              style={[
                styles.webFallbackText,
                { marginTop: 20, textDecorationLine: "underline" },
              ]}
              onPress={() => setIsCameraShown(false)}
            >
              Go Back
            </TypographyBodyL>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  const device = useCameraDevice("back");
  const camera = useRef<any>(null);
  const isFocused = useIsFocused();
  const [isCameraInitialized, setIsCameraInitialized] = useState(isIos);
  const [isActive, setIsActive] = useState(isIos);
  const [flash, setFlash] = useState<"on" | "off">(isIos ? "off" : "on");
  const { appState } = useAppStateListener();
  const [codeScanned, setCodeScanned] = useState("");

  const onInitialized = () => {
    setIsCameraInitialized(true);
  };

  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned: (codes: any) => {
      if (codes.length > 0) {
        if (codes[0].value) {
          setIsActive(false);
          setTimeout(() => setCodeScanned(codes?.[0]?.value), 500);
        }
      }
      return;
    },
  });

  const onCrossClick = () => {
    setIsCameraShown(false);
  };

  const onError = (error: any) => {
    Alert.alert("Error!", error.message);
  };

  useEffect(() => {
    if (codeScanned) {
      onReadCode(codeScanned);
    }
  }, [codeScanned, onReadCode]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isCameraInitialized) {
      timeout = setTimeout(() => {
        setIsActive(true);
        setFlash("off");
      }, 1000);
    }
    setIsActive(false);
    return () => {
      clearTimeout(timeout);
    };
  }, [isCameraInitialized]);

  if (device == null) {
    Alert.alert("Error!", "Camera could not be started");
  }

  if (isFocused && device && Camera) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Modal presentationStyle="fullScreen" animationType="slide">
          <View style={[styles.cameraControls, { backgroundColor: undefined }]}>
            <TouchableOpacity onPress={onCrossClick}>
              <Ionicons name="close" size={24} color={Colors.dark.white} />
            </TouchableOpacity>
          </View>
          <Camera
            torch={flash}
            onInitialized={onInitialized}
            ref={camera}
            onError={onError}
            photo={false}
            style={styles.fullScreenCamera}
            device={device}
            codeScanner={codeScanner}
            isActive={
              isActive &&
              isFocused &&
              appState === "active" &&
              isCameraInitialized
            }
          />
          <RNHoleView
            holes={[
              {
                x: getWindowWidth() * 0.1,
                y: getWindowHeight() * 0.28,
                width: getWindowWidth() * 0.8,
                height: getWindowHeight() * 0.4,
                borderRadius: 10,
              },
            ]}
            style={[styles.rnholeView, styles.fullScreenCamera]}
          />
        </Modal>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  safeArea: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  camera: {
    width: "100%",
    height: 200,
  },
  fullScreenCamera: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flex: 1,
    zIndex: 100,
  },
  rnholeView: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  cameraControls: {
    height: "10%",
    top: 15,
    position: "absolute",
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    zIndex: 1000,
  },
  icon: {
    height: 45,
    width: 45,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  webFallback: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundPrimary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  webFallbackText: {
    color: Colors.dark.white,
    textAlign: "center",
  },
});
