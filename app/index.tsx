import { Stack, useRouter } from "expo-router";
import { Fragment } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.replace("/login");
  };

  return (
    <Fragment>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to NoStream</Text>

          <Text style={styles.subtitle}>Your secure messaging platform</Text>

          <View style={styles.features}>
            <Text style={styles.featureText}>• End-to-end encryption</Text>
            <Text style={styles.featureText}>• Instant messaging</Text>
            <Text style={styles.featureText}>• Group chats</Text>
            <Text style={styles.featureText}>• Media sharing</Text>
            <Text style={styles.featureText}>• Complete privacy</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNavigateToLogin}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    textAlign: "center",
    opacity: 0.8,
  },
  features: {
    alignSelf: "stretch",
    marginTop: 20,
  },
  featureText: {
    fontSize: 16,
    marginBottom: 12,
    paddingLeft: 10,
  },
  button: {
    backgroundColor: "#0066CC",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
