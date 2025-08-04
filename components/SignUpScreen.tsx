import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmail, checkEmailExists } from '../firebase';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-z]*$/;

const SignUpScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [middleNameError, setMiddleNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [childName, setChildName] = useState('');
  const [childNameError, setChildNameError] = useState('');
  const [severity, setSeverity] = useState('');
  const [userType, setUserType] = useState('guardian'); // 'guardian' or 'teacher'
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError('');
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
    if (text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else if (text.length > 20) {
      setPasswordError('Password must be at most 20 characters');
    } else {
      setPasswordError('');
    }
  };

  // Helper function to check if a field is required but empty
  const isFieldRequired = (value: string, fieldName: string) => {
    return !value && fieldName !== 'middleName'; // middleName is optional
  };

  const handleSignUp = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setFirstNameError('');
    setLastNameError('');
    setChildNameError('');
    
    let hasErrors = false;
    const missingFields = [];

    // Validate required fields
    if (!email) {
      setEmailError('Email is required');
      missingFields.push('Email');
      hasErrors = true;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      missingFields.push('Password');
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }

    if (!confirmPassword) {
      missingFields.push('Confirm Password');
      hasErrors = true;
    } else if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!firstName) {
      setFirstNameError('First name is required');
      missingFields.push('First Name');
      hasErrors = true;
    }

    if (!lastName) {
      setLastNameError('Last name is required');
      missingFields.push('Last Name');
      hasErrors = true;
    }

    // Validate guardian-specific fields
    if (userType === 'guardian') {
      if (!childAge) {
        missingFields.push('Child Age');
        hasErrors = true;
      }
      if (!childName) {
        setChildNameError('Child name is required');
        missingFields.push('Child Name');
        hasErrors = true;
      }
      if (!severity) {
        missingFields.push('Severity');
        hasErrors = true;
      }
    }

    if (hasErrors) {
      Alert.alert(
        'Required Fields Missing', 
        `Please fill in the following required fields:\n\n${missingFields.join('\n')}`
      );
      return;
    }

    setIsLoading(true);

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setEmailError('An account with this email already exists. Please use a different email or try signing in.');
        setIsLoading(false);
        return;
      }

      // Create user data object
      const userData = {
        email,
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

      // Create user with Firebase Authentication
      const result = await createUserWithEmail(email, password, userData);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          'Account created successfully! Please check your email to verify your account before signing in.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to login or clear form
                if (onBack) onBack();
              }
            }
          ]
        );
      } else {
        if (result.message.includes('already exists')) {
          setEmailError(result.message);
        } else {
          Alert.alert('Error', result.message);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
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
        <Text style={styles.requiredNote}>* Required fields are marked with an asterisk</Text>
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
          style={[
            styles.input, 
            emailError && styles.inputError,
            isFieldRequired(email, 'email') && !emailError && styles.inputRequired
          ]}
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
        {emailError ? (
          <Text style={[
            styles.errorText, 
            emailError.includes('already exists') && styles.existingEmailError
          ]}>
            {emailError}
          </Text>
        ) : null}
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={[
            styles.input, 
            passwordError && styles.inputError,
            isFieldRequired(password, 'password') && !passwordError && styles.inputRequired
          ]}
          placeholder="Enter password"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          maxLength={20}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={[
            styles.input,
            isFieldRequired(confirmPassword, 'confirmPassword') && styles.inputRequired
          ]}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={[
            styles.input, 
            firstNameError && styles.inputError,
            isFieldRequired(firstName, 'firstName') && !firstNameError && styles.inputRequired
          ]}
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
          style={[
            styles.input, 
            lastNameError && styles.inputError,
            isFieldRequired(lastName, 'lastName') && !lastNameError && styles.inputRequired
          ]}
          placeholder="Enter last name"
          value={lastName}
          onChangeText={handleNameChange(setLastName, setLastNameError)}
        />
        {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}
        {userType === 'guardian' && (
          <>
            <Text style={styles.label}>Children's Age *</Text>
            <TextInput
              style={[
                styles.input,
                isFieldRequired(childAge, 'childAge') && styles.inputRequired
              ]}
              placeholder="Enter age"
              value={childAge}
              onChangeText={handleChildAgeChange}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.label}>Child's Name *</Text>
            <TextInput
              style={[
                styles.input, 
                childNameError && styles.inputError,
                isFieldRequired(childName, 'childName') && !childNameError && styles.inputRequired
              ]}
              placeholder="Enter child's name"
              value={childName}
              onChangeText={handleNameChange(setChildName, setChildNameError)}
            />
            {childNameError ? <Text style={styles.errorText}>{childNameError}</Text> : null}
            <Text style={styles.label}>Severity *</Text>
            <View style={[
              styles.pickerContainer,
              isFieldRequired(severity, 'severity') && styles.inputRequired
            ]}>
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
        <TouchableOpacity 
          style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]} 
          onPress={handleSignUp} 
          disabled={isLoading}
        >
          <Text style={styles.signUpButtonText}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </Text>
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
  inputRequired: {
    borderColor: '#FFA500',
    backgroundColor: '#FFF8E1',
  },
  errorText: {
    color: '#FF5A5F',
    fontSize: 13,
    marginBottom: 4,
    marginTop: 2,
  },
  existingEmailError: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '500',
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
  signUpButtonDisabled: {
    opacity: 0.7,
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
    height: 60,
    width: '100%',
  },
  infoText: {
    color: '#4F8EF7',
    fontSize: 13,
    marginBottom: 4,
    marginTop: 2,
  },
  requiredNote: {
    color: '#666',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SignUpScreen; 