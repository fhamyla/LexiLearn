# LexiLearn - React Native App

A modern React Native learning application built with Expo, featuring a beautiful login screen with TypeScript support.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo Go** app on your mobile device (iOS/Android)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd LexiLearn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install missing packages** (if not already included)
   ```bash
   npm install @expo/vector-icons @types/react-native
   ```

4. **Update Expo to latest version** (if needed)
   ```bash
   npm update expo
   ```

### Running the App

#### For Development with Expo Go (Recommended)

Use tunnel mode to run the app on your physical device from anywhere:

```bash
npm run start:tunnel
```

This will:
- Start the Expo development server
- Create a secure tunnel for remote access
- Display a QR code in your browser
- Allow you to scan the QR code with Expo Go app

#### Alternative Commands

- **Local development**: `npm start`
- **Android emulator**: `npm run android`
- **iOS simulator**: `npm run ios` (Mac only)
- **Web browser**: `npm run web`

### Using Expo Go

1. **Download Expo Go** from your device's app store
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan the QR code** displayed in your browser after running `npm run start:tunnel`

3. **The app will load** on your device and automatically reload when you make changes

## 🛠️ Project Structure

```
LexiLearn/
├── App.tsx                 # Main app component
├── components/
│   └── LoginScreen.tsx     # Login screen component
├── assets/                 # Images and static files
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## 📱 Features

- **Modern UI Design**: Clean, accessible login interface
- **TypeScript Support**: Full type safety and IntelliSense
- **Responsive Layout**: Works on all screen sizes
- **Form Validation**: Basic email/password validation
- **Password Visibility Toggle**: Show/hide password functionality
- **Keyboard Handling**: Proper keyboard avoidance

## 🔧 Configuration

### TypeScript Configuration

The project uses a custom `tsconfig.json` optimized for React Native/Expo development:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "jsx": "react-native",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "target": "esnext",
    "module": "esnext",
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

### Dependencies

Key dependencies include:
- **React Native**: 0.79.5
- **Expo**: 53.0.20
- **React**: 19.0.0
- **TypeScript**: 5.8.3
- **@expo/vector-icons**: For beautiful icons

## 🐛 Troubleshooting

### Common Issues

1. **TypeScript Errors**
   - Ensure all dependencies are installed: `npm install`
   - Check that `tsconfig.json` is properly configured
   - Restart your development server

2. **Expo Go Connection Issues**
   - Use `npm run start:tunnel` for better connectivity
   - Ensure your device and computer are on the same network (for local mode)
   - Check firewall settings

3. **Missing Dependencies**
   - Run `npm install` to install all packages
   - Install specific missing packages as needed

### Error Solutions

- **"Cannot find module"**: Run `npm install`
- **"Cannot use JSX"**: Check `tsconfig.json` has `"jsx": "react-native"`
- **"Module can only be default-imported"**: Ensure `"esModuleInterop": true` in `tsconfig.json`

## 📝 Development Notes

- The app uses **Expo Go** for development and testing
- **Tunnel mode** is recommended for testing on physical devices
- All components are written in **TypeScript** for better development experience
- The login screen includes placeholder functions for authentication (to be implemented)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run start:tunnel`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy coding! 🎉**