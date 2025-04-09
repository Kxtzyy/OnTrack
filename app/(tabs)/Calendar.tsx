import { View, Alert, Pressable, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Entypo } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useRouter } from "expo-router";
import Calendar from '../../components/CalendarComponent';
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101010",
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: '#101010',
    alignItems: 'center',
    // justifyContent: 'center',
  },
});


export default function Index() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      {/* Header buttons */}
            {/* This view is for the top-left pfp */}
            <View
        style={{
          width: screenWidth,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        <Pressable
          onPress={() => Alert.alert("Pfp icon pressed")}
          style={cornerButtonsStyle}
        >
          <MaterialCommunityIcons name="account" size={40} color="white" />
        </Pressable>

      {/* This view is for the top-right plus icon */}
        <Pressable
          onPress={() => router.push("/newTrackerView")}
          style={cornerButtonsStyle}
        >
          <Entypo name="plus" size={40} color="white" />
        </Pressable>
        
      </View>
      {/* Calendar component positioned below */}
      <View style={styles.calendarContainer}>
        <Calendar onSelectDate={setSelectedDate} selected={selectedDate || ""} />
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}
const cornerButtonsStyle = {
  backgroundColor: "#101010",
  width: 45,
  height: 45,
  justifyContent: "center" as const,
  alignItems: "flex-start" as const,
};