import { Tabs } from "expo-router";
import { ThemeProvider } from "../Contexts/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../Contexts/ThemeContext"; // Import the ThemeContext

export default function TabLayout() {
  const { currentTheme } = useTheme(); // Access the current theme from ThemeContext

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hide the header for all tabs
        tabBarActiveTintColor: currentTheme["FFFFFF"], // Active tab icon color
        tabBarShowLabel: false, // Hide tab labels
        tabBarStyle: {
          backgroundColor: currentTheme["101010"], // Tab bar background color
          borderTopWidth: 0, // Remove the top border of the tab bar
        },
        tabBarItemStyle: {
          paddingVertical: 9, // Add vertical padding to tab items
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="home" color={color} />,
        }}
      />
      {/* Calendar Tab */}
      <Tabs.Screen
        name="Calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="calendar" color={color} />,
        }}
      />
      {/* Settings Tab */}
      <Tabs.Screen
        name="Settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}