import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { checkAdminCredentials, signInUser, resendEmailVerification, resetPassword, checkTeacherApproval } from '../firebase';

const LoginScreen: React.FC<{ 
  onSignUp?: () => void; 
  onAdminLogin?: () => void;
  onModeratorLogin?: () => void;
  onUserLogin?: () => void;
}> = ({ onSignUp, onAdminLogin, onModeratorLogin, onUserLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage(''); // Clear any previous errors
    
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Login attempt with email:', email);
      
      // Check if it's admin login
      console.log('Checking admin credentials...');
      const adminResult = await checkAdminCredentials(email, password);
      
      if (adminResult.success) {
        console.log('Admin login successful');
        if (onAdminLogin) onAdminLogin();
        return;
      }

      // Try regular user login with Firebase Authentication
      console.log('Attempting Firebase Authentication login...');
      const userResult = await signInUser(email, password);
      
      if (userResult.success) {
        console.log('User login successful, userType:', userResult.userType);
        
        // Check if email is verified
        if (!userResult.emailVerified) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email address before signing in. Check your inbox for a verification email.',
            [
              { text: 'OK' },
              { 
                text: 'Resend Verification', 
                onPress: async () => {
                  try {
                    const result = await resendEmailVerification();
                    if (result.success) {
                      Alert.alert('Success', result.message);
                    } else {
                      Alert.alert('Info', result.message);
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to send verification email. Please try again.');
                  }
                }
              }
            ]
          );
          return;
        }

        // For teachers/moderators, check if their account is approved
        if (userResult.userType === 'teacher') {
          const approvalResult = await checkTeacherApproval(email);
          if (approvalResult.success && !approvalResult.isApproved) {
            Alert.alert(
              'Account Pending Approval',
              'Your account is waiting for admin approval. You will be able to sign in once your account has been approved.',
              [{ text: 'OK' }]
            );
            return;
          } else if (!approvalResult.success) {
            // This could be a deleted account or other error
            Alert.alert(
              'Account Status',
              approvalResult.message,
              [{ text: 'OK' }]
            );
            return;
          }
        }

        // Navigate based on user type
        if (userResult.userType === 'teacher') {
          if (onModeratorLogin) onModeratorLogin();
        } else {
          if (onUserLogin) onUserLogin();
        }
      } else {
        setErrorMessage(userResult.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    try {
      const result = await resetPassword(email);
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    }
  };

  const handleSignUp = () => {
    if (onSignUp) {
      onSignUp();
    } else {
      Alert.alert('Sign Up', 'Sign up functionality will be implemented here');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to LexiLearn</Text>
            <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Forgot Password */}
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>



            {/* Sign Up Section */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpLink}>Sign up here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light background for better contrast
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 40, // Added extra space at the top
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2C3E50', // Dark blue-gray for good readability
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 36, // Increased line height for better readability
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D', // Medium gray for secondary text
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 22,
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3498DB', // Blue for links
    fontWeight: '500',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#3498DB', // Blue button
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 56,
  },
  loginButtonDisabled: {
    backgroundColor: '#BDC3C7', // Gray when disabled
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32, // 2rem in px
  },
  signUpText: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 22,
  },
  signUpLink: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
    lineHeight: 22,
  },
  testButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 48,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoginScreen; 