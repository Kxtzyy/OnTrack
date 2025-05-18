import { Stack } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { ThemeProvider } from "./ThemeContext";
import { setupDatabase } from "@/components/ZustandRefresh";
import { LoginProvider } from './LoginContext';
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SQLiteDatabase } from "expo-sqlite";
import * as SQLite from 'expo-sqlite';
// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const deleteDatabase = async () => {
  try {
    // Provide the correct database name that you want to delete
    await SQLite.deleteDatabaseAsync('app.db');
    console.log('Database deleted successfully');
  } catch (error) {
    console.error('Failed to delete database:', error);
  }
};

export default function Layout() {
  //deleteDatabase();
  const notificationMessages = [
    "Stay on track! Remember, every step counts!",
    "Keep pushing forward! You're doing great!",
    "Believe in yourself!",
    "Every day is a new opportunity to improve yourself!",
    "Stay positive and keep moving forward!",
    "You are capable of amazing things!",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future depends on what you do today.",
  ]

  const randomMessage = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];

  
  
  // Runs on app launch
  useEffect(() => {
    
    setupDatabase();
      

    NavigationBar.setPositionAsync("absolute");
    NavigationBar.setBackgroundColorAsync("transparent");
  }, []); // runs once

  // Request notification permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted!');
        } else {
          console.log('Notification permissions granted!');
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };

    requestPermissions();
  }, []); // Empty dependency array ensures this runs only once

  // Show motivational notification on app launch
  useEffect(() => {
    const showMotivationalNotification = async () => {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Stay On Track! 🚀",
            body: randomMessage,
          },
          trigger: null, // Immediate notification
        });
        console.log('Motivational notification scheduled!');
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    };

    showMotivationalNotification();
  }, []); // Empty dependency array ensures this runs only once

  return (
    <LoginProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="Profile" options={{ presentation: "transparentModal", title: 'Profile' }} />
          <Stack.Screen name="newTrackerView" options={{ presentation: "transparentModal", title: "New Tracker" }} />
          <Stack.Screen name="userLoggedIn" options={{ presentation: "transparentModal", title: "User Logged In" }} />
          <Stack.Screen name="selectImage" options={{ presentation: "transparentModal", title: "Select Image" }} />
          <Stack.Screen name="ForgotPassword" options={{ presentation: "transparentModal", title: "Forgot Password" }} />
          
        </Stack>
      </ThemeProvider>
    </LoginProvider>
  );
}