import { initializeApp } from '@firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, sendPasswordResetEmail } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from '@firebase/firestore';
import { getFunctions, httpsCallable } from '@firebase/functions';
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

// Initialize Auth with React Native persistence so user stays signed in across sessions
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);
// Explicitly set region to avoid "not-found" if deployed outside default
const functions = getFunctions(app, 'us-central1');

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
        approvedAt: userData.userType === 'teacher' ? null : new Date(),
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
        // Auth record without Firestore doc -> previously deleted account
        errorMessage = 'This email was previously used and the account has been deleted. Please create a new account using a different email.';
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
    if (userData && userData.disabled) {
      return {
        success: false,
        message: 'This account is scheduled for deletion and is temporarily disabled.'
      };
    }
    
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

// Get all students from the 'students' collection
export const getAllStudents = async () => {
  try {
    const studentsRef = collection(db, 'students');
    const querySnapshot = await getDocs(studentsRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading students:', error);
    return [];
  }
};

export const approveTeacher = async (email) => {
  try {
    const userRef = doc(db, 'users', email);
    await setDoc(userRef, { status: 'active', approvedAt: new Date() }, { merge: true });
    return { success: true, message: 'Teacher approved successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to approve teacher' };
  }
};

export const rejectTeacher = async (email, password) => {
  try {
    if (password) {
      // Client-side fallback: sign in as the user, then delete
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await user.delete();
      const userRef = doc(db, 'users', email);
      await deleteDoc(userRef);
      return { success: true, message: 'Account has been completely deleted from both database and Firebase Authentication.' };
    } else {
      // Admin path (requires Cloud Functions deployment and Blaze plan)
      const deleteUserFn = httpsCallable(functions, 'deleteUser');
      const response = await deleteUserFn({ email });
      const data = response && response.data ? response.data : response;
      if (data && data.success) {
        const userRef = doc(db, 'users', email);
        await deleteDoc(userRef);
        return { success: true, message: data.message || 'Account deleted successfully.' };
      }
      return { success: false, message: (data && data.message) || 'Failed to delete account' };
    }
  } catch (error) {
    let errorMessage = 'Failed to delete account';
    // Prefer Firebase Functions HttpsError details if available
    if (error && error.message) {
      errorMessage = error.message;
    }
    if (error && error.code === 'functions/not-found') {
      errorMessage = 'Delete function not found. Make sure it is deployed.';
    }
    if (error && error.code === 'functions/unauthenticated') {
      errorMessage = 'You must be signed in as admin to delete accounts.';
    }
    if (error && error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    }
    if (error && error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    }
    return { success: false, message: errorMessage };
  }
};

// Countdown and backend-backed full account deletion (Auth + Firestore)
export const confirmAccountDeletionWithCountdown = async (email, seconds = 60, adminCreds) => {
  try {
    // Optional: mark Firestore doc disabled immediately so sign-in is blocked during countdown
    try {
      const userRef = doc(db, 'users', email);
      await setDoc(
        userRef,
        { disabled: true, deletionScheduledAt: new Date(), deletionInSeconds: seconds },
        { merge: true }
      );
    } catch (_err) {}

    // Countdown on client; after it elapses, call backend to delete Auth and Firestore
    await new Promise(resolve => setTimeout(resolve, Math.max(0, seconds) * 1000));

    const deleteUserFn = httpsCallable(functions, 'deleteUser');
    const payload = adminCreds && adminCreds.email && adminCreds.password
      ? { email, adminEmail: adminCreds.email, adminPassword: adminCreds.password }
      : { email };
    const response = await deleteUserFn(payload);
    const data = response && response.data ? response.data : response;
    if (data && data.success) {
      return { success: true, message: data.message || 'Account deleted successfully.' };
    }
    return { success: false, message: (data && data.message) || 'Failed to delete account' };
  } catch (error) {
    let errorMessage = 'Failed to delete account';
    if (error && error.message) errorMessage = error.message;
    return { success: false, message: errorMessage };
  }
};

// Schedule Firestore-only deletion without Blaze/Cloud Functions
export const scheduleDatabaseDeletion = async (email, delayMs = 60000) => {
  try {
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, message: 'User not found' };
    }

    // Mark as disabled and record schedule metadata
    await setDoc(
      userRef,
      {
        disabled: true,
        deletionScheduledAt: new Date(),
        deletionInSeconds: Math.round(delayMs / 1000),
      },
      { merge: true }
    );

    setTimeout(async () => {
      try {
        await deleteDoc(userRef);
      } catch (_err) {
        // Silent failure: client may be closed; deletion won't run
      }
    }, delayMs);

    return {
      success: true,
      message: `Account scheduled for deletion in ${Math.round(delayMs / 1000)} seconds`,
    };
  } catch (error) {
    return { success: false, message: 'Failed to schedule deletion' };
  }
};

export const cleanupScheduledDeletions = async (graceSeconds = 60) => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const now = Date.now();
    let deleted = 0;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (!data || !data.deletionScheduledAt) continue;
      const scheduledAt = data.deletionScheduledAt instanceof Date
        ? data.deletionScheduledAt.getTime()
        : (data.deletionScheduledAt.seconds ? data.deletionScheduledAt.seconds * 1000 : Number(data.deletionScheduledAt));
      const waitMs = (data.deletionInSeconds ? data.deletionInSeconds * 1000 : graceSeconds * 1000);
      if (Number.isFinite(scheduledAt) && now - scheduledAt >= waitMs) {
        try {
          await deleteDoc(doc(db, 'users', docSnap.id));
          deleted += 1;
        } catch (_err) {
          // Skip failed deletions
        }
      }
    }
    return { success: true, deleted };
  } catch (error) {
    return { success: false, message: 'Cleanup failed' };
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

// Add student directly without guardian signup
export const addStudentDirectly = async (studentData) => {
  try {
    const { childName, childAge, severity } = studentData;
    
    // Validate required fields
    if (!childName || !childAge || !severity) {
      return { success: false, message: 'Missing required fields: childName, childAge, and severity are required' };
    }
    
    // Create a more unique ID for the student using crypto.randomUUID if available, fallback to enhanced timestamp + random
    let studentId;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      studentId = `student_${crypto.randomUUID()}`;
    } else {
      // Enhanced fallback with more randomness
      const timestamp = Date.now();
      const randomPart1 = Math.random().toString(36).substr(2, 9);
      const randomPart2 = Math.random().toString(36).substr(2, 9);
      const processId = Math.floor(Math.random() * 10000);
      studentId = `student_${timestamp}_${randomPart1}_${randomPart2}_${processId}`;
    }
    
    const currentUser = auth.currentUser;
    const createdByEmail = currentUser && currentUser.email ? currentUser.email : null;
    const createdByUid = currentUser && currentUser.uid ? currentUser.uid : null;
    
    // Create student document in Firestore
    const studentRef = doc(db, 'students', studentId);
    await setDoc(studentRef, {
      id: studentId,
      childName: childName.trim(),
      childAge: parseInt(childAge),
      severity: severity,
      progress: 0,
      createdAt: new Date(),
      createdBy: 'moderator', // Track who created this student
      createdByEmail: createdByEmail,
      createdByUid: createdByUid,
      status: 'active',
      // Add empty learning progress structure
      learningProgress: {
        reading: {
          basicPhonics: { completed: false, progress: 0 },
          sightWords: { completed: false, progress: 0 },
          readingComprehension: { completed: false, progress: 0 }
        },
        math: {
          numberRecognition: { completed: false, progress: 0 },
          basicAddition: { completed: false, progress: 0 },
          subtraction: { completed: false, progress: 0 }
        },
        'social skills': {
          eyeContact: { completed: false, progress: 0 },
          turnTaking: { completed: false, progress: 0 },
          emotionRecognition: { completed: false, progress: 0 }
        },
        spelling: {},
        writing: {}
      }
    });
    
    return { 
      success: true, 
      message: 'Student added successfully',
      studentId: studentId
    };
  } catch (error) {
    console.error('Error adding student:', error);
    return { 
      success: false, 
      message: 'Failed to add student: ' + error.message 
    };
  }
};

// Add guardian's child to students collection
export const addGuardianChildToStudents = async (childData, guardianEmail) => {
  try {
    const { childName, childAge, severity } = childData;
    
    // Validate required fields
    if (!childName || !childAge || !severity) {
      return { success: false, message: 'Missing required fields: childName, childAge, and severity are required' };
    }
    
    // Create a more unique ID for the student using crypto.randomUUID if available, fallback to enhanced timestamp + random
    let studentId;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      studentId = `student_${crypto.randomUUID()}`;
    } else {
      // Enhanced fallback with more randomness
      const timestamp = Date.now();
      const randomPart1 = Math.random().toString(36).substr(2, 9);
      const randomPart2 = Math.random().toString(36).substr(2, 9);
      const processId = Math.floor(Math.random() * 10000);
      studentId = `student_${timestamp}_${randomPart1}_${randomPart2}_${processId}`;
    }
    
    // Create student document in Firestore
    const studentRef = doc(db, 'students', studentId);
    await setDoc(studentRef, {
      id: studentId,
      childName: childName.trim(),
      childAge: parseInt(childAge),
      severity: severity,
      progress: 0,
      createdAt: new Date(),
      createdBy: 'guardian', // Track that this was created by a guardian
      guardianEmail: guardianEmail, // Link to guardian's email
      status: 'active',
      // Add empty learning progress structure
      learningProgress: {
        reading: {
          basicPhonics: { completed: false, progress: 0 },
          sightWords: { completed: false, progress: 0 },
          readingComprehension: { completed: false, progress: 0 }
        },
        math: {
          numberRecognition: { completed: false, progress: 0 },
          basicAddition: { completed: false, progress: 0 },
          subtraction: { completed: false, progress: 0 }
        },
        'social skills': {
          eyeContact: { completed: false, progress: 0 },
          turnTaking: { completed: false, progress: 0 },
          emotionRecognition: { completed: false, progress: 0 }
        },
        spelling: {},
        writing: {}
      }
    });
    
    return { 
      success: true, 
      message: 'Child added to students collection successfully',
      studentId: studentId
    };
  } catch (error) {
    console.error('Error adding guardian child to students:', error);
    return { 
      success: false, 
      message: 'Failed to add child to students collection: ' + error.message 
    };
  }
};

export { auth, db }; 

// Self-deletion: run as currently signed-in user, with 60s countdown
export const confirmOwnAccountDeletionWithCountdown = async (seconds = 60) => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    return { success: false, message: 'No signed-in user' };
  }
  const email = user.email;
  try {
    try {
      const userRef = doc(db, 'users', email);
      await setDoc(
        userRef,
        { disabled: true, deletionScheduledAt: new Date(), deletionInSeconds: seconds },
        { merge: true }
      );
    } catch (_err) {}

    await new Promise(resolve => setTimeout(resolve, Math.max(0, seconds) * 1000));

    // Delete Firestore first
    try {
      await deleteDoc(doc(db, 'users', email));
    } catch (_err) {}

    // Then delete the Auth user as self
    await user.delete();
    return { success: true, message: 'Account deleted from Auth and Firestore' };
  } catch (error) {
    let errorMessage = 'Failed to delete account';
    if (error && error.code === 'auth/requires-recent-login') {
      errorMessage = 'Please reauthenticate and try again to delete your account.';
    } else if (error && error.message) {
      errorMessage = error.message;
    }
    return { success: false, message: errorMessage };
  }
};