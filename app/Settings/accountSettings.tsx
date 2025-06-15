import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useTheme } from "../Contexts/ThemeContext";
import { router } from "expo-router";
import { supabase } from '../../storage/supabase';
import {useAuth} from '@/app/Contexts/LoginContext'

export default function AccountSettings() {
  const { currentTheme: theme } = useTheme();
  const { user,logout } = useAuth();
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => { // <<< async here
          
          if (user === null) {
            console.log("Not logged in");
          } else {
            const { data, error } = await supabase
              .from('Users')
              .select('user_id')
              .eq('email', user.email) 
              .single();
            if (error) {
              console.error("Failed to get user_id:", error);
            } else {
              const user_id = data.user_id;
              console.log("User ID is:", user_id);
              const {data: deleteDataSectionTracker, error: deleteSectionTrackerError } = await supabase
              .from('Section_Trackers')
              .delete()
              .eq('user_id', user_id)
              const {data: deleteDataSections, error: deleteSectionErrors } = await supabase
              .from('Sections')
              .delete()
              .eq('user_id', user_id)
              const {data: deleteDataTrackers, error: deleteTrackersError } = await supabase
              .from('Trackers')
              .delete()
              .eq('user_id', user_id)
              const {data: deleteDataUsers, error: deleteUsersError } = await supabase
              .from('Users')
              .delete()
              .eq('user_id', user_id)
              await logout()
              console.log("Deleted")
            }
          }
        } },
      ]
    );
  };

  const handleChangeEmail = () => {
    router.push('../Account/changeEmail');
    // Add navigation or logic for changing email
  };

  const handleChangePassword = () => {
    router.push('../Account/changePassword');
    // Add navigation or logic for changing password
  };

  return (
    <View style={[styles.container, { backgroundColor: theme["101010"] }]}>
      <Text style={[styles.header, { color: theme["FFFFFF"] }]}>Account Settings</Text>

      <Pressable style={[styles.button, { backgroundColor: theme["101010"] }]} onPress={handleChangeEmail}>
        <Text style={[styles.buttonText, { color: theme["FFFFFF"] }]}>Change Email</Text>
      </Pressable>

      <Pressable style={[styles.button, { backgroundColor: theme["101010"] }]} onPress={handleChangePassword}>
        <Text style={[styles.buttonText, { color: theme["FFFFFF"] }]}>Change Password</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.deleteButton]} onPress={handleDeleteAccount}>
        <Text style={[styles.buttonText, { color: "white" }]}>Delete Account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "red",
  },
});