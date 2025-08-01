/*
Calendar Screen
- Displays a calendar strip (daily / weekly / monthly
- Displays a list of user sections and trackers and shows progress
- Live data comes from Zustand stores, past data is fetched from SQLite
*/

import { View, Pressable, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Entypo } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import Calendar from "../../components/CalendarComponent";
import { CalendarProps } from "../../components/CalendarComponent";
import { Dimensions } from "react-native";
import moment from "moment";
import { useTheme } from "../Contexts/ThemeContext"; // Import ThemeContext
import { useSectionStore, useTrackerStore } from "@/storage/store"; 
import { getImage } from "../Settings/trackerList"; 
import { getIconInfo } from "@/types/Misc"; 
import { useAuth } from "../Contexts/LoginContext";
import { openDatabase } from "@/storage/sqlite";

// Configures so that Monday is first day of the week
moment.updateLocale('en', {
    week: { dow: 1, 
    },
  });

// Converts a hex colour to rgba string (Red, Green, Blue, alpha)
const hexToRgba = (hex: string, alpha: number): string => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };

// Device width for dynamic screen layout
const screenWidth = Dimensions.get("window").width;

export default function Index() {

    // Theme and naviagation
    const { currentTheme, isDarkMode } = useTheme(); // Access current theme
    const router = useRouter();

    // Calendar Mode
    type CalendarMode = CalendarProps["mode"];
    const buttons: CalendarMode[] = ["Daily", "Weekly", "Monthly"];
    const [selected, setSelected] = useState<CalendarMode>("Daily");

    // Selected Date
    const [selectedDate, setSelectedDate] = useState<string>(moment().format("YYYY-MM-DD"));
    const [nameCurrentBound, setNameCurrentBound] = useState<{name: String,current: number, bound: number}[] | undefined>(undefined);

    useEffect(() => {
        setNameCurrentBound(undefined);
    },[selected])
    useEffect(() => {
        console.log("CURRENT DATE: "+selectedDate)
        const fetchData = async() => {
            if(selectedDate != moment().format("YYYY-MM-DD")){
            try{
                const db = await openDatabase();
                const nameCurrentBounds: { name: string, current: number, bound: number }[] = [];

                for (const section of sections) {
                    if (section.timePeriod === selected) {
                      for (const tracker of section.trackers) {
                        // fetch tracker_id from name (time period already unwrapped)
                        const trackerIdResult = await db.getFirstAsync(
                          `SELECT tracker_id FROM trackers WHERE tracker_name = ?`,
                          [tracker.trackerName]
                        ) as { tracker_id: number } | undefined;
              
                        if (trackerIdResult) {
                          const tracker_id = trackerIdResult.tracker_id;
              
                          // tracker_id bound_amount and goal_amount for that tracker_id
                          const results = await db.getFirstAsync(
                            `SELECT bound_amount, current_amount
                             FROM tracker_history
                             WHERE tracker_id = ? AND Date = ?`,
                            [tracker_id, selectedDate]
                          ) as {bound_amount: number, current_amount: number } | undefined;
                          if(results != undefined){
                            nameCurrentBounds.push({name : tracker.trackerName, current: results.current_amount, bound:  results.bound_amount});
                          }else{
                            nameCurrentBounds.push({name : tracker.trackerName, current: 0, bound: 0});
                          }
                        }
                      }
                    }
                  }
                  setNameCurrentBound(nameCurrentBounds);

                  
            }catch(err){console.log("error: "+err)}
        }else{
            setNameCurrentBound(undefined);
        }
    }
    fetchData();
    },[selectedDate])

    // Zustand data constants
    const trackers = useTrackerStore((state) => state.trackers);
    const sections = useSectionStore((state) => state.sectionsH);
    const addTrackerToSection = useSectionStore((state) => state.addTrackerToSection);
    const { user } = useAuth();

    // Dynamic style helper (DSH)
    const trackerWrapperStyle = (height: number) => ({
    width: screenWidth - 35,
    height: 72,
    borderRadius: 15,
    alignSelf: "center" as const,
    justifyContent: "center" as const,
    // padding: 1,
    marginBottom: 20,
    overflow: "hidden" as const,
    });

    // DSH
    const cornerButtonsStyle = {
    backgroundColor: currentTheme["101010"],
    width: 45,
    height: 45,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    };

    // DSH
    const buttonContentWrapper = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    flex: 1,
    borderRadius: 14,
    backgroundColor: "transparent",
    };

    // DSH
    const pressableTextStyle = {
    color: currentTheme.white,
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "bold" as const,
    };

    // Whenever mode is changed we reset anchor date (the middle one we navigate to)
    useEffect(() => {
    if (selected === "Daily") {
        setSelectedDate(moment().format("YYYY-MM-DD"));
    } else if (selected === "Weekly") {
        setSelectedDate(moment().startOf('isoWeek').format("YYYY-MM-DD"));
    } else if (selected === "Monthly") {
        setSelectedDate(moment().startOf("month").format("YYYY-MM-DD"));
    }
    }, [selected]);

    // Dynamic and static rendering
    return (
    //whole screen
    <SafeAreaView style={[
      styles.safeArea, { 
      backgroundColor: currentTheme["101010"],
     }]}>
      <View
      style = {[{
        minHeight: '100%',
        backgroundColor: currentTheme['101010'],
      }]}>

        <StatusBar style="light" />
        {/* Header buttons */}
        {/* Top view row */}
        <View style={[
            {
            backgroundColor: currentTheme['101010'],
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            width: '100%',
            alignContent: 'center',
            flexDirection: 'row',
            //paddingTop: insets.top,
            zIndex: 1,
            //borderColor: 'white'
            }
        ]}>
            <Pressable
            onPress={() => {if (user === null){
                router.push("../Account/Profile")} 
            else{
                router.push("../Contexts/userLoggedIn")
            }
            }}
            style={[ { backgroundColor: currentTheme["101010"], height: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }]}
            >
            <MaterialCommunityIcons name="account" size={40} color={currentTheme.white} />
            </Pressable>
            <View
            style = {[
                {
                flex: 1,
                height: '100%',
                flexDirection: 'row'
                }
            ]}
            >
            {buttons.map((btn) => (
            <TouchableOpacity
                key={btn}
                style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 0,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: "transparent", // Always transparent
                }}
                onPress={() => setSelected(btn)}
            >
                <Text
                style={{
                    color: selected === btn ? currentTheme.white : currentTheme.gray,
                    fontWeight: selected === btn ? "bold" : "500",
                    fontSize: selected === btn ? 15.1 : 15,
                }}
                >
                {btn}
                </Text>
            </TouchableOpacity>
            ))}
            </View>
            <Pressable
            onPress={() => router.push("../newTrackerView")}
            style={[ { backgroundColor: currentTheme["101010"], height: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }]}
            >
            <Entypo name="plus" size={40} color={currentTheme.white} />
            </Pressable>
        </View>

        {/* Calendar horizontal scroll */}
        <View
        style = {[{
            height: 80,
            paddingTop: 5,
            alignItems: 'center',
            alignContent: 'center',
            justifyContent: 'center',
        }]}>
        <Calendar onSelectDate={setSelectedDate} selected={selectedDate || ""} mode={selected} />
        </View>

        {/* Dynamic sections with their trackers added */}
        <ScrollView 
        contentContainerStyle={{ paddingBottom: 50 }}
        style = {[{
            height: '80%',
        }]}
        >
        {sections
            // Only show the time frame sections and trackers and no empty sections
            .filter((s) => s.timePeriod === selected && s.trackers.length > 0)
            .sort((a, b) => a.position - b.position)
            .map((section) => (
            <View
                key={`${section.sectionTitle}-${section.timePeriod}`}
                style={{ width: screenWidth - 35, alignSelf: "center", marginBottom: 28 }}
            >
                {/* Section title */}
                <Text
                style={{
                    color: currentTheme.white,
                    fontSize: 18,
                    fontWeight: "bold",
                    marginBottom: 10,
                    marginLeft: 4,
                }}
                >
                {section.sectionTitle}
                </Text>

                {/* Trackers inside the section */}
                {section.trackers.map((tracker) => {
                const iconName = getIconInfo(tracker.icon).name;
                const color = getIconInfo(tracker.icon).color;
                const defaultColor : boolean = color === '#FFFFFF' || color === '#000000' || color == 'white' || color == 'black' || color === '#ffffff';
                const emptyBackgroundColor = hexToRgba(
                    defaultColor //default color
                    ? (isDarkMode
                      ? '#FFFFFF' //dark mode (fill with white)
                      : '#000000') //light mode (fill with black)
                    : color //not default color
                    , 0.15);
                const fillBackgroundColor = hexToRgba(
                    defaultColor
                    ? (isDarkMode
                      ? '#FFFFFF'
                      : '#000000')
                    : color 
                    , 
                    (!isDarkMode && defaultColor) ? 0.2 : 0.5);
                //get current nameCurrentBound info
                let ncm = 
                    nameCurrentBound ?  // if nameCurrentBound is valid
                    (nameCurrentBound.find((ncm) => ncm.name === tracker.trackerName) // find with explicit return
                    ) as {name: string, current: number, bound: number} 
                    : {name: tracker.trackerName, current: 0, bound: 0};
                ncm = ncm === undefined  ? {name: tracker.trackerName, current: 0, bound: 0} : ncm;
                const bound = 
                (selected === "Daily") ? (selectedDate === moment().format('YYYY-MM-DD') ? (tracker.bound ?? 0) : (ncm.bound))
                : (selected === 'Weekly') ?(selectedDate === moment().startOf('isoWeek').format('YYYY-MM-DD') ? (tracker.bound ?? 0) : (ncm.bound))
                : (selectedDate === moment().startOf('month').format('YYYY-MM-DD') ? (tracker.bound ?? 0) : (ncm.bound)); //bound is got form currentBound if not the current date
                const current = 
                (selected === "Daily") ? (selectedDate === moment().format('YYYY-MM-DD') ? (tracker.currentAmount ?? 0) : (ncm.current))
                : (selected === 'Weekly') ?(selectedDate === moment().startOf('isoWeek').format('YYYY-MM-DD') ? (tracker.currentAmount ?? 0) : (ncm.current))
                : (selectedDate === moment().startOf('month').format('YYYY-MM-DD') ? (tracker.currentAmount ?? 0) : (ncm.current)); //bound is got form currentBound if not the current date

                const currentProgress = (bound !== 0? Math.min(1, current / Math.abs(bound)) : 0) ;

                

                // Render Trackers, Sections and Progress
                return (
                    <View
                    key={`${tracker.trackerName}-${tracker.timePeriod}`}
                    style={[trackerWrapperStyle(60), { backgroundColor: emptyBackgroundColor }]}
                    >
                        <View style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${currentProgress * 100}%`, backgroundColor: fillBackgroundColor }} />

                    <Pressable
                        onPress={() =>{
                        if (selectedDate === moment().format('YYYY-MM-DD')){
                        router.push({
                            pathname: "/editTracker",
                            params: {
                            trackerN: tracker.trackerName,
                            timeP: tracker.timePeriod,
                            color: defaultColor //default color
                            ? (isDarkMode
                            ? '#FFFFFF' //dark mode (fill with white)
                            : '#000000') //light mode (fill with black)
                            : color, //not default color,
                            image: iconName,
                            },
                        })
                        }
                    }
                        }

                        style={buttonContentWrapper}
                    >
                        {
                        // Safe icon render, had problem with string from getImage
                        typeof getImage(tracker, 30, currentTheme.white).icon === "string"
                            ? <MaterialCommunityIcons name="image" size={30} color={currentTheme.white} />
                            : getImage(tracker, 30, currentTheme.white).icon
                        }
                        <Text style={pressableTextStyle}>{tracker.trackerName}</Text>
                        <Text style ={[{
                            position: 'absolute',
                            right: 0,
                            marginRight: 15,
                            fontSize: 18,
                            fontWeight: '100',
                            color: currentTheme['white'],
                        }]}>
                            {((selected === "Daily")
                            ? (selectedDate === moment().format('YYYY-MM-DD') ? (tracker.currentAmount ?? 0) : (ncm.current != 0 ? ncm.current : ""))
                            : (selected === 'Weekly')
                                ? (selectedDate === moment().startOf('isoWeek').format('YYYY-MM-DD') ? (tracker.currentAmount ?? 0) : (ncm.current != 0 ? ncm.current : ""))
                                : (selectedDate === moment().startOf('month').format('YYYY-MM-DD') ? (tracker.currentAmount ?? 0) : (ncm.current != 0 ? ncm.current : ""))
                            )}

                            {((selected === "Daily")
                            ? (selectedDate === moment().format('YYYY-MM-DD') ? (tracker.bound ?? 0) : ncm.bound)
                            : (selected === 'Weekly')
                                ? (selectedDate === moment().startOf('isoWeek').format('YYYY-MM-DD') ? (tracker.bound ?? 0) : ncm.bound)
                                : (selectedDate === moment().startOf('month').format('YYYY-MM-DD') ? (tracker.bound ?? 0) : ncm.bound)
                            ) != 0 && (
                            <>
                                {" / "}
                                {((selected === "Daily")
                                ? (selectedDate === moment().format('YYYY-MM-DD') ? (Math.abs(tracker.bound) ?? 0) : Math.abs(ncm.bound))
                                : (selected === 'Weekly')
                                    ? (selectedDate === moment().startOf('isoWeek').format('YYYY-MM-DD') ? (Math.abs(tracker.bound) ?? 0) : Math.abs(ncm.bound))
                                    : (selectedDate === moment().startOf('month').format('YYYY-MM-DD') ? (Math.abs(tracker.bound) ?? 0) : Math.abs(ncm.bound))
                                )}
                            </>
                            )}

                            
                        </Text>
                    </Pressable>
                    </View>
                );
                })}
            </View>
            ))}
        </ScrollView>
        </View>
    </SafeAreaView>
    );
}

// Stylesheet for static styles only
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
      },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  text: {
    fontWeight: "500",
    color: "white",
  },
});
