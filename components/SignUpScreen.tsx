import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Keyboard, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { sendEmailOTP, verifyEmailOTP, createUser } from '../firebase';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-z]*$/;

const SignUpScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [timer, setTimer] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [middleNameError, setMiddleNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [childName, setChildName] = useState('');
  const [childNameError, setChildNameError] = useState('');
  const [severity, setSeverity] = useState('');
  const [userType, setUserType] = useState('guardian'); // 'guardian' or 'teacher'
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer]);

  const handleSendOtp = async () => {
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    setOtpSent(true);
    setTimer(60);
    Keyboard.dismiss();
    
    try {
      const result = await sendEmailOTP(email);
      if (result.success) {
        Alert.alert('Success', 'OTP sent to your email');
      } else {
        Alert.alert('Error', result.message);
        setOtpSent(false);
        setTimer(0);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      setOtpSent(false);
      setTimer(0);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError('');
    setOtpSent(false);
    setTimer(0);
  };

  const handleOtpChange = (text: string) => {
    // Only allow 6 digits
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(sanitized);
    if (sanitized.length > 0 && sanitized.length < 6) {
      setOtpError('OTP must be 6 digits');
    } else {
      setOtpError('');
    }
  };

  const handleChildAgeChange = (text: string) => {
    // Only allow up to 2 digits, no letters or special characters
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 2);
    setChildAge(sanitized);
  };

  const handleNameChange = (setter: (v: string) => void, setError: (v: string) => void) => (text: string) => {
    if (text === '' || nameRegex.test(text)) {
      setter(text);
      setError('');
    } else {
      setError('Only alphabetic characters are allowed');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text.length < 7) {
      setPasswordError('Password must be at least 7 characters');
    } else if (text.length > 20) {
      setPasswordError('Password must be at most 20 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleSignUp = async () => {
    // Validate required fields
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (userType === 'guardian' && (!childAge || !childName || !severity)) {
      Alert.alert('Error', 'Please fill in all child information');
      return;
    }

    if (!otpSent || !otp) {
      Alert.alert('Error', 'Please verify your email with OTP');
      return;
    }

    try {
      // Verify OTP
      const otpResult = await verifyEmailOTP(email, otp);
      if (!otpResult.success) {
        Alert.alert('Error', otpResult.message);
        return;
      }

      // Create user
      const userData = {
        email,
        password,
        firstName,
        middleName,
        lastName,
        userType,
        ...(userType === 'guardian' && {
          childAge: parseInt(childAge),
          childName,
          severity,
        }),
      };

      const createResult = await createUser(userData);
      if (createResult.success) {
        Alert.alert('Success', 'Account created successfully!');
        // TODO: Navigate to appropriate screen based on user type
      } else {
        Alert.alert('Error', createResult.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
      )}
      <View style={styles.card}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.label}>Sign up as *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userType}
            onValueChange={setUserType}
            style={styles.picker}
          >
            <Picker.Item label="Guardian/Parent" value="guardian" />
            <Picker.Item label="Teacher/Moderator" value="teacher" />
          </Picker>
        </View>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          placeholder="Enter your email"
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {userType === 'teacher' && (
          <Text style={styles.infoText}>Please use your work email, not your personal email.</Text>
        )}
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        <View style={styles.otpRow}>
          <Button
            title={timer > 0 ? `Resend OTP (${timer}s)` : otpSent ? "Resend OTP" : "Send OTP"}
            onPress={handleSendOtp}
            color="#4F8EF7"
            disabled={!email || !emailRegex.test(email) || timer > 0}
          />
        </View>
        {otpSent && (
          <>
            <Text style={styles.label}>OTP *</Text>
            <TextInput
              style={[styles.input, otpError && styles.inputError]}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="numeric"
              maxLength={6}
            />
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
          </>
        )}
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Enter password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          maxLength={20}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={[styles.input, firstNameError && styles.inputError]}
          placeholder="Enter first name"
          value={firstName}
          onChangeText={handleNameChange(setFirstName, setFirstNameError)}
        />
        {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}
        <Text style={styles.label}>Middle Name (optional)</Text>
        <TextInput
          style={[styles.input, middleNameError && styles.inputError]}
          placeholder="Enter middle name (optional)"
          value={middleName}
          onChangeText={handleNameChange(setMiddleName, setMiddleNameError)}
        />
        {middleNameError ? <Text style={styles.errorText}>{middleNameError}</Text> : null}
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={[styles.input, lastNameError && styles.inputError]}
          placeholder="Enter last name"
          value={lastName}
          onChangeText={handleNameChange(setLastName, setLastNameError)}
        />
        {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}
        {userType === 'guardian' && (
          <>
            <Text style={styles.label}>Children's Age *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter age"
              value={childAge}
              onChangeText={handleChildAgeChange}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.label}>Child's Name *</Text>
            <TextInput
              style={[styles.input, childNameError && styles.inputError]}
              placeholder="Enter child's name"
              value={childName}
              onChangeText={handleNameChange(setChildName, setChildNameError)}
            />
            {childNameError ? <Text style={styles.errorText}>{childNameError}</Text> : null}
            <Text style={styles.label}>Severity *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={severity}
                onValueChange={setSeverity}
                style={styles.picker}
              >
                <Picker.Item label="Select severity" value="" />
                <Picker.Item label="Mild" value="mild" />
                <Picker.Item label="Moderate" value="moderate" />
                <Picker.Item label="Severe" value="severe" />
                <Picker.Item label="Profound" value="profound" />
              </Picker>
            </View>
          </>
        )}
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#4F8EF7',
    letterSpacing: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    marginTop: 16,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F7FAFC',
    marginBottom: 2,
  },
  inputError: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FFF0F0',
  },
  errorText: {
    color: '#FF5A5F',
    fontSize: 13,
    marginBottom: 4,
    marginTop: 2,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 0,
    justifyContent: 'flex-end',
  },
  signUpButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: '#4F8EF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#E0E6ED',
    marginTop: 24, // Added space at the top
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F8EF7',
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    marginBottom: 2,
    marginTop: 2,
  },
  picker: {
    height: 44,
    width: '100%',
  },
  infoText: {
    color: '#4F8EF7',
    fontSize: 13,
    marginBottom: 4,
    marginTop: 2,
  },
});

export default SignUpScreen; 