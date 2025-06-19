import { Alert, Platform } from "react-native";

export function alertUser(message: string) {
  Platform.OS === "web" ? alert(message) : Alert.alert(message);
}
