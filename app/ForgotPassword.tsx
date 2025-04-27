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
  const [message, setMessage] = useState('');
  const { currentTheme } = useTheme();
  const commonStyles = CommonStyles();

  const passwordReset = async () => {
    if (!email) {
      setMessage('Please enter your email.');
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
        const userPassword = user[0].password;
        Alert.alert('Your password is: ' + userPassword);
        setEmail('');
        setMessage('');
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
      <Text style={commonStyles.header}>Forgot Password</Text>

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

        {message !== '' && (
          <Text style={{ color: currentTheme.lightblue, marginTop: 5 }}>
            {message}
          </Text>
        )}

        <Pressable onPress={passwordReset} style={commonStyles.button}>
          <Text style={commonStyles.buttonText}>Get Password</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={commonStyles.button}>
          <Text style={commonStyles.buttonText}>Exit</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
