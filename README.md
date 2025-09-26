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

### 3.5. Firestore Data Model (What to create)

Create the following collections and documents to get started. You can add them via the Firebase Console → Firestore → Data.

- `users` (document ID = user email)
  - Required fields:
    - `uid` (string)
    - `userType` ("guardian" | "teacher")
    - `status` ("active" | "pending")
    - `firstName`, `lastName` (optional)
    - Guardian-only: `childName` (string), `childAge` (number), `severity` ("mild" | "moderate" | "severe" | "profound")
    - `emailVerified` (boolean), `createdAt` (Timestamp)

- `admins` (document ID = "main")
  - Fields:
    - `email` (string)
    - `password` (string) — simple demo credential used by the app for admin gate

- `students` (document ID = arbitrary string; app creates it automatically)
  - Common fields the app uses:
    - `id` (string; equals document ID)
    - `childName` (string)
    - `childAge` (number)
    - `severity` (string)
    - `progress` (number)
    - `createdAt` (Timestamp)
    - `createdBy` ("guardian" | "moderator")
    - If created by guardian: `guardianEmail` (string)
    - If created by moderator: `createdByEmail` (string), `createdByUid` (string)
    - `status` (string, e.g., "active")
    - `learningProgress` (map of category → items)
    - `focusAreas` (array of strings)

Example `students` document (simplified):
```json
{
  "id": "student_123",
  "childName": "Emma",
  "childAge": 8,
  "severity": "mild",
  "createdAt": "<Timestamp>",
  "createdBy": "guardian",
  "guardianEmail": "parent@example.com",
  "status": "active",
  "learningProgress": {
    "reading": { "basicPhonics": { "completed": false, "progress": 0 } },
    "math": { "numberRecognition": { "completed": false, "progress": 0 } },
    "social skills": { "eyeContact": { "completed": false, "progress": 0 } },
    "spelling": {},
    "writing": {}
  },
  "focusAreas": ["reading", "math"]
}
```

### 4. Set Up Firebase Services

#### **Authentication**
1. Go to Firebase Console → Authentication
2. Enable **Email/Password** sign-in method
3. Configure email templates (optional)

#### **Firestore Database**
1. Go to Firebase Console → Firestore Database
2. Create database in **test mode** (for development)
3. Set up security rules (see Security section below)
4. Create the composite indexes listed below (Indexes section)

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

For development, you can use Firestore Test Mode temporarily. For production, update your Firestore rules. The app stores `users` documents keyed by email and also uses `admins/main`, and `students` with creator metadata fields. Below are example rules aligned with how this app reads/writes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users are keyed by email; allow owner-by-email
    match /users/{email} {
      allow read, write: if
        request.auth != null &&
        request.auth.token.email != null &&
        request.auth.token.email == email;
    }

    // Admins collection: restrict to signed-in admins (simple demo rule)
    // Replace with a stronger model for real deployments
    match /admins/{docId} {
      allow read, write: if request.auth != null; // tighten as needed
    }

    // Students: creator-based access
    match /students/{studentId} {
      allow read, write: if request.auth != null && (
        // Guardian access: they own the record
        (resource.data.createdBy == 'guardian' && resource.data.guardianEmail == request.auth.token.email) ||
        // Moderator access: records created by the moderator
        (resource.data.createdBy == 'moderator' && resource.data.createdByEmail == request.auth.token.email)
      );
    }
  }
}
```

Adjust these rules to your org’s policy. During early development, run in Test Mode and migrate to strict rules before release.

### Required Composite Indexes

Create these indexes in Firestore (Console → Firestore Database → Indexes → Add Index):

- Collection: `users`
  - Fields: `userType` Asc, `status` Asc
  - Needed by: querying pending teachers in `getPendingTeachers()`

- Collection: `students`
  - Fields: `createdBy` Asc, `guardianEmail` Asc
  - Needed by: guardian-specific student query in `UserDashboard`

If you see a Firestore error mentioning a missing index, the console usually shows a direct link to create it.

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

#### Students Collection
```javascript
{
  id: string,
  childName: string,
  childAge: number,
  severity: string,
  progress: number,
  createdAt: Timestamp,
  createdBy: 'guardian' | 'moderator',
  guardianEmail?: string,          // when createdBy == 'guardian'
  createdByEmail?: string,         // when createdBy == 'moderator'
  createdByUid?: string,           // when createdBy == 'moderator'
  status: 'active' | 'inactive',
  learningProgress: {
    reading?: object,
    math?: object,
    'social skills'?: object,
    spelling?: object,
    writing?: object
  },
  focusAreas?: string[]
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
## ☁️ Optional: Cloud Functions (for admin account deletion)

Some code paths (e.g., fully deleting accounts from Firebase Authentication using admin privileges) reference a callable Cloud Function named `deleteUser` in region `us-central1`. This is optional; the app falls back to a client-only flow when not available.

High-level steps if you want this:
- Enable Blaze plan
- Initialize functions: `firebase init functions`
- Implement an HTTPS callable `deleteUser` that verifies admin credentials and deletes the Auth user
- Deploy: `firebase deploy --only functions`

Without this, moderator/admin deletion uses client-side fallbacks documented in the code.

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

For support, email fhamyla.devera@gmail.com or create an issue in this repository.

---

**Note**: This app is designed for children with learning disabilities. Please ensure all content is appropriate and accessible for the target audience.
