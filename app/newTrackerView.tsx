import React, { useEffect, useState, useCallback } from 'react';
import { Keyboard, Text, StyleSheet, Pressable, View, Button, SafeAreaView, Image, TextInput, Dimensions} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { PixelRatio } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeContext';

import { openDatabase } from '@/storage/sqlite';
import { useTrackerStore } from '@/storage/store';
import { Tracker, TimePeriod } from '@/types/Tracker';
import { CommonStyles } from './CommonStyles';

import { Alert } from 'react-native';


//check if string is a uri (image)
export const isUri = (value: string): boolean => {
  return (
    typeof value === 'string' &&
    (value.startsWith('http') || value.startsWith('file://') || value.startsWith('data:image/'))
  );
};

//iconsToChoose data type
export type IconItem = { 
  name: string;
  type: string; //what icon is a part of (fa5 as of right now, no further implementation yet)
};

export default function newTrackerView() {
  const router = useRouter();
  const { image, color } = useLocalSearchParams(); // receives updated params from selectImage
  const { currentTheme } = useTheme(); // Get the current theme from context
  const commonStyles = CommonStyles();

  const addTracker = useTrackerStore((s) => s.addTracker);

  /*states*/
  //input states
  const timePeriods = ['Daily','Weekly','Monthly',]
  const [currentTPIndex, setCurrentTPIndex] = useState(0); //TimePeriod button
  const [isGoal, setIsGoal] = useState(true); 
  const [title, setTitle] = useState(''); 
  const [limit, setLimit] = useState('');

  //image adjustment states
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState('#ffffff')
  const [iconSize, setIconSize] = useState(0);

  // Dropdown states
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
    const [units, setUnits] = useState([
      { label: "NONE", value: ""},
      { label: "Kilograms", value: "kg" },
      { label: "Pounds", value: "lb" },
      { label: "Grams", value: "g" },
      { label: "Ounces", value: "oz" },
      { label: "Liters", value: "l" },
      { label: "Milliliters", value: "ml" },
      { label: "Gallons", value: "gal" },
      { label: "Cups", value: "cup" },
      { label: "Tablespoons", value: "tbsp" },
      { label: "Teaspoons", value: "tsp" },
      { label: "Meters", value: "m" },
      { label: "Centimeters", value: "cm" },
      { label: "Millimeters", value: "mm" },
      { label: "Inches", value: "in" },
      { label: "Feet", value: "ft" },
      { label: "Yards", value: "yd" },
      { label: "Miles", value: "mi" },
      { label: "Kilometers", value: "km" },
      { label: "Steps", value: "step" },
      { label: "Minutes", value: "min" },
      { label: "Hours", value: "hr" },
      { label: "Seconds", value: "sec" },
      { label: "Days", value: "day" },
      { label: "Weeks", value: "week" },
      { label: "Months", value: "month" },
      { label: "Calories", value: "kcal" },
      { label: "Kilojoules", value: "kj" },
      { label: "Heart Rate (BPM)", value: "bpm" },
    ]);


    /*Functions*/
   // When return from child, update state if image param is present
   useEffect(() => {
    if (image && typeof image === 'string') {//set selected image unless blank
      setSelectedImage(image);
    }else{
      setSelectedImage(''); 
    }

    if(color && typeof color === 'string'){
      setSelectedColor(color);
    }
  }, [image, color] );

    // Handles press on tracker icon box
    const handleImagePressed = () => {
        router.push({
        pathname: './selectImage',
        params: {
            selectedImage,
            selectedColor,
        },
        });
    };

    // Toggle between Goal and Limit states
    const toggleGoalButton = () => {
        setIsGoal(prevState => !prevState);
      };
  
  const handleConfirm = async () => {
    if (title.trim().length < 3) return;
  
    const iconString = isUri(selectedImage)
      ? `image|${selectedImage}`
      : `fa5|${selectedImage}|${selectedColor}`;
  
    const timePeriod: TimePeriod = ['Daily','Weekly','Monthly','Yearly'][currentTPIndex] as TimePeriod;
    const boundNumber: number = limit.trim() === '' ? 0 : parseFloat(limit) * (isGoal ? 1 : -1);
  
    const newTracker = new Tracker(
      title.trim(),
      iconString,
      timePeriod,
      Date.now(),
      boundNumber,
      value ?? ''
    );
  
    try {
      await addTracker(newTracker); // Zustand + SQLite combined
      router.back(); // Close modal/view
    } catch (err) {
      console.error('Tracker could not save:', err);
      Alert.alert("Error", "Tracker could not be saved.");
    }
  };
  
  //View itself
  return (
    <View style={commonStyles.overlay}>

      {/* Text Above Popup */}
      <Text style={commonStyles.header}>Create Tracker</Text>
      
      <SafeAreaView style={commonStyles.trackerViewContainer}>
        <View style = {commonStyles.imageButtonsContainer}>

        {/* Left cross button (render if image)*/}
        {selectedImage != "" && (
        <Pressable
          style={commonStyles.crossButton}
          onPress={() => setSelectedImage("")}
        >
          <Ionicons name="close" size={24} color="white" />
        </Pressable>
        )}

        {/* Tracker Icon Option */}
        <Pressable 
          style = {commonStyles.icon}
          onLayout={(event) => {
            const { height, } = event.nativeEvent.layout;
            setIconSize(height * 0.7);
          }}

          onPress={() => handleImagePressed()}
        > 
        {isUri(selectedImage) ? ( //use image if imageUri
          <Image
          source={{ uri: selectedImage }}
          style={{
            width: 98,
            aspectRatio: 1,
          }}
          resizeMode="cover"
        />
        ) : selectedImage && iconSize > 0 && ( //otherwise if valid use icon
          <FontAwesome5 
              name={selectedImage as any}
              color = {selectedColor} 
              size = {iconSize}
              alignSelf = 'center'
              justifySelf = 'center'
            />
        )}
        </Pressable>

        {/* Right tick button */}
        {title.length > 2 && (
            <Pressable style={commonStyles.tickButton} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={24} color="white" />
            </Pressable>
          )}
        </View>


        {/* Tracker Title */}
        <View style={commonStyles.inputContainer}>
          <TextInput
            style={commonStyles.trackerViewInput}
            placeholder="Title(*)"
            placeholderTextColor="#aaa"
            maxLength={25} //titles should be brief
            value = {title}
            returnKeyType = "done"
            onChangeText={setTitle}
            onPressIn={() => setOpen(false)} //close dropdown
          />
        </View>

        {/* Limit/Goal of Tracker (OPTIONAL) */}
        <View style={commonStyles.inputContainer}>
        <TextInput
          style={[commonStyles.trackerViewInput, {color: isGoal ? "#06402B" : "#950606"}]} //if goal text red otherwise green
          
          placeholder = {isGoal ? "Goal" : "Limit"}
          placeholderTextColor="#aaa"
          maxLength={10}
          keyboardType="numeric" 
          returnKeyType = "done" 
          onPressIn={() => setOpen(false)} //close dropdown
          onChangeText={(text) => {
            //only allow numbers and a single decimal point 
            const cleanedText = text.replace(/[^0-9.]/g, '');
            const decimalCount = (cleanedText.match(/\./g) || []).length;
            if (decimalCount <= 1) {
              setLimit(cleanedText);
            }
          }}
          value={limit}
        />
        </View>

      
        {/* Unit Dropdown <bugged for android> (OPTIONAL) */}
        <View style={commonStyles.dropdownContainer}>
          <DropDownPicker
            open={open}
            value={value}
            items={units} //List of items is the list of units
            setOpen = {setOpen}
            onOpen={() => Keyboard.dismiss()}
            setValue={setValue}
            setItems={setUnits}
            autoScroll = {true}
            placeholder="Set Unit"
            placeholderStyle={{color: '#aaa'}}
            style={commonStyles.dropdown}
            dropDownContainerStyle={commonStyles.dropdownList}
            textStyle={commonStyles.buttonText}                           //if proportions wrong add dropdown text to common styles
            arrowIconContainerStyle = {commonStyles.arrowContainerStyle}
            tickIconContainerStyle = {commonStyles.tickContainerStyle}
            arrowIconStyle = {commonStyles.dropdownArrow}
            tickIconStyle = {commonStyles.dropdownTick}
          />
        </View>
      {/*View with time period + goal/limit buttons in*/}
      <View style = {commonStyles.buttonsContainer}>

      {/* Time period pressable (cycles through time periods) */}
        <Pressable
          style = {commonStyles.timePeriodButton}
          onPress={() => (setCurrentTPIndex((currentTPIndex + 1) % timePeriods.length))}
        >
          <Text style = {{
            color: currentTheme["FFFFFF"],
            fontSize: 20,
            fontWeight: 'bold',
          }}>
            {timePeriods[currentTPIndex]}(*)
          </Text>
        </Pressable>

        {/* Button to toggle between Goal and Limit */}
        <Pressable
          style={[
            commonStyles.goalLimitButton,
            limit.length > 0 
            ? (isGoal ? commonStyles.goalButton : commonStyles.limitButton) //if {goal} then goal style else limit style
            : null, 
          ]}
          onPress={
            toggleGoalButton
          }
        >
          <Text style={limit.length > 0 ? commonStyles.goalLimitText : commonStyles.dimgrayText}> 
            {isGoal ? 'Goal' : 'Limit'}
          </Text>
        </Pressable>
      </View>
      </SafeAreaView>
      
      {/* Exit Button (placed below the content) */}
      <Pressable
       onPress={() => {open ? null : router.back()}}
       style={open ? commonStyles.exitButtonInvisible : commonStyles.button} //if dropdown open invisible
      >
        <Text style={open ? commonStyles.exitButtonTextInvisible : commonStyles.buttonText}>
          Exit
        </Text>
      </Pressable>
    </View>
  );
}

const width = Dimensions.get('window').width-1
//const height = Dimensions.get('window').height-1
const scale = PixelRatio.get(); //For exact pixel adjustments adjust according to scale
 
