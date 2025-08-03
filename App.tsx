import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import AdminDashboard from './components/AdminDashboard';
import ModeratorDashboard from './components/ModeratorDashboard';
import UserDashboard from './components/UserDashboard';

export default function App() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'moderator' | 'user' | null>(null);

  const handleLogout = () => {
    console.log('Logout called, setting userType to null');
    setUserType(null);
  };

  const renderDashboard = () => {
    console.log('renderDashboard called with userType:', userType);
    switch (userType) {
      case 'admin':
        console.log('Rendering AdminDashboard');
        return <AdminDashboard onLogout={handleLogout} />;
      case 'moderator':
        console.log('Rendering ModeratorDashboard');
        return <ModeratorDashboard onLogout={handleLogout} />;
      case 'user':
        console.log('Rendering UserDashboard');
        return <UserDashboard onLogout={handleLogout} />;
      default:
        console.log('No userType, returning null');
        return null;
    }
  };

  return (
    <>
      {userType ? (
        renderDashboard()
      ) : showSignUp ? (
        <SignUpScreen onBack={() => setShowSignUp(false)} />
      ) : (
        <LoginScreen 
          onSignUp={() => setShowSignUp(true)} 
          onAdminLogin={() => {
            console.log('onAdminLogin called, setting userType to admin');
            setUserType('admin');
          }}
          onModeratorLogin={() => {
            console.log('onModeratorLogin called, setting userType to moderator');
            setUserType('moderator');
          }}
          onUserLogin={() => {
            console.log('onUserLogin called, setting userType to user');
            setUserType('user');
          }}
        />
      )}
      <StatusBar style="auto" />
    </>
  );
}
