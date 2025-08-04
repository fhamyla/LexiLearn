import { initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from '@firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_NEW_API_KEY_HERE",
  authDomain: "lexilearn-4ee5b.firebaseapp.com",
  projectId: "lexilearn-4ee5b",
  storageBucket: "lexilearn-4ee5b.firebasestorage.app",
  messagingSenderId: "518977127187",
  appId: "1:518977127187:web:6106d24680cac2860c90e6",
  measurementId: "G-HK6C8BB2HD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Email OTP functions
export const sendEmailOTP = async (email) => {
  try {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Firestore with expiration (5 minutes)
    const otpRef = doc(db, 'otps', email);
    await setDoc(otpRef, {
      otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Call the Vercel backend to send email
    console.log('Attempting to call Vercel API...');
    const response = await fetch('https://vercel-backend-one-lime.vercel.app/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Check if response is ok before parsing JSON
    if (!response.ok) {
      console.error('Vercel API error:', response.status, response.statusText);
      return { success: false, message: 'Email service temporarily unavailable' };
    }
    
    const result = await response.json();

    if (result.success) {
      return { success: true, message: 'OTP sent to your email' };
    } else {
      return { success: false, message: result.message || 'Failed to send OTP' };
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
};

export const verifyEmailOTP = async (email, otp) => {
  try {
    const otpRef = doc(db, 'otps', email);
    const otpDoc = await getDoc(otpRef);
    
    if (!otpDoc.exists()) {
      return { success: false, message: 'OTP not found' };
    }

    const otpData = otpDoc.data();
    const now = new Date();
    
    if (now > otpData.expiresAt.toDate()) {
      return { success: false, message: 'OTP has expired' };
    }

    if (otpData.otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    // Delete the OTP after successful verification
    await setDoc(otpRef, { used: true });
    
    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: 'Failed to verify OTP' };
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

// User authentication
export const checkUserCredentials = async (email, password) => {
  try {
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: 'User not found' };
    }

    const userData = userDoc.data();
    if (userData.password === password) {
      return { 
        success: true, 
        message: 'Login successful',
        userType: userData.userType,
        userData: userData
      };
    }

    return { success: false, message: 'Invalid email or password' };
  } catch (error) {
    console.error('Error checking user credentials:', error);
    return { success: false, message: 'Failed to verify user credentials' };
  }
};

// User management functions
export const createUser = async (userData) => {
  try {
    // Check if user already exists
    const userRef = doc(db, 'users', userData.email);
    const existingUser = await getDoc(userRef);
    
    if (existingUser.exists()) {
      return { success: false, message: 'An account with this email already exists. Please use a different email or try signing in.' };
    }

    // Create new user
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
      status: userData.userType === 'teacher' ? 'pending' : 'active',
    });
    return { success: true, message: 'User created successfully' };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, message: 'Failed to create user' };
  }
};

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