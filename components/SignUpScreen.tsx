import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Keyboard } from 'react-native';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const handleSendOtp = () => {
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    setOtpSent(true);
    Keyboard.dismiss();
    // No backend logic yet
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError('');
    setOtpSent(false);
  };

  const handleChildAgeChange = (text: string) => {
    // Only allow up to 2 digits, no letters or special characters
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 2);
    setChildAge(sanitized);
  };

  const handleSignUp = () => {
    // No backend logic yet
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
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        <View style={styles.otpRow}>
          <Button
            title={otpSent ? "Resend OTP" : "Send OTP"}
            onPress={handleSendOtp}
            color="#4F8EF7"
            disabled={!email || !emailRegex.test(email)}
          />
        </View>
        {otpSent && (
          <>
            <Text style={styles.label}>OTP *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
            />
          </>
        )}
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
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
          style={styles.input}
          placeholder="Enter first name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <Text style={styles.label}>Middle Name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter middle name (optional)"
          value={middleName}
          onChangeText={setMiddleName}
        />
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter last name"
          value={lastName}
          onChangeText={setLastName}
        />
        <Text style={styles.label}>Children's Age *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter age (2 digits)"
          value={childAge}
          onChangeText={handleChildAgeChange}
          keyboardType="numeric"
          maxLength={2}
        />
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
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F8EF7',
    fontWeight: '500',
  },
});

export default SignUpScreen; 