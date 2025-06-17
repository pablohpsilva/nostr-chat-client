const { getDefaultConfig } = require("expo/metro-config");

try {
  const { getSentryExpoConfig } = require("@sentry/react-native/metro");
  const config = getSentryExpoConfig(__dirname);
  module.exports = config;
} catch (error) {
  console.log(
    "Sentry metro config not available, falling back to default config"
  );
  const config = getDefaultConfig(__dirname);
  module.exports = config;
}
