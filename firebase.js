import { initializeApp } from '@firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, sendPasswordResetEmail } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from '@firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAw0cZVU6mfpIB-eiHhXRYpk0wrT6QU5zU",
  authDomain: "lexilearn-4ee5b.firebaseapp.com",
  projectId: "lexilearn-4ee5b",
  storageBucket: "lexilearn-4ee5b.firebasestorage.app",
  messagingSenderId: "518977127187",
  appId: "1:518977127187:web:6106d24680cac2860c90e6",
  measurementId: "G-HK6C8BB2HD"
};

// Initialize Firebase only once
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If app already exists, get the existing one
  if (error.code === 'app/duplicate-app') {
    app = initializeApp();
  } else {
    throw error;
  }
}

const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Authentication functions
export const createUserWithEmail = async (email, password, userData) => {
  try {
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send email verification
    await sendEmailVerification(user);
    await AsyncStorage.setItem('lastVerificationEmailTime', Date.now().toString()); // Set initial verification email time
    
    // Store additional user data in Firestore
    const userRef = doc(db, 'users', email);
    try {
      await setDoc(userRef, {
        ...userData,
        uid: user.uid,
        emailVerified: false,
        createdAt: new Date(),
        status: userData.userType === 'teacher' ? 'pending' : 'active',
      });
    } catch (firestoreError) {
      console.log('Firestore error:', firestoreError);
      // If Firestore fails, still delete the Firebase Auth user
      await user.delete();
      throw new Error('Failed to save user data to database');
    }
    
    // Set up 2-minute timer to delete unverified user data
    setTimeout(async () => {
      try {
        // Check if user is still unverified after 2 minutes
        await user.reload(); // Refresh user data
        if (!user.emailVerified) {
          // Delete user data from Firestore completely
          await deleteDoc(userRef);
          // Delete the user from Firebase Auth
          await user.delete();
        }
      } catch (deleteError) {
        // If user.delete() fails, try to clean up Firestore anyway
        try {
          await deleteDoc(userRef);
        } catch (firestoreDeleteError) {
          // Silent error handling for unverified user deletion
        }
      }
    }, 120000); // 2 minutes = 120000 milliseconds
    
          return { 
        success: true, 
        message: 'Account created successfully! Please check your email and verify within 2 minutes.',
        user: user
      };
  } catch (error) {
    let errorMessage = 'Failed to create account';
    
    // Log the specific error for debugging
    console.log('Account creation error:', error.code, error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      // Check if there's actually a Firestore document for this user
      const userRef = doc(db, 'users', email);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Orphaned Firebase Auth user - suggest cleanup
        errorMessage = 'An account with this email exists but has no data. Please try signing in or contact support to reset your account.';
      } else {
        errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
      }
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters long.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password accounts are not enabled. Please contact support.';
    } else {
      errorMessage = `Account creation failed: ${error.message}`;
    }
    
    return { success: false, message: errorMessage };
  }
};

export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // User exists in Firebase Auth but not in Firestore (completely deleted)
      return { 
        success: false, 
        message: 'Your account has been completely deleted from the system. Please contact support if you believe this is an error.' 
      };
    }
    
    const userData = userDoc.data();
    
    return { 
      success: true, 
      message: 'Login successful',
      userType: userData.userType,
      userData: userData,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    let errorMessage = 'Failed to sign in';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    }
    
    return { success: false, message: errorMessage };
  }
};

export const resendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (!user || user.emailVerified) {
      return { success: false, message: 'No unverified user found' };
    }

    // Get the last verification time from AsyncStorage
    const lastVerificationTime = await AsyncStorage.getItem('lastVerificationEmailTime');
    const currentTime = Date.now();
    const thirtySecondsInMs = 30000; // 30 seconds in milliseconds

    if (lastVerificationTime) {
      const timeSinceLastEmail = currentTime - parseInt(lastVerificationTime);
      
      if (timeSinceLastEmail < thirtySecondsInMs) {
        const remainingTime = Math.ceil((thirtySecondsInMs - timeSinceLastEmail) / 1000);
        const seconds = remainingTime;
        const timeString = `${seconds}s`;
        
        return { 
          success: false, 
          message: `Please wait ${timeString} before requesting another verification email.` 
        };
      }
    }

    await sendEmailVerification(user);
    await AsyncStorage.setItem('lastVerificationEmailTime', currentTime.toString());
    
    return { success: true, message: 'Verification email sent successfully!' };
  } catch (error) {
    return { success: false, message: 'Failed to send verification email' };
  }
};

export const checkEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await user.reload(); // Refresh user data
      return { 
        success: true, 
        emailVerified: user.emailVerified 
      };
    } else {
      return { success: false, message: 'No user logged in' };
    }
  } catch (error) {
    return { success: false, message: 'Failed to check email verification' };
  }
};

// Check if email already exists
export const checkEmailExists = async (email) => {
  try {
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    return userDoc.exists();
  } catch (error) {
    return false;
  }
};

// Password reset function
export const resetPassword = async (email) => {
  try {
    // First check if the user exists in our Firestore database
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: 'No account found with this email address.' };
    }
    
    // If user exists in our database, send the password reset email
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent successfully! Please check your inbox.' };
  } catch (error) {
    let errorMessage = 'Failed to send password reset email';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else {
      errorMessage = `Password reset failed: ${error.message}`;
    }
    
    return { success: false, message: errorMessage };
  }
};

// Admin authentication
export const checkAdminCredentials = async (email, password) => {
  try {
    const adminRef = doc(db, 'admins', 'main');
    const adminDoc = await getDoc(adminRef);
    
    if (!adminDoc.exists()) {
      return { success: false, message: 'Admin not found' };
    }

    const adminData = adminDoc.data();
    if (adminData.email === email && adminData.password === password) {
      return { success: true, message: 'Admin login successful' };
    }

    return { success: false, message: 'Invalid credentials' };
  } catch (error) {
    return { success: false, message: 'Failed to verify admin credentials' };
  }
};

// User management functions
export const getPendingTeachers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userType', '==', 'teacher'), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
};

export const approveTeacher = async (email) => {
  try {
    const userRef = doc(db, 'users', email);
    await setDoc(userRef, { status: 'active' }, { merge: true });
    return { success: true, message: 'Teacher approved successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to approve teacher' };
  }
};

export const rejectTeacher = async (email, password) => {
  try {
    // First, sign in as the user to get their account
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Now delete the user's own account (like email verification)
    await user.delete();
    
    // Also delete from Firestore
    const userRef = doc(db, 'users', email);
    await deleteDoc(userRef);
    
    return { 
      success: true, 
      message: 'Teacher account has been completely deleted from both database and Firebase Authentication.' 
    };
  } catch (error) {
    let errorMessage = 'Failed to delete teacher account';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    }
    
    return { success: false, message: errorMessage };
  }
};

// Function to clean up orphaned Firebase Auth users
export const cleanupOrphanedUser = async (email) => {
  try {
    // First check if there's a Firestore document
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Try to sign in with a temporary password to get the user object
      // This is a workaround since we can't directly access Firebase Auth users
      return { 
        success: false, 
        message: 'Orphaned account detected. Please try signing in with your password, or contact support to reset your account.' 
      };
    }
    
    return { success: true, message: 'User data exists' };
  } catch (error) {
    return { success: false, message: 'Failed to check user status' };
  }
};

export const checkTeacherApproval = async (email) => {
  try {
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: 'User not found' };
    }
    
    const userData = userDoc.data();
    
    return { 
      success: true, 
      isApproved: userData.status === 'active',
      status: userData.status 
    };
  } catch (error) {
    return { success: false, message: 'Failed to check approval status' };
  }
};

export { auth, db }; 