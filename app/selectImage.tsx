import React, { useState } from 'react';
import {TouchableOpacity, Text, StyleSheet, Pressable, View, Button, SafeAreaView, Dimensions, FlatList} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from "@expo/vector-icons";
import { PixelRatio } from 'react-native';
import { iconsToChoose } from '@/assets/images/iconsToChoose';
import { imageBoxStyles, IconItem } from './newTrackerView';
import { Ionicons } from '@expo/vector-icons';

//Visuals/function of each item
type ItemProps = { 
  item: IconItem; 
  onPress: () => void;
  backgroundColor: string;
  iconColor: string;
};

//the item to be rendered (selectable icons)
const Item = ({ item, onPress, backgroundColor, iconColor }: ItemProps) => (
  <TouchableOpacity //not pressable for visual effect
    onPress={onPress} 
    style={[
      styles.item, 
      { 
        backgroundColor,
        width: iconSize,
        height: iconSize,
      }
    ]}
  >
    {item.type === 'fa5' && ( //if fa5 render fontawesome5 : to introduce more itemtypes would have to change the way rendered
      <FontAwesome5 name={item.name as string} size={iconSize * 0.6} color={iconColor} />
    )}
  </TouchableOpacity>
);

export default function selectImage() {
  const router = useRouter(); 

  //if typematch (should be always) then use inputted image
  const params = useLocalSearchParams();
  const originalImage = typeof params.selectedImage === 'string'? params.selectedImage: ''; 
  const [selectedName, setSelectedName] = useState<string>(originalImage);

  //rendering each icon
  const renderItem = ({ item }: { item: IconItem }) => {
    const backgroundColor = item.name === selectedName ? 'white' : 'black'; // render white with black background if unselected, inverse if selected
    const iconColor = item.name === selectedName ? 'black' : 'white';
    return (
      <Item
        item={item}
        onPress={() => {
          setSelectedName(item.name)
        }}
        backgroundColor={backgroundColor}
        iconColor={iconColor}
      />
    );
  };

  const [iconSize, setIconSize] = useState(0); //icon size state (used to calculate necessary size)
    return(

      //IF YOU ARE READING THIS I KNOW ITS A LOT OF VIEWS BUT THEY ARE GENUINELY ALL IMPORTANT
      //full screen overlay
      <View style={styles.overlay}> 
          {/* 'popup' box */}
          <SafeAreaView style={styles.container}> 
              {/* all image related buttons */}
              <View style = {imageBoxStyles.imageButtonsContainer}>
                {/* Left cross button*/}
                {selectedName && ( //if selectedName '' dont render pressable
                  <Pressable 
                    style={imageBoxStyles.crossButton}
                    onPress={() => {setSelectedName('')}}
                  >
                    <Ionicons name="close" size={24} color="white" /> 
                  </Pressable>
                )}

                {/* icon display */}
                <Pressable 
                  style = {imageBoxStyles.icon}
                  onLayout={(event) => { {/* get size according to box size on layout*/}
                    const { height, } = event.nativeEvent.layout;
                    setIconSize(height * 0.7);
                  }}
                > 
                  {selectedName && iconSize > 0 && ( // if selectedName and iconSize valid then render icon
                    <FontAwesome5 
                      name={selectedName as string}
                      color="white" 
                      size = {iconSize}
                      alignSelf = 'center'
                    />
                  )}
                </Pressable>

                {/* Tick button, render if selectedimage has changed and route back with image on press*/}
                {selectedName != originalImage && (
                  <Pressable 
                  style={imageBoxStyles.tickButton}
                  onPress = {() => {
                    router.back();
                    router.setParams({ image: selectedName });
                  }}
                  >
                    <Ionicons name="checkmark" size={24} color="white" />
                  </Pressable>
                )}
              </View>

              {/* Icon selection, render selectable icons*/}
              <SafeAreaView style = {styles.iconContainer}>
                <FlatList
                  data = {iconsToChoose}
                  renderItem={renderItem}
                  keyExtractor={item => item.name}
                  extraData={selectedName}
                  numColumns={5}
                  showsVerticalScrollIndicator = {false}
                />
              </SafeAreaView>


              <View style = {styles.SelectImageContainer}>

              </View>
          </SafeAreaView>
          {/* Exit Button (placed below the content) */}
    <Pressable
      onPress={() => {router.back()}}
      style={styles.exitButton}
    >
      <Text style={styles.exitButtonText}>
        Exit
      </Text>
    </Pressable>
      </View>
        
    )
}

const width = Dimensions.get('window').width-1
const height = Dimensions.get('window').height-1
const paddingContainer = 20
const scale = PixelRatio.get(); //For exact pixel adjustments adjust according to scale
const iconContainerWidth = (width * 0.85 - paddingContainer * 2) * 0.95 - 10; // Subtract horizontal padding
const iconSize = iconContainerWidth / 5; // 5 columns (could change for small devices?)

const styles = StyleSheet.create({
  //Modal overlay itself
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // 0.8 opacity of darkness
    justifyContent: "center",

    // Stretch to fill center
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  //Entire container
  container: {
    height: height*0.8,
    width: width*0.85,
    backgroundColor: "#101010",
    paddingHorizontal: paddingContainer, // Keep horizontal padding
    borderRadius: 15, // Rounded edges
    borderWidth: 1,
    borderColor: 'dimgray',
    alignItems: "center",
    justifyContent: 'center'
  },
  //Selected icon square
  icon: {
    aspectRatio: 1,
    height: '90%',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  //Container for scrollable icon list
  iconContainer: {
    flex: 1,
    width: '95%',
    paddingHorizontal: 5,
    paddingVertical: 5,
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  //individual items in scrollable list
  item: {
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  //container for personal image selection
  SelectImageContainer: { 
    height: 70,
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 0,
    borderColor: 'transparent',
    borderTopColor: 'dimgray',
    alignItems: 'center',
  },

  // Exit Button (below the modal)
  exitButton: {
    marginTop: 20, // Adds some space above the button
    backgroundColor: '#101010',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'dimgray',
  },
  exitButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  

});