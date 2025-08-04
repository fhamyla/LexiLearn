# LexiLearn - Learning App for Children with Learning Disabilities

A React Native application designed to help children with learning disabilities through personalized learning experiences. The app supports both guardians/parents and teachers/moderators with different access levels and features.

## 🚀 Features

### For Guardians/Parents
- **Account Creation**: Sign up with child's information
- **Child Profile**: Store child's age, name, and learning severity
- **Progress Tracking**: Monitor child's learning progress
- **Email Verification**: Secure account creation with email verification

### For Teachers/Moderators
- **Account Creation**: Sign up with professional credentials
- **Pending Approval**: New teacher accounts require admin approval
- **Professional Access**: Work email verification
- **Moderator Dashboard**: Access to teaching tools

### For Admins
- **User Management**: Approve/reject teacher accounts
- **System Overview**: View all users and their status
- **Admin Dashboard**: Complete system control

## 🛠️ Technical Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Authentication, Firestore)
- **Authentication**: Firebase Auth with email verification
- **Database**: Firestore (NoSQL)
- **Email**: Firebase Authentication built-in email verification

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Firebase account
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LexiLearn
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Set Up Firebase

#### **Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication and Firestore Database

#### **Configure Firebase in Your App**
1. **Update `firebase.js`** with your project credentials:

```javascript
import { initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from '@firebase/firestore';

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

export { auth, db };
```

2. **Replace config values** with your actual Firebase project credentials

### 4. Set Up Firebase Services

#### **Authentication**
1. Go to Firebase Console → Authentication
2. Enable **Email/Password** sign-in method
3. Configure email templates (optional)

#### **Firestore Database**
1. Go to Firebase Console → Firestore Database
2. Create database in **test mode** (for development)
3. Set up security rules (see Security section below)

### 5. Set Up Admin Account

1. **Create admin document** in Firestore:
   - Collection: `admins`
   - Document ID: `main`
   - Fields:
     ```json
     {
       "email": "createyourownadmin",
       "password": "createyourownpassword"
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
- **Email**: `createyourownadmin`
- **Password**: `createyourownpassword`

### Admin Features
- Approve/reject teacher/moderator accounts
- View all user accounts
- Track children's learning progress
- Manage user status

## 📱 Running the App

### For Development with Expo Go (Recommended)
```bash
npm start
# or
yarn start
```

Then scan the QR code with Expo Go app on your phone.

### For Development with Simulator/Emulator
```bash
# For iOS (macOS only)
npm run ios

# For Android
npm run android
```

### For Production Build
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## 🔍 Troubleshooting

### Common Issues

#### **Firebase Connection Issues**
- Check your Firebase config in `firebase.js`
- Verify your project ID and API keys
- Ensure Authentication and Firestore are enabled

#### **Email Verification Issues**
- Check spam folder for verification emails
- Verify email templates in Firebase Console
- Ensure email verification is enabled in Authentication

#### **Build Issues**
- Clear cache: `expo r -c`
- Reset Metro: `npx react-native start --reset-cache`
- Check Expo CLI version: `expo --version`

#### **Firestore Permission Issues**
- Check Firestore security rules
- Verify user authentication status
- Check admin credentials in Firestore

### Debug Commands
```bash
# Check Firebase connection
firebase projects:list

# Check Firestore data
firebase firestore:indexes

# Check authentication status
firebase auth:export

# View app logs
expo logs
```

## 📊 Project Structure

```
LexiLearn/
├── components/           # React Native components
│   ├── LoginScreen.tsx  # User login interface
│   ├── SignUpScreen.tsx # User registration
│   ├── UserDashboard.tsx # Guardian dashboard
│   ├── AdminDashboard.tsx # Admin interface
│   └── ModeratorDashboard.tsx # Teacher interface
├── firebase.js          # Firebase configuration
├── App.tsx             # Main app component
├── package.json        # Dependencies
└── README.md          # This file
```

## 🔄 Development Workflow

### Adding New Features
1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement changes
3. Test thoroughly
4. Commit changes: `git commit -m "Add new feature"`
5. Push to remote: `git push origin feature/new-feature`
6. Create pull request

### Database Schema

#### Users Collection
```javascript
{
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  userType: "guardian" | "teacher",
  childAge: 8, // Only for guardians
  childName: "Jane", // Only for guardians
  severity: "mild" | "moderate" | "severe" | "profound", // Only for guardians
  status: "active" | "pending", // "pending" for teachers
  createdAt: Timestamp,
  emailVerified: boolean
}
```

#### Admins Collection
```javascript
{
  email: "admin@example.com",
  password: "hashed_password"
}
```

## 🚀 Deployment

### Firebase Hosting (Web)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Mobile App Stores
1. **Android**: Upload APK to Google Play Console
2. **iOS**: Upload IPA to App Store Connect

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@lexilearn.com or create an issue in this repository.

---

**Note**: This app is designed for children with learning disabilities. Please ensure all content is appropriate and accessible for the target audience.
