import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import AdminDashboard from './components/AdminDashboard';
import ModeratorDashboard from './components/ModeratorDashboard';
import UserDashboard from './components/UserDashboard';
import ReadingScreen from "./components/LearningLibrary/ReadingScreen";
import SocialScreen from "./components/LearningLibrary/SocialScreen";
import SpellingScreen from "./components/LearningLibrary/SpellingScreen";
import WritingScreen from "./components/LearningLibrary/WritingScreen";
import LearningLibraryScreen from "./components/LearningLibrary/LearningLibraryScreen";

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'moderator' | 'user' | null>(null);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'OpenDyslexic-Regular': require('./assets/fonts/OpenDyslexic-Regular.ttf'),
        'OpenDyslexic-Bold': require('./assets/fonts/OpenDyslexic-Bold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!userType ? (
            <>
              {showSignUp ? (
                <Stack.Screen name="SignUp">
                  {() => <SignUpScreen onBack={() => setShowSignUp(false)} />}
                </Stack.Screen>
              ) : (
                <Stack.Screen name="Login">
                  {() => (
                    <LoginScreen
                      onSignUp={() => setShowSignUp(true)}
                      onAdminLogin={() => setUserType('admin')}
                      onModeratorLogin={() => setUserType('moderator')}
                      onUserLogin={() => setUserType('user')}
                    />
                  )}
                </Stack.Screen>
              )}
            </>
          ) : (
            <>
              {userType === 'admin' && (
                <Stack.Screen name="AdminDashboard">
                  {() => <AdminDashboard onLogout={() => setUserType(null)} />}
                </Stack.Screen>
              )}
              {userType === 'moderator' && (
                <Stack.Screen name="ModeratorDashboard">
                  {() => <ModeratorDashboard onLogout={() => setUserType(null)} />}
                </Stack.Screen>
              )}
              {userType === 'user' && (
                <>
                  <Stack.Screen name="UserDashboard">
                    {() => <UserDashboard onLogout={() => setUserType(null)} />}
                  </Stack.Screen>
                  <Stack.Screen name="LearningLibraryScreen" component={LearningLibraryScreen} />
                  <Stack.Screen name="ReadingScreen" component={ReadingScreen} />
                  <Stack.Screen name="SocialScreen" component={SocialScreen} />
                  <Stack.Screen name="SpellingScreen" component={SpellingScreen} />
                  <Stack.Screen name="WritingScreen" component={WritingScreen} />
                </>
              )}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
