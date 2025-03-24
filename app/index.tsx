import { View, Alert, Pressable, Text, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons, AntDesign, Entypo } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Progress from "react-native-progress"; 
import { Dimensions } from "react-native";


// Used in square icon styling for dynamic styles - grid same for all phone sizes
const screenWidth = Dimensions.get("window").width;
const itemsPerRow = 4;
const spacing = 12;
const totalSpacing = spacing * (itemsPerRow + 1);
const sidesPadding = 16; // for grid mostly
const itemSize = (screenWidth - totalSpacing - (sidesPadding * 2)) / itemsPerRow;


export default function Index() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "#101010",
      }}
    >
      {/* This view is for the top-left pfp */}
      <View
        style={{
          position: "absolute",
          top: 50,
          left: 22,
        }}
      >
        <Pressable
          onPress={() => Alert.alert("Pfp icon pressed")}
          style={cornerButtonsStyle}
        >
          <MaterialCommunityIcons name="account" size={40} color="white" />
        </Pressable>
      </View>

      {/* This view is for the top-right calendar icon */}
      <View
        style={{
          position: "absolute",
          top: 50,
          right: 10,
        }}
      >
        <Pressable
          onPress={() => Alert.alert("Calendar icon pressed")}
          style={cornerButtonsStyle}
        >
          <Entypo name="plus" size={30} color="white" />
        </Pressable>
        
      </View>

      {/* Used as spaces so content does not cover tl and tr icons */}
      <View style = {{ height: 35}} />  

      <ScrollView
      contentContainerStyle={{
        alignItems: "center",
        paddingBottom: 50, // gives breathing room for bottom of the content , adjust as we like
      }}>
        <View style={progressStyles.progressContainer}>
          <Progress.Circle
            size={100} // Size of the circle
            progress={0.76} // 76% progress
            thickness={10} // Border thickness
            showsText={false} // We add text separately
            color="lightgreen" // Progress color
            unfilledColor="#333" // Background color
            borderWidth={0} // No border
          />
          <Text style={progressStyles.progressText}>76%</Text>
        </View>


        {/* Title text */}
        <Text
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 20,
            marginTop: 50,
          }}
        >
          Goals
        </Text>

        {/* Row of action buttons */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            // marginHorizontal: spacing / 2,
            paddingHorizontal: sidesPadding,
          }}
        >
          <Pressable
            onPress={() => Alert.alert("Sleep button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <MaterialCommunityIcons name="power-sleep" size={40} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Food button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <Ionicons name="fast-food-outline" size={40} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Calorie button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <Ionicons name="flame-outline" size={40} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Code button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <AntDesign name="codesquareo" size={30} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Plus button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <AntDesign name="plus" size={30} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Plus button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <AntDesign name="plus" size={30} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Plus button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <AntDesign name="plus" size={30} color="white" />
          </Pressable>
          
        </View>


        {/* Title text */}
        <Text
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: "bold",
            marginTop: 50,
          }}
        >
          Limits
        </Text>

        <View
        style = {{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          // marginHorizontal: spacing / 2,
          paddingHorizontal: sidesPadding,
          marginTop: 20,
        }}
        >
          <Pressable
            onPress={() => Alert.alert("Limit button alert")}
            style={squareIconButtonStyle(itemSize)}
          >
            <Ionicons name="cash-outline" size={40} color="white"/> 
          </Pressable> 

          <Pressable
            onPress={() => Alert.alert("Button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <MaterialCommunityIcons name="spoon-sugar" size={40} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <AntDesign name="dashboard" size={30} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Limit button alert")}
            style={squareIconButtonStyle(itemSize)}
          >
            <AntDesign name="instagram" size={40} color="white"/> 
          </Pressable> 

          <Pressable
            onPress={() => Alert.alert("Button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <Entypo name="area-graph" size={40} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <Entypo name="bowl" size={30} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Limit button alert")}
            style={squareIconButtonStyle(itemSize)}
          >
            <Entypo name="credit" size={40} color="white"/> 
          </Pressable> 

          <Pressable
            onPress={() => Alert.alert("Button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <Entypo name="game-controller" size={40} color="white" />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Button pressed")}
            style={squareIconButtonStyle(itemSize)}
          >
            <AntDesign name="plus" size={30} color="white" />
          </Pressable>

        </View>
      </ScrollView>
      



      
    </SafeAreaView>
  );
}

const progressStyles = {
  progressContainer: {
    alignItems: "center" as const,  // Center align
    justifyContent: "center" as const,
    position: "relative" as const,
    marginTop: 25,                  // Push it down slightly
    marginBottom: 20,                // Space before next section
  },
  progressText: {
    position: "absolute" as const,   // Overlay on top of circle
    top: 38,
    left: 29,
    fontSize: 20,                    // Readable size
    fontWeight: "bold" as const,      // Bold text
    color: "white",                   // White text color
  },
};

// Styling for square icon buttons
const squareIconButtonStyle = (size: number) => ({
  backgroundColor: "#101010",
  borderColor: "dimgray",
  padding: 12,
  borderRadius: 5,
  borderWidth: 1,
  width: size,
  height: size,
  justifyContent: "center" as const,
  alignItems: "center" as const,
  margin: spacing / 2,
});

// Styling for corner buttons
const cornerButtonsStyle = {
  backgroundColor: "#101010",
  width: 45,
  height: 45,
  justifyContent: "center" as const,
  alignItems: "flex-start" as const,
};