#!/bin/bash

echo "Setting up build environment..."

# Ensure CocoaPods is available
which pod || (echo "CocoaPods not found, installing..." && gem install cocoapods)

# Verify installation
pod --version

# Navigate to iOS directory and install pods
cd ios
pod install --verbose

echo "Prebuild script completed successfully" 