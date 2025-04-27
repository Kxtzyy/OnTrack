import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Pressable } from 'react-native';
import { supabase } from '../storage/supabase';
import { useAuth } from './LoginContext'; 
import { useTheme } from './ThemeContext';

export default function ChangePasswordScreen() {
  const { currentTheme: theme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [comfirmEmail, setcomfirmEmail] = useState('');
  const {user} = useAuth();
  const handleChangePassword = async () => {
    if (newEmail !== comfirmEmail) {
      alert('Emails do not match!');
      return;
    }
    if (user === null){
        return;
    }
    else{
        const { data, error } = await supabase
        .from('Users')
        .select('password')
        .eq('email', user.email)  // or use 'username' if that's what you have
        .single(); // returns one row instead of array
        if (error) {
        console.error("Failed to get user_id:", error);
        } else {
        const password = data.password;
        if (currentPassword === password) {
            const { error: updateError } = await supabase
            .from('Users')
            .update({ email: newEmail })
            .eq('email', user.email);

            if (updateError) {
                console.error("Failed to update password:", updateError);
                alert('Failed to update password.');
                return;
            }
                alert('Password changed successfully!');
            }
            else{
                alert('Wrong password.');
            }
        }
    }
    
    alert('E-mail changed successfully!');
    router.back();
  };

  return (
    <View style={[styles.container,  { backgroundColor: theme["101010"] }]}>
      <Text style={[styles.title, { color: theme["FFFFFF"] }]}>Change Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter current password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter new E-Mail"
        placeholderTextColor="#aaa"
        value={newEmail}
        onChangeText={setNewEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm new E-Mail"
        placeholderTextColor="#aaa"
        value={comfirmEmail}
        onChangeText={setcomfirmEmail}
      />

      <Pressable style={[styles.button, { backgroundColor: theme["101010"] }]} onPress={handleChangePassword}>
        <Text style={[styles.buttonText, { color: theme["FFFFFF"] }]}>Change Password</Text>
      </Pressable>

    </View>
  );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    label: {
      fontSize: 16,
      marginBottom: 6,
      marginTop: 12,
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
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      marginBottom: 16,
    },
    buttonContainer: {
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 15,
    },
  });