import { Image, View, ScrollView } from "react-native";
import { Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "./ThemeContext";
import { useTrackerStore } from "@/storage/store";
import { Tracker } from "@/types/Tracker";
import { FontAwesome5 } from "@expo/vector-icons";
import { Text } from "react-native";
import React, { useState, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { getIconInfo } from "@/types/Misc";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';

/*function to get image from input tracker*/
export const getImage = ( inputTracker: Tracker, size: number, forcedColor?: string ): { icon: JSX.Element } => {
    const { type, name, color } = getIconInfo(inputTracker.icon);
    const iconColor = forcedColor ?? color;

    if (type === "fa5") {
        return {
        icon: <FontAwesome5 name={name} size={size} color={iconColor} />
        };
    } else if (type === "image") {
        return {
        icon: (
            <Image
            style={{
                aspectRatio: 1,
                height: 60,
                width: 60,
                marginLeft: 1,
                marginTop: 1,
            }}
            source={{ uri: name }}
            />
        )
        };
    }
    return {
        icon: <FontAwesome5 name={""} size={size} color={iconColor} />
    };
};

/* function to render a pressable for an input tracker */
const renderTracker = ({ tracker, router, currentTheme }: { tracker: Tracker; router: ReturnType<typeof useRouter>; currentTheme: any;}) => {
    return (
        <TouchableOpacity
        onPress={() => router.push({ pathname: "./editTracker", params: { trackerN: tracker.trackerName, timeP: tracker.timePeriod, color: getIconInfo(tracker.icon).color, image: getIconInfo(tracker.icon).name} })}
        key = {tracker.trackerName}
        style = {[
            styles.trackerButton,
            {borderColor: 'transparent'}, 
        ]}>
            {/*icon*/}
            <View style = {[styles.iconContainer]}>
                {getImage(tracker,40).icon}
            </View>
            
            {/*text {trackername}*/}
            <Text style={[
                styles.trackerText,
                {color: currentTheme['white']}
            ]}>
                {tracker.trackerName}
            </Text>
            {/* arrow */}
            <View style = {[
                styles.iconContainer,
                {
                    marginLeft: 'auto', 
                }
            ]}>
                <FontAwesome5 name = {'caret-right'} size = {24} color = {currentTheme['dimgray']}/>
            </View>
            
            </TouchableOpacity>
    );
};

export default function trackerList(){
    const { currentTheme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams();
    

    /*trackers*/
    const trackers = useTrackerStore((state) => state.trackers);
    const trackersDaily = trackers.filter((tracker) => tracker.timePeriod === 'Daily');
    const trackersWeekly = trackers.filter((tracker) => tracker.timePeriod === 'Weekly');
    const trackersMonthly = trackers.filter((tracker) => tracker.timePeriod === 'Monthly');

    const buttons = ["Daily", "Weekly", "Monthly"]; //Time Period button states
    const [selected, setSelected] = useState("Daily");

    useEffect(() => {
        // This effect will be triggered when `trackers` updates
        console.log('Trackers updated', trackers);
    }, [trackers]); // Watch for changes in trackers
    
    return(
        <SafeAreaView 
            style = {[
                styles.safeArea,
                {backgroundColor: currentTheme['101010']}
            ]}
        >
            {/* Daily/Weekly/Monthly buttons */}
            <View style={[
                styles.buttonContainer
                ]}>
                {buttons.map((btn) => (
                <TouchableOpacity
                    key={btn}
                    style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 10,
                    
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
            <ScrollView
                style = {[
                    styles.scrollView,
                ]}>
                    {(selected === 'Daily') ? trackersDaily.map((tracker) => renderTracker({ tracker, router, currentTheme })) 
                    :((selected === 'Weekly') ? trackersWeekly.map((tracker) => renderTracker({ tracker, router, currentTheme }))
                        : trackersMonthly.map((tracker) => renderTracker({tracker, router, currentTheme}))
                    )} 
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        width: '100%',
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
    },
    scrollView: {
        width: '100%',
        flex: 1,
        flexDirection: 'column'
    },
    
    trackerButton: {
        width: '100%',
        height: 80,
        borderWidth: 1,
        alignItems: 'center',
        flexDirection: 'row',
    },
    trackerText: {
        marginLeft: 5,
      
        fontWeight: '600',
        fontSize: 20,
    },
    buttonContainer: {
        width: '100%',
        flexDirection: "row",
        alignContent: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 8,
      },
    iconContainer: {
        height: '100%',
        aspectRatio: 1,

        alignItems: 'center',
        justifyContent: 'center',
    }
})
