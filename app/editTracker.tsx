import { Modal, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "./ThemeContext";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconItem, isUri} from "./newTrackerView";
import { useState } from "react";
import { getImage } from "./trackerList";
import { Dimensions, PixelRatio } from "react-native";
import { View, Pressable,Image, Text , ScrollView} from "react-native";
import { Ionicons, MaterialCommunityIcons,Entypo } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { useEffect } from "react";
import { TextInput } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Keyboard } from "react-native";
import { useTrackerStore } from "@/storage/store";
import { getIconInfo } from "@/types/Misc";
import { openDatabase } from "@/storage/sqlite";
import { TimePeriod, Tracker } from "@/types/Tracker";
import {setupDatabase} from "@/components/ZustandRefresh";

// Screen dimensions and scale for responsive design
const height = Dimensions.get('window').height-1;
const width = Dimensions.get('window').width-1
const scale = PixelRatio.get(); //For exact pixel adjustments adjust according to scale

export default function editTracker(){
    /* handling of transitioning between newTrackerView and selectImage */
    const router = useRouter();
    const {trackerN,timeP, image, color} = useLocalSearchParams(); // Get parameters passed to this screen
    const timePeriod = typeof(timeP) === "string" ? timeP : "Daily"; // Default to "Daily" if time period is not provided
    const trackerName = typeof(trackerN) === "string" ? trackerN : "no_name"; // Default to "no_name" if tracker name is not provided
    const {currentTheme} = useTheme();

    /* Tracker management */
    let tracker = useTrackerStore((state) =>
      state.getTracker(trackerName, timePeriod)
    ); // Get the tracker from the store using the provided name and time period
    const addTracker = useTrackerStore((s) => s.addTrackerMemOnly); // Add tracker function from the store

    /* States */
    const timePeriods = ['Daily', 'Weekly', 'Monthly', 'Yearly']; // Available time periods
    const [currentTPIndex, setCurrentTPIndex] = useState(timePeriods.indexOf(timePeriod)); // Index of the current time period
    const [isGoal, setIsGoal] = useState(true); // Whether the tracker is a goal or a limit
    const [title, setTitle] = useState(trackerName); // Tracker title
    const [currentAmount, setCurrentAmount] = useState('0'); // Current amount for the tracker
    const [limit, setLimit] = useState('0'); // Goal or limit value
    const [selectedImage, setSelectedImage] = useState(`${image ?? ''}`); // Selected image for the tracker
    const [selectedColor, setSelectedColor] = useState(`${color ?? ''}`); // Selected color for the tracker
    const [iconSize, setIconSize] = useState(0); // Size of the tracker icon
    const [open, setOpen] = useState(false); // Dropdown open state
    const [value, setValue] = useState<string | null>(null); // Selected unit value

    /* Effects */
    // Update state when tracker changes
    useEffect(() => {
      if (!tracker) return;

      setTitle(tracker.trackerName);
      setCurrentAmount(`${tracker.currentAmount}`);
      setLimit(`${Math.abs(tracker.bound)}`);
      setIsGoal(tracker.bound > 0);
      setValue(tracker.unit || null);

      const [prefix, icon, color] = tracker.icon.split('|');
      if (prefix === 'image') {
        setSelectedImage(icon);
      } else {
        setSelectedImage(icon);
        setSelectedColor(color);
      }

      setCurrentTPIndex(timePeriods.indexOf(tracker.timePeriod));
    }, [tracker]);

      /* Units for dropdown */
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

    // Update selected image and color when parameters change
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

    // When icon is pressed (for selection)
    const handleImagePressed = () => {
        router.push({
        pathname: './selectImage',
        params: {
            selectedImage: selectedImage, // Pass current image
            selectedColor: selectedColor, // Pass selected Color
        },
    });
    }

    // Toggle between "Goal" and "Limit" on press
    const toggleGoalButton = () => {
        setIsGoal(prevState => !prevState);
    };

    const styles = StyleSheet.create({
        // Content inside overlay (background, size etc)
        container: {
          flex: 1,
          justifyContent: "flex-start",
          alignItems: "center",
          backgroundColor: currentTheme["101010"],
          borderColor: currentTheme.dimgray,
        },
          topRow: {
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 8,
          },
          cornerButton: {
            width: 45,
            height: 45,
            justifyContent: "center",
            alignItems: "center",
          },
        // Contains input fields
        inputContainer: {
          width: '90%',
          backgroundColor: currentTheme["101010"],
          borderColor: currentTheme.dimgray,
          marginBottom: 20,
          borderRadius: 5,
          borderWidth: 1,

          alignSelf: 'center',
        },
        // All input fields
        input: {
          height: 60,
          color: currentTheme["FFFFFF"],
          textAlign: "center",
          fontSize: 20,
        },

        // Dropdown styling
        dropdownContainer: {
            height: 60,
          width: '90%',
          marginBottom: 20,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: currentTheme.dimgray,
          zIndex: 1000,
          alignSelf: 'center',
          alignContent: 'center',
          justifyContent: 'center',
        },
        dropdown: {
          backgroundColor: currentTheme["101010"],
          borderColor: 'transparent',
        },
        dropdownList: {
          backgroundColor: currentTheme["101010"],
          borderColor: currentTheme.dimgray,
        },
        dropdownText: {
          color: currentTheme.white,
          textAlign: 'center',
          fontSize: 20,
        },

        tickContainerStyle: {
          marginLeft: -15,
        },
        arrowContainerStyle: {
          marginLeft: -15,
        },
        dropdownArrow: {
          width: 5*scale, //should probably adjust as no longer using screen size based rendering
          height: 5*scale,
          tintColor: currentTheme.white, //white arrow
        },
        dropdownTick: {
          width: 5*scale,
          height: 5*scale,
          tintColor: currentTheme.white, //white tick
        },

        //Contains buttons (important for row display)
        buttonsContainer: {
          height: 60,
          width: '90%',
          flexDirection: 'row',
          marginBottom: 20,
        },
        timePeriodButton: {
          height: '100%',
          flex: 1,
          backgroundColor: currentTheme.black,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: currentTheme.dimgray,

          alignItems: 'center',
          justifyContent: 'center',
        },
        goalLimitButton: {
          flex: 1,
          height: '100%',

          justifyContent: "center",
          alignItems: "center",
          backgroundColor: currentTheme.black,

          borderRadius: 5,
          borderWidth: 2,
          borderColor: currentTheme.dimgray,

          fontSize: 20,
          fontWeight: "bold",
          color: currentTheme["FFFFFF"],
        },

        // Color of goalLimit button dependent on {goal or limit}
        goalButton: {
          backgroundColor: "#06402B",
        },
        limitButton: {
          backgroundColor: "#950606",
        },

        //Text if goal or limit {otherwise buttonText}
        goalLimitText: {
          fontSize: 20,
          fontWeight: "bold",
          color: currentTheme["FFFFFF"],
        },
        buttonText:{
          fontSize: 20,
          color: "dimgray" //dull display
        },
        confirmButton:{
            borderColor: currentTheme.dimgray,
            borderRadius: 5,
            borderWidth: 1,
            width: '70%',
            height: 60,

            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            alignContent: 'center',
            backgroundColor: currentTheme.green,
        },
        confirmText:{
            color: currentTheme.white,
            fontWeight: '500',
            fontSize: 22,
            marginLeft: 5,
        }

    });

    //Cross, Icon box and tick (used in select image)
    const imageBoxStyles = StyleSheet.create({
    //For image cancellation, image and confirm tracker buttons
    imageButtonsContainer: {
        height: width*0.45,
        width: width * 0.45 + 160,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignContent: 'center',
        borderColor: currentTheme.white,
        position: 'relative',
    },
    crossButton: {
        position: 'absolute',
        left: 0,
        width: 80,
        height: '100%',

        borderRadius: 10,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderWidth: 1,
        borderColor: currentTheme.dimgray,
        borderTopColor: '#101010',
        borderBottomColor: '#860B0B',
        borderBottomWidth: 7,
        borderLeftColor: 'transparent',

        backgroundColor: '#a30a0a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        aspectRatio: 1,
        width: width * 0.45,

        borderColor: currentTheme.dimgray,
        borderWidth: 1,
        justifyContent: 'center',
        alignContent: 'center',

        alignItems: 'center',
    },
    })

    // Confirm and save tracker edits
    const handleConfirmEdit = async () => {
      if (title.trim().length < 3) return;

      const iconString = isUri(selectedImage)
        ? `image|${selectedImage}`
        : `fa5|${selectedImage}|${selectedColor}`;

      const timePeriod: TimePeriod = ['Daily','Weekly','Monthly'][currentTPIndex] as TimePeriod;
      const boundNumber: number = limit.trim() === '' ? 0 : parseFloat(limit) * (isGoal ? 1 : -1);

      try {
        const db = await openDatabase();

        await db.runAsync(
          `UPDATE trackers SET tracker_name = ?, icon = ?, time_period = ?, unit = ?, bound_amount = ?, last_modified = ?, current_amount = ? WHERE tracker_name = ? AND time_period = ?`,
          [title.trim(), iconString, timePeriod, value ?? null, boundNumber, Date.now(), currentAmount, trackerName, timePeriod]
        );

        setupDatabase();
        router.back();
      } catch (err) {
        console.error('Could not update tracker', err);
      }
    };


    // Delete tracker from database
    const handleDeleteTracker = async () => {
      try {
        const db = await openDatabase();

        await db.runAsync(
          `DELETE FROM trackers WHERE tracker_name = ? AND time_period = ?`,
          [trackerName, timePeriod]
        );

        setupDatabase();
        router.back();
      } catch (err) {
        console.error('Could not update tracker', err);
      }
    };

    // Margin for top alignment
    var marginForTop = (height - ((60/scale)*6 + (20/scale)*6 + (width)*0.45)) / 2
    marginForTop = marginForTop < 0 ? 0 : ((marginForTop/scale)/2); //give up tonight dont pmo

    return (
      <SafeAreaView
        style={[
          styles.container,
          { alignItems: 'center' },
        ]}
      >
        {/* Top row with back and delete buttons */}
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.cornerButton, { backgroundColor: currentTheme["101010"] }]}
          >
            <MaterialCommunityIcons name="keyboard-backspace" size={40} color={currentTheme.white} />
          </Pressable>
          <Pressable
            onPress={() => Alert.alert(
              "Delete this tracker?",
              "This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: handleDeleteTracker },
              ],
              { cancelable: true }
            )}
            style={[styles.cornerButton, { backgroundColor: currentTheme["101010"] }]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={40} color={currentTheme.white} />
          </Pressable>
        </View>

        {/* Tracker icon and image selection */}
        <View style={[
          imageBoxStyles.imageButtonsContainer,
          { marginTop: marginForTop },
        ]}>
          {selectedImage != "" && (
            <Pressable
              style={imageBoxStyles.crossButton}
              onPress={() => setSelectedImage("")}
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          )}
          <Pressable
            style={imageBoxStyles.icon}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setIconSize(height * 0.7);
            }}
            onPress={handleImagePressed}
          >
            {isUri(selectedImage) ? (
              <Image
                source={{ uri: selectedImage }}
                style={{
                  width: width * 0.45 - 2,
                  aspectRatio: 1,
                }}
                resizeMode="cover"
              />
            ) : selectedImage && iconSize > 0 && (
              <FontAwesome5
                name={selectedImage as any}
                color={selectedColor}
                size={iconSize}
                alignSelf="center"
                justifySelf="center"
              />
            )}
          </Pressable>
        </View>

        {/* Tracker title input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Title(*)"
            placeholderTextColor="#aaa"
            maxLength={25}
            value={title}
            returnKeyType="done"
            onChangeText={setTitle}
            onPressIn={() => setOpen(false)}
          />
        </View>

        {/* Current amount input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Current amount"
            placeholderTextColor="#aaa"
            value={currentAmount}
            returnKeyType="done"
            onChangeText={(text) => {
              const cleanedText = text.replace(/[^0-9.]/g, '');
              const decimalCount = (cleanedText.match(/\./g) || []).length;
              if (decimalCount <= 1) {
                setCurrentAmount(cleanedText);
              }
            }}
            onPressIn={() => setOpen(false)}
          />
        </View>

        {/* Goal/Limit input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { color: isGoal ? "#06402B" : "#950606" }]}
            placeholder={isGoal ? "Goal" : "Limit"}
            placeholderTextColor="#aaa"
            maxLength={10}
            keyboardType="numeric"
            returnKeyType="done"
            onPressIn={() => setOpen(false)}
            onChangeText={(text) => {
              const cleanedText = text.replace(/[^0-9.]/g, '');
              const decimalCount = (cleanedText.match(/\./g) || []).length;
              if (decimalCount <= 1) {
                setLimit(cleanedText);
              }
            }}
            value={limit}
          />
        </View>

        {/* Unit dropdown */}
        <View style={[styles.dropdownContainer, { zIndex: 10 }]}>
          <DropDownPicker
            open={open}
            value={value}
            items={units}
            setOpen={setOpen}
            onOpen={() => Keyboard.dismiss()}
            setValue={setValue}
            setItems={setUnits}
            dropDownDirection="BOTTOM"
            autoScroll={true}
            placeholder="Set Unit"
            placeholderStyle={{ color: '#aaa' }}
            style={styles.dropdown}
            dropDownContainerStyle={[styles.dropdownList, { zIndex: 1000 }]}
            textStyle={styles.dropdownText}
            arrowIconContainerStyle={styles.arrowContainerStyle}
            tickIconContainerStyle={styles.tickContainerStyle}
            arrowIconStyle={styles.dropdownArrow}
            tickIconStyle={styles.dropdownTick}
            flatListProps={{
              nestedScrollEnabled: true,
            }}
          />
        </View>

        {/* Time period and goal/limit buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable style={styles.timePeriodButton}>
            <Text style={{
              color: currentTheme["red"],
              fontSize: 20,
              fontWeight: 'bold',
            }}>
              {timePeriods[currentTPIndex]}(*)
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.goalLimitButton,
              limit.length > 0
                ? (isGoal ? styles.goalButton : styles.limitButton)
                : null,
            ]}
            onPress={toggleGoalButton}
          >
            <Text style={limit.length > 0 ? styles.goalLimitText : styles.buttonText}>
              {isGoal ? 'Goal' : 'Limit'}
            </Text>
          </Pressable>
        </View>

        {/* Confirm button */}
        {title.length > 2 && (
          <Pressable style={styles.confirmButton} onPress={handleConfirmEdit}>
            <Ionicons name="checkmark-done" size={40} color="white" />
            <Text style={styles.confirmText}> Confirm </Text>
          </Pressable>
        )}
      </SafeAreaView>
    );
}
