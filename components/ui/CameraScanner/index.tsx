import React, { useEffect, useRef, useState } from "react";
import { Alert, Modal, SafeAreaView, StyleSheet, View } from "react-native";

import { ICameraScannerProps } from "@/constants/types";
import { useAppStateListener } from "@/hooks/useAppStateListener";
import { useIsFocused } from "@react-navigation/native";
import { RNHoleView } from "react-native-hole-view";
import {
  Camera,
  CameraRuntimeError,
  useCameraDevice,
  useCodeScanner,
} from "react-native-vision-camera";
import { getWindowHeight, getWindowWidth, isIos } from "./helpers";

export const CameraScanner = ({
  setIsCameraShown,
  onReadCode,
}: ICameraScannerProps) => {
  const device = useCameraDevice("back");
  const camera = useRef<Camera>(null);
  const isFocused = useIsFocused();
  const [isCameraInitialized, setIsCameraInitialized] = useState(isIos);
  const [isActive, setIsActive] = useState(isIos);
  const [flash, setFlash] = useState<"on" | "off">(isIos ? "off" : "on");
  const { appState } = useAppStateListener();
  const [codeScanned, setCodeScanned] = useState("");

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

  const onInitialized = () => {
    setIsCameraInitialized(true);
  };

  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        if (codes[0].value) {
          setIsActive(false);
          setTimeout(() => setCodeScanned(codes[0]?.value), 500);
        }
      }
      return;
    },
  });

  const onCrossClick = () => {
    setIsCameraShown(false);
  };

  const onError = (error: CameraRuntimeError) => {
    Alert.alert("Error!", error.message);
  };

  if (device == null) {
    Alert.alert("Error!", "Camera could not be started");
  }

  if (isFocused && device) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Modal presentationStyle="fullScreen" animationType="slide">
          <View
            style={[styles.cameraControls, { backgroundColor: undefined }]}
          />
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
});
