import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';

export default function App() {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <>
      {showSignUp ? (
        <SignUpScreen onBack={() => setShowSignUp(false)} />
      ) : (
        <LoginScreen onSignUp={() => setShowSignUp(true)} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
