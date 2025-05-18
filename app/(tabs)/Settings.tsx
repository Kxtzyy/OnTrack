/*
Settings Screen
- Settings screen, accessible via the tab bar
- Has settings options: 
    - Account
    - Backup & Restore
    - Tracker List
    - Help & Support
    - Disable notifications
*/

import { useState } from "react"; // Import useState for managing toggle state
import { Text, View, Pressable, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext"; // Import ThemeContext for theme management
import { useRouter } from "expo-router"; // Import router for navigation

export default function Index() {
  const { isDarkMode, toggleTheme, currentTheme } = useTheme(); // Access theme and toggle function
  const router = useRouter(); // Router for navigation between screens

  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // State for notifications toggle

  const toggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
    console.log(`Notifications ${!notificationsEnabled ? "enabled" : "disabled"}`);
    // Add logic to enable/disable notifications here
  };

  // Styles for the Settings screen
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      padding: 16,
      paddingTop: 40,
    },
    themeToggle: {
      flexDirection: "row", // Row layout for the theme toggle
      alignItems: "center",
      marginBottom: 20,
    },
    themeText: {
      fontSize: 18,
      marginLeft: 10, // Space between icon and text
    },
    settingsList: {
      width: "100%",
      flexGrow: 1, // Allow ScrollView to expand properly
    },
    settingsItem: {
      flexDirection: "row", // Row layout for each settings item
      alignItems: "center",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginBottom: 20,
      marginTop: 5,
    },
    settingsTextContainer: {
      marginLeft: 10, // Space between icon and text
    },
    settingsTitle: {
      fontSize: 18,
    },
    settingsDescription: {
      fontSize: 14,
      color: "#888", // Default gray color for descriptions
    },
    footer: {
      width: "100%",
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      borderTopWidth: 1,
      borderTopColor: "#ccc", // Light gray border for footer
      marginTop: 10,
    },
    footerText: {
      fontSize: 14,
    },
    toggleContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginBottom: 20,
      marginTop: 5,
      backgroundColor: currentTheme["101010"],
      borderWidth: 1,
      borderColor: currentTheme.dimgray,
    },
    toggleText: {
      fontSize: 18,
      marginLeft: 10,
      color: currentTheme.white,
    },
  });

  // List of settings items with their titles, descriptions, icons, and actions
  const settingsItems = [
    {
      title: "Account",
      description: "Profile | Email | Password",
      icon: "account",
      onPress: () => router.push("../accountSettings"), // Navigate to account settings
    },
    {
      title: "Backup & Restore",
      description: "Cloud Sync | Export Trackers",
      icon: "cloud-upload",
      onPress: () => router.push("../BackupAndRestore"), // Placeholder for backup functionality
    },
    {
      title: "Tracker List",
      description: "See Trackers | Edit Trackers",
      icon: "clipboard-list",
      onPress: () => router.push("../../trackerList"), // Navigate to tracker list
    },
    {
      title: "Help & Support",
      description: "FAQs | Contact Support",
      icon: "help-circle",
      onPress: () => router.push("../helpSupport"), // Navigate to help and support
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme["101010"] }}>
      {/* Main container */}
      <View style={[styles.container]}>
        {/* Theme toggle button */}
        <Pressable style={styles.themeToggle} onPress={toggleTheme}>
          <MaterialCommunityIcons
            name={isDarkMode ? "weather-night" : "white-balance-sunny"} // Icon changes based on theme
            size={24}
            color={currentTheme.white}
          />
          <Text style={[styles.themeText, { color: currentTheme.white }]}>
            {isDarkMode ? "Dark Mode" : "Light Mode"} {/* Display current theme */}
          </Text>
        </Pressable>

        {/* Scrollable list of settings */}
        <ScrollView
          horizontal={false} // Vertical scrolling
          style={{ width: "100%" }}
          contentContainerStyle={styles.settingsList}
        >
          {settingsItems.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.settingsItem,
                {
                  backgroundColor: currentTheme["101010"], // Set background color to currentTheme["101010"]
                  borderWidth: 1, // Add a border
                  borderColor: currentTheme.dimgray, // Set border color to currentTheme.dimgray
                },
              ]}
              onPress={item.onPress} // Navigate or perform action on press
            >
              <MaterialCommunityIcons
                name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={24}
                color={currentTheme.white}
              />
              <View style={styles.settingsTextContainer}>
                <Text style={[styles.settingsTitle, { color: currentTheme.white }]}>
                  {item.title} {/* Display setting title */}
                </Text>
                <Text style={[styles.settingsDescription, { color: currentTheme.gray }]}>
                  {item.description} {/* Display setting description */}
                </Text>
              </View>
            </Pressable>
          ))}

          {/* Notifications Toggle */}
          <View style={styles.toggleContainer}>
            <MaterialCommunityIcons
              name={notificationsEnabled ? "bell-ring" : "bell-off"}
              size={24}
              color={currentTheme.white}
            />
            <Pressable onPress={toggleNotifications}>
              <Text style={styles.toggleText}>
                {notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}