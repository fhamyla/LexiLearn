import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

export default function App() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <>
      {isAdmin ? (
        <React.Suspense fallback={<></>}>
          <AdminDashboard />
        </React.Suspense>
      ) : showSignUp ? (
        <SignUpScreen onBack={() => setShowSignUp(false)} />
      ) : (
        <LoginScreen onSignUp={() => setShowSignUp(true)} onAdminLogin={() => setIsAdmin(true)} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
