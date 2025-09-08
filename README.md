# nostr Chat Client 🟣

A decentralized, privacy-focused chat application built on the Nostr protocol. Experience truly secure messaging with end-to-end encryption, no data collection, and complete user sovereignty over communications.

## ✨ Features

- 🌐 **Decentralized** - No central servers, operates on the Nostr network
- 🔒 **Real End-to-End Encryption** - Messages encrypted on your device using NIP-04 and NIP-17 protocols
- 👤 **Anonymous** - No registration required, you control your identity
- 🔓 **Permissionless** - Open protocol, censorship-resistant
- 🚫 **No Tracking** - Zero data collection or analytics
- ⚡️ **Lightning Powered** - Built-in Lightning Network support
- 🧅 **Tor Compatible** - Enhanced privacy protection
- 📱 **Cross-Platform** - iOS, Android, and Web support

## 🛠 Technology Stack

### Core Technologies

- **[Expo](https://expo.dev)** - React Native framework for cross-platform development
- **[React Native](https://reactnative.dev)** - Mobile app framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - File-based routing system

### Nostr Implementation

- **[nostr-tools](https://github.com/nbd-wtf/nostr-tools)** - Core Nostr protocol implementation
- **[NDK (Nostr Development Kit)](https://github.com/nostr-dev-kit/ndk)** - Advanced Nostr functionality
- **NIP-04** - Direct message encryption
- **NIP-17** - Private direct messages with enhanced privacy
- **NIP-44** - Versioned encryption standard

### State Management & Storage

- **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management
- **[AsyncStorage](https://github.com/react-native-async-storage/async-storage)** - Persistent local storage
- **React Context** - Global state management for Nostr connections

### UI & Styling

- **Custom Design System** - Consistent theming and typography
- **React Native Reanimated** - Smooth animations
- **Expo Symbols** - Native system icons
- **Custom Fonts** - Inter and Poppins font families

### Cryptography & Security

- **[@noble/ciphers](https://github.com/paulmillr/noble-ciphers)** - Cryptographic primitives
- **[@noble/curves](https://github.com/paulmillr/noble-curves)** - Elliptic curve cryptography
- **[@noble/hashes](https://github.com/paulmillr/noble-hashes)** - Hash functions
- **[@scure/bip32](https://github.com/paulmillr/scure-bip32)** - HD key derivation
- **[@scure/bip39](https://github.com/paulmillr/scure-bip39)** - Mnemonic seed phrases

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **pnpm** (recommended) or npm
- **Expo CLI** (`npm install -g @expo/cli`)
- **iOS Simulator** (macOS) or **Android Studio** (for emulators)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd nostr-chat-client
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start the development server**
   ```bash
   pnpm start
   # or
   npm start
   ```

### Running on Different Platforms

#### iOS Simulator (macOS only)

```bash
pnpm ios
# or
npm run ios
```

#### Android Emulator

```bash
pnpm android
# or
npm run android
```

#### Web Browser

```bash
pnpm web
# or
npm run web
```

#### Expo Go (Development)

1. Install [Expo Go](https://expo.dev/go) on your mobile device
2. Scan the QR code from the terminal after running `pnpm start`

## 📱 Building for Production

### iOS

```bash
# Build for iOS
pnpm eas:build:ios

# Submit to App Store
pnpm eas:submit:ios

# Build and submit in one command
pnpm eas:release:ios
```

### Android

```bash
# Prebuild Android
pnpm prebuild:android

# Build Android APK/AAB
pnpm eas:build:android
```

## 🏗 Project Structure

```
nostr-chat-client/
├── app/                    # App screens (file-based routing)
│   ├── chat/              # Chat screens (NIP-04 & NIP-17)
│   ├── chatlist/          # Chat list and contacts
│   ├── login/             # Authentication screens
│   └── keys/              # Key management
├── components/            # Reusable UI components
│   ├── Chat/              # Chat-specific components
│   ├── Context/           # React Context providers
│   └── ui/                # Design system components
├── hooks/                 # Custom React hooks
├── interal-lib/           # Core Nostr implementation
├── store/                 # Zustand state stores
├── constants/             # App constants and configuration
└── utils/                 # Utility functions
```

## 🔧 Development Scripts

```bash
# Development
pnpm start              # Start Expo dev server
pnpm ios               # Run on iOS simulator
pnpm android           # Run on Android emulator
pnpm web               # Run in web browser

# Code Quality
pnpm lint              # Run ESLint
pnpm doctor            # Run Expo doctor

# Building
pnpm prebuild:ios      # Prebuild for iOS
pnpm prebuild:android  # Prebuild for Android

# Version Management
pnpm update:version    # Update app version
pnpm update:build      # Update build number
```

## 🔐 Privacy & Security

This application prioritizes user privacy and security:

- **Local Key Management** - Private keys never leave your device
- **End-to-End Encryption** - All messages encrypted before transmission
- **No Data Collection** - Zero telemetry or analytics
- **Decentralized Architecture** - No central servers to compromise
- **Open Source** - Transparent, auditable code

## 📚 Documentation

- [Nostr Tools Usage Guide](./docs/NOSTR_TOOLS_USAGE.md) - Comprehensive guide to the Nostr implementation
- [Expo Documentation](https://docs.expo.dev/) - Framework documentation
- [Nostr Protocol](https://nostr.com/) - Learn about the Nostr protocol

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is private and proprietary. All rights reserved.
