import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import AdminDashboard from './components/AdminDashboard';
import ModeratorDashboard from './components/ModeratorDashboard';
import UserDashboard from './components/UserDashboard';
import { cleanupScheduledDeletions } from './firebase';

export default function App() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'moderator' | 'user' | null>(null);

  useEffect(() => {
    // Run cleanup on app start and then periodically
    let isMounted = true;
    const runCleanup = async () => {
      try {
        const result = await cleanupScheduledDeletions(60);
        if (__DEV__) {
          console.log('Cleanup result:', result);
        }
      } catch (_err) {}
    };
    runCleanup();
    const interval = setInterval(runCleanup, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
