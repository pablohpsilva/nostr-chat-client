const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// File paths
const PACKAGE_JSON_PATH = path.join(__dirname, "..", "package.json");
const APP_JSON_PATH = path.join(__dirname, "..", "app.json");
const INFO_PLIST_PATH = path.join(
  __dirname,
  "..",
  "ios",
  "nostreamchatclient",
  "Info.plist"
);

// Helper function to read and parse JSON files
function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

// Helper function to write JSON files
function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

// Helper function to update version in Info.plist
function updateInfoPlistVersion(version, buildNumber) {
  let content = fs.readFileSync(INFO_PLIST_PATH, "utf8");

  // Update CFBundleShortVersionString (version) if provided
  if (version) {
    content = content.replace(
      /<key>CFBundleShortVersionString<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleShortVersionString</key>\n    <string>${version}</string>`
    );
  }

  // Update CFBundleVersion (build number) if provided
  if (buildNumber) {
    content = content.replace(
      /<key>CFBundleVersion<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleVersion</key>\n    <string>${buildNumber}</string>`
    );
  }

  fs.writeFileSync(INFO_PLIST_PATH, content);
}

// Main function to update versions
function updateVersion(newVersion, newBuildNumber) {
  try {
    // Update package.json if version is provided
    if (newVersion) {
      const packageJson = readJsonFile(PACKAGE_JSON_PATH);
      packageJson.version = newVersion;
      writeJsonFile(PACKAGE_JSON_PATH, packageJson);
      console.log(`✅ Updated version in package.json to ${newVersion}`);
    }

    // Update app.json if version is provided
    if (newVersion) {
      const appJson = readJsonFile(APP_JSON_PATH);
      appJson.expo.version = newVersion;
      writeJsonFile(APP_JSON_PATH, appJson);
      console.log(`✅ Updated version in app.json to ${newVersion}`);
    }

    // Update Info.plist
    updateInfoPlistVersion(newVersion, newBuildNumber);
    if (newVersion) {
      console.log(`✅ Updated version in Info.plist to ${newVersion}`);
    }
    if (newBuildNumber) {
      console.log(`✅ Updated build number in Info.plist to ${newBuildNumber}`);
    }

    // Run git add to stage the changes
    // execSync("git add package.json app.json ios/nostreamchatclient/Info.plist");
    console.log("✅ Staged changes in git");
  } catch (error) {
    console.error("❌ Error updating versions:", error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage:");
  console.log("  Update version: node update-version.js <version>");
  console.log("  Update build: node update-version.js --build <buildNumber>");
  console.log("  Update both: node update-version.js <version> <buildNumber>");
  console.log("\nExamples:");
  console.log("  node update-version.js 1.0.3");
  console.log("  node update-version.js --build 42");
  console.log("  node update-version.js 1.0.3 42");
  process.exit(1);
}

let newVersion = null;
let newBuildNumber = null;

// Check if we're only updating the build number
if (args[0] === "--build") {
  if (args.length !== 2) {
    console.error("❌ Please provide a build number after --build");
    process.exit(1);
  }
  newBuildNumber = args[1];
} else {
  newVersion = args[0];
  newBuildNumber = args[1];
}

// Validate version format if provided
if (newVersion && !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error("❌ Invalid version format. Please use format: x.y.z");
  process.exit(1);
}

// Validate build number if provided
if (newBuildNumber && !/^\d+$/.test(newBuildNumber)) {
  console.error("❌ Build number must be a positive integer");
  process.exit(1);
}

updateVersion(newVersion, newBuildNumber);
