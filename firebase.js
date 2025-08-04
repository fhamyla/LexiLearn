import { initializeApp } from '@firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from '@firebase/firestore';

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
    
    // Store additional user data in Firestore
    const userRef = doc(db, 'users', email);
    await setDoc(userRef, {
      ...userData,
      uid: user.uid,
      emailVerified: false,
      createdAt: new Date(),
      status: userData.userType === 'teacher' ? 'pending' : 'active',
    });
    
    return { 
      success: true, 
      message: 'Account created successfully! Please check your email to verify your account.',
      user: user
    };
  } catch (error) {
    console.error('Error creating user:', error);
    let errorMessage = 'Failed to create account';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters long.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
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
      return { success: false, message: 'User data not found' };
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
    console.error('Error signing in:', error);
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
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
      return { success: true, message: 'Verification email sent successfully!' };
    } else {
      return { success: false, message: 'No unverified user found' };
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
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
    console.error('Error checking email verification:', error);
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
    console.error('Error checking email existence:', error);
    return false;
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
    console.error('Error checking admin credentials:', error);
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
    console.error('Error getting pending teachers:', error);
    return [];
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

export { auth, db }; 