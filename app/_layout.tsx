import { Stack } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "react-native";
import { openDatabase } from "@/storage/sqlite";
import { useEffect } from "react";

export default function Layout() {
  useEffect(() => { //runs on launch
    const setupDatabase = async () => { //function to copy and open database
      try{
        const db = await openDatabase();
        console.log("Database initialized");
      } catch (error) {
        console.error("Database error:",error);
      }
    };
    NavigationBar.setPositionAsync("absolute");
    NavigationBar.setBackgroundColorAsync("transparent");
    setupDatabase();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}> {/*Can be true, adds back button and title*/}
      {/*Will always be one of tabs present*/}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* Makes transparent screen for tracker creation*/}
      <Stack.Screen name="newTrackerView" options={{ presentation: "transparentModal", title: "New Tracker" }} />
    </Stack>
  );
}
