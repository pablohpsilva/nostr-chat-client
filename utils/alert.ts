import { Alert, Platform } from "react-native";

export const alertUser = (message: string) => {
  Platform.OS === "web" ? alert(message) : Alert.alert(message);
};
