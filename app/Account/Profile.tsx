import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, SafeAreaView, Pressable, Dimensions, PixelRatio, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from '../Contexts/ThemeContext';    // Import the ThemeContext
import Index from '../(tabs)';
import { supabase } from '../../storage/supabase';
import { useAuth } from '../Contexts/LoginContext';
import { CommonStyles } from '../CommonStyles'; 
import SHA256 from 'crypto-js/sha256';



const width = Dimensions.get('window').width-1

export default function Profile() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);    // toggle between login and create account
  const { currentTheme } = useTheme();                    // Get the current theme from context
  const [message, setMessage] = useState('');             // to send error or success messages  
  const { login } = useAuth();
  const { user } = useAuth();
  const commonStyles = CommonStyles();

  const handleLogin = async () => {     // async so 'await' works
    setMessage('');                     // reset message

    if (isCreating) {

      if (!email || !username || !password) {
        setMessage('Please fill in all fields.');
        return;
      }

      const { data: existingUser, error: fetchError } = await supabase.from('Users')    // fetches data from 'Users' where email matches user input
        .select('email')
        .eq('email', email);   

      if (fetchError) {
        console.error(fetchError);    // logs error in console
        setMessage('Error checking for existing user.');
        return;
      }

      if (existingUser.length > 0) {    // .length because supabase returns empty array rather than null if no existing user
        setMessage('An account with this email already exists.');   
        return;
      }

      const hashedPassword = SHA256(password).toString();

      // add new user to table
      const { error: insertError } = await supabase.from('Users').insert([{ email, username, password: hashedPassword }]);

      if (insertError) {
        console.error(insertError);
        setMessage('Error creating account.');
      } else {
        setMessage('Account created successfully!');
        setIsCreating(false);                         
        setUsername('');
        setEmail('');
        setPassword('');
      }

    } else {

      // login
      if (!email || !password) {
        setMessage('Please fill in all fields.');
        return;
      }

      const { data: users, error: loginError } = await supabase.from('Users')   // select all where username equals user input
        .select('*')
        .eq('email', email);   

      if (loginError) {
        console.error(loginError);
        setMessage('An error occurred during login.');
        return;
      }

      const hashedInputPassword = SHA256(password).toString();

      if (users.length > 0 && hashedInputPassword === users[0].password) {   // must use indexing as supabase returns array
        await login(users[0]);                                    // === is strict equality (types must match aswell)
        setMessage('Logged in successfully!');                   
        router.back();
      } else {
        setMessage('Incorrect username or password.')
      }
    }
  };

  return (
     <View style={commonStyles.overlay}>
       
         {/* Header above modal */}
         <Text style={commonStyles.header}>Profile</Text>

         {/* Modal box */}
         <SafeAreaView style={[commonStyles.container,{
          height: isCreating ? 420:370,
          }]}>

           <MaterialCommunityIcons name="account" size={80} color={currentTheme.white} />
           
           {isCreating && (
             <TextInput
               style={commonStyles.input}
               placeholder="Username"
               placeholderTextColor={currentTheme.gray}
               value={username}
               onChangeText={setUsername}
             />
           )}

           <TextInput
             style={commonStyles.input}
             placeholder="Email"
             placeholderTextColor={currentTheme.gray}
             value={email}
             onChangeText={setEmail}
             keyboardType="email-address"
             autoCapitalize="none"
           />

           <TextInput
             style={commonStyles.input}
             placeholder="Password"
             placeholderTextColor={currentTheme.gray}
             value={password}
             secureTextEntry
             onChangeText={setPassword}
           />

           {message !== '' && (
              <Text style={{ color: currentTheme.lightblue, marginTop: 5 }}>
                {message}
              </Text>
           )}

           <Pressable onPress={handleLogin} style={commonStyles.button}>
             <Text style={commonStyles.buttonText}>
               {isCreating ? 'Create Account' : 'Log In'}
             </Text>
           </Pressable>

           <Pressable onPress={() => router.push('./ForgotPassword')}>
             <Text style={commonStyles.blueText}>Forgot your password?</Text>
           </Pressable>

           <Pressable onPress={() => {
            setIsCreating(!isCreating);
            setMessage('');
           }}>
             <Text style={commonStyles.blueText}>
                {isCreating ? 'Already have an account? Log In' : 'Don\'t have an account? Create one'}
             </Text>
           </Pressable>
         </SafeAreaView>

         {/* Exit button below modal */}
         <Pressable onPress={() => router.back()} style={commonStyles.button}>
            <Text style={commonStyles.buttonText}>Exit</Text>
         </Pressable>
     </View>
  );
}




  
