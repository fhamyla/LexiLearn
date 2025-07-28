# LexiLearn - React Native App

A modern React Native learning application built with Expo and Firebase, featuring user authentication, admin dashboard, and email OTP verification.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo Go** app on your mobile device (iOS/Android)
- **Firebase project** (for backend functionality)

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

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Add a **Web app** to your project
4. Copy your Firebase config

### 2. Configure Firebase

1. **Create `firebase.js`** in your project root:
   ```javascript
   import { initializeApp } from '@firebase/app';
   import { getAuth } from '@firebase/auth';
   import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from '@firebase/firestore';
   import { getFunctions, httpsCallable } from '@firebase/functions';

   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   };

   const app = initializeApp(firebaseConfig);
   const auth = getAuth(app);
   const db = getFirestore(app);
   const functions = getFunctions(app);

   export { auth, db, functions };
   ```

2. **Replace config values** with your actual Firebase project credentials

### 3. Set Up Firebase Services

#### **Authentication**
1. Go to Firebase Console → Authentication
2. Enable **Email/Password** sign-in method
3. Enable **Email link (passwordless sign-in)** for OTP

#### **Firestore Database**
1. Go to Firebase Console → Firestore Database
2. Create database in **test mode** (for development)
3. Set up security rules (see Security section below)

#### **Firebase Functions** (for email OTP)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize functions: `firebase init functions`
4. Set up email credentials:
   ```bash
   firebase functions:config:set gmail.email="your_gmail@gmail.com"
   firebase functions:config:set gmail.password="your_app_password"
   ```
5. Deploy functions: `firebase deploy --only functions`

### 4. Set Up Admin Account

1. **Create admin document** in Firestore:
   - Collection: `admins`
   - Document ID: `main`
   - Fields:
     ```json
     {
       "email": "lexiadmin",
       "password": "adminlexi"
     }
     ```

## 🔐 Security Configuration

### Firestore Security Rules

For production, update your Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow admins to read all data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

## 👤 Admin Access

### Admin Login
- **Email**: `lexiadmin`
- **Password**: `adminlexi`

### Admin Features
- Approve/reject teacher/moderator accounts
- View all user accounts
- Track children's learning progress
- Manage user status

## 📱 Running the App

### For Development with Expo Go (Recommended)

Use tunnel mode to run the app on your physical device from anywhere:

```bash
npm run start:tunnel
```

This will:
- Start the Expo development server
- Create a secure tunnel for remote access
- Display a QR code in your browser
- Allow you to scan the QR code with Expo Go app

### Alternative Commands

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

## 🚀 Deployment

### Building APK

1. **Install EAS CLI**:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Configure EAS**:
   ```bash
   eas build:configure
   ```

3. **Build APK**:
   ```bash
   eas build -p android --profile preview
   ```

### Environment Variables

For production, consider using environment variables for sensitive data:

```bash
# Create .env file (not tracked by git)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
# ... other config values
```

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
- **Firebase**: For backend services
- **@expo/vector-icons**: For beautiful icons

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Configuration Errors**
   - Ensure `firebase.js` is properly configured
   - Check that all Firebase services are enabled
   - Verify admin credentials in Firestore

2. **Email OTP Not Working**
   - Check Firebase Functions deployment
   - Verify Gmail credentials in Firebase config
   - Check Firebase Functions logs

3. **TypeScript Errors**
   - Ensure all dependencies are installed: `npm install`
   - Check that `tsconfig.json` is properly configured
   - Restart your development server

4. **Expo Go Connection Issues**
   - Use `npm run start:tunnel` for better connectivity
   - Ensure your device and computer are on the same network (for local mode)
   - Check firewall settings

5. **Missing Dependencies**
   - Run `npm install` to install all packages
   - Install specific missing packages as needed

### Error Solutions

- **"Cannot find module"**: Run `npm install`
- **"Cannot use JSX"**: Check `tsconfig.json` has `"jsx": "react-native"`
- **"Module can only be default-imported"**: Ensure `"esModuleInterop": true` in `tsconfig.json`
- **"Firebase not initialized"**: Check `firebase.js` configuration
- **"Admin login failed"**: Verify admin document exists in Firestore

## 📝 Development Notes

- The app uses **Expo Go** for development and testing
- **Tunnel mode** is recommended for testing on physical devices
- All components are written in **TypeScript** for better development experience
- **Firebase Functions** handle email OTP sending
- **Firestore** stores user data and admin credentials
- **Admin dashboard** is accessible only to the main admin account

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
