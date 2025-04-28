import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from './ThemeContext';
import { supabase } from '../storage/supabase';  
import { CommonStyles } from './CommonStyles';

const width = Dimensions.get('window').width - 1;

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const { currentTheme } = useTheme();
  const commonStyles = CommonStyles();

  const passwordReset = async () => {
    if (!email || !newPassword) {
      setMessage('Please fill in both fields.');
      return;
    }

    try {
      const { data: user, error } = await supabase.from('Users')
        .select('*')
        .eq('email', email);

      if (error) {
        console.error(error);
        setMessage('An error occurred. Please try again.');
        return;
      }

      if (user.length > 0) {
        const { error: updateError } = await supabase.from('Users')
        .update({ password: newPassword })
        .eq('email', email);

        if (updateError) {
            console.error(updateError);
            setMessage('An error occurred restting your password.');
            return;
        }

        Alert.alert('Your password has been reset.');
        setEmail('');
        setNewPassword('');
        setMessage('');
        router.back();
      } else {
        setMessage('An account with that email does not exist.');
      }
    } catch (err) {
      console.error(err);
      setMessage('An error occurred. Please try again');
    }
  };

  return (
    <View style={commonStyles.overlay}>
      <Text style={commonStyles.header}>Reset Password</Text>

      <SafeAreaView style={commonStyles.container}>
        <TextInput
          style={commonStyles.input}
          placeholder="Enter your email"
          placeholderTextColor={currentTheme.gray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={commonStyles.input}
          placeholder="Enter new password"
          placeholderTextColor={currentTheme.gray}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        {message !== '' && (
          <Text style={{ color: currentTheme.lightblue, marginTop: 5 }}>
            {message}
          </Text>
        )}

        <Pressable onPress={passwordReset} style={commonStyles.button}>
          <Text style={commonStyles.buttonText}>Confirm</Text>
        </Pressable>
      </SafeAreaView>
      <Pressable onPress={() => router.back()} style={commonStyles.button}>
        <Text style={commonStyles.buttonText}>Exit</Text>
      </Pressable>
    </View>
  );
}
