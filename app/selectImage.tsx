import React, { useState, useEffect, useRef } from 'react';
import {LayoutRectangle, UIManager, findNodeHandle, Modal, Image, TouchableOpacity, Text, StyleSheet, Pressable, View, Button, SafeAreaView, Dimensions, FlatList} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from "@expo/vector-icons";
import { PixelRatio } from 'react-native';
import { iconsToChoose } from '@/assets/images/iconsToChoose';
import { IconItem, isUri } from './newTrackerView';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ColorPicker, { Panel1, Preview, HueSlider, Swatches } from 'reanimated-color-picker';
import { runOnJS } from 'react-native-reanimated';
import { useTheme } from './Contexts/ThemeContext';

/*Color selection functions*/

//Format of colors (only hex used as of right now, can probably get rid of others)
type ColorFormatsObject = { 
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  opacity: number;
};

//Function to check if hex color
export const isHexColor = (color: string): boolean => {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
};

//Visuals/function of each item
type ItemProps = { 
  item: IconItem; 
  onPress: () => void;
  backgroundColor: string;
  iconColor: string;
};

//the item to be rendered (selectable icons)
const Item = ({ item, onPress, backgroundColor, iconColor }: ItemProps) => (
  <TouchableOpacity //For visual effect
    onPress={onPress} 
    style={[
      itemStyle.item, 
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
  /* states */
  const { currentTheme } = useTheme(); //npx current theme (dark/light) from context
  const [selectedName, setSelectedName] = useState<string>(''); //icon selected
  const [selectedImageUri, setSelectedImageUri] = useState<string>(''); //custom photo selected
  const [prevColor, setPrevColor] = useState<string>(currentTheme["FFFFFF"]) //stores color on opening color selector
  const [selectedColor, setSelectedColor] = useState<string>(currentTheme["FFFFFF"]); //color selected (default white)
  const [iconPosition, setIconPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); //icon position (used to set color picker popup)
  const iconRef = useRef<View>(null); //reference to icon for positioning
  const [showModal, setShowModal] = useState(false);
  const [iconSize, setIconSize] = useState(0); //icon size state (used to calculate necessary icon size)
  
  
  /* select color based functions */
  //Handle selected color
  const onSelectColor = (color: ColorFormatsObject) => {
    setSelectedColor(color.hex);
  };

  //Initial handling, onComplete called in UI thread, need to run JS function
  const onSelectColorWorklet = (color: unknown) => {
    'worklet';
    runOnJS(onSelectColor)(color as ColorFormatsObject);
  };

  //Locate pos of icon
  const measureIcon = () => {
    iconRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setIconPosition({x: pageX, y: pageY})
    });
  };

  /* handling of transitioning between newTrackerView and selectImage */
  const router = useRouter(); 
  const params = useLocalSearchParams();
  //if typematch (should be always) then use inputted image

  const originalImage = typeof params.selectedImage === 'string' ? params.selectedImage : '';
  useEffect(() => {
    if (isUri(originalImage)) {
      setSelectedImageUri(originalImage);
    } else {
      setSelectedName(originalImage);
    }
  }, [originalImage]);

  //if selectedColor is hexcode then set originalColor
  console.log("Selected Color going into select image: "+params.selectedColor);
  const originalColor = typeof params.selectedColor === 'string' && isHexColor(params.selectedColor)
  ? params.selectedColor
  : currentTheme["101010"]; // Use the theme's background color as fallback

  useEffect(() => { //set selected color to original when original changes
    setSelectedColor(originalColor);
  }, [originalColor]);

  useEffect(() => { //set selected color to original when original changes
    if (selectedColor.length > 7){ //bug with swatches adds ff at end, force to 7 length
      setSelectedColor(selectedColor.slice(0, 7));
    }
  }, [selectedColor]);
  
  //rendering each icon
  const renderItem = ({ item }: { item: IconItem }) => {
    const isSelected = item.name === selectedName;
    const backgroundColor = isSelected ? currentTheme.white : currentTheme["101010"]; // Ensure proper contrast
    const iconColor = isSelected ? currentTheme["101010"] : currentTheme.white; // Ensure proper contrast
  
    return (
      <Item
        item={item}
        onPress={() => {
          setSelectedName(item.name);
          setSelectedImageUri('');
        }}
        backgroundColor={backgroundColor}
        iconColor={iconColor}
      />
    );
  };

//Cross, Icon box and tick (used in select image)
 const imageBoxStyles = StyleSheet.create({
  //For image cancellation, image and confirm tracker buttons
  imageButtonsContainer: {
    height: 100,
    width: 220,
    marginVertical: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
    borderColor: currentTheme.white,
    position: 'relative',
  },

  tickButton: {
    position: 'absolute',
    right: 0,

    width: 60,
    height: '100%',
    borderRadius: 10,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: currentTheme.dimgray,
    borderRightColor: 'transparent',
    borderTopColor: currentTheme["101010"],
    borderBottomColor: currentTheme["094F23"],
    borderBottomWidth: 7,

    backgroundColor: currentTheme["075F28"],
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossButton: {
    position: 'absolute',
    left: 0,
    width: 60,
    height: '100%',

    borderRadius: 10,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: currentTheme.dimgray,
    borderTopColor: currentTheme["101010"],
    borderBottomColor: currentTheme["860B0B"], 
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',

    backgroundColor: currentTheme["a30a0a"],
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 100,
    height: '100%',
    borderColor: currentTheme.dimgray,
    borderWidth: 1,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
})

const styles = StyleSheet.create({
  //Modal overlay itself
  overlay: {
    flex: 1,
    backgroundColor: currentTheme["rgba(0, 0, 0, 0.8)"], // 0.8 opacity of darkness
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
    backgroundColor: currentTheme["101010"],
    paddingHorizontal: paddingContainer, // Keep horizontal padding
    borderRadius: 15, // Rounded edges
    borderWidth: 1,
    borderColor: currentTheme.dimgray,
    alignItems: "center",
    justifyContent: 'center'
  },
  //Selected icon square
  icon: {
    aspectRatio: 1,
    height: '90%',
    borderColor: currentTheme["FFFFFF"],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    color: currentTheme.white,
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
    borderTopWidth: 1,
    borderTopColor: currentTheme.dimgray,
    
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
    borderWidth: 1,
    borderRadius: 0,
    borderColor: 'transparent',
    borderTopColor: currentTheme.dimgray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectImageButton: {
    height: '85%',
    width: '95%',

    borderWidth: 2,
    borderRadius: 10,
    borderColor: currentTheme.dimgray,
    backgroundColor: 'transparent',

    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  // Exit Button (below the modal)
  exitButton: {
    marginTop: 20, // Adds some space above the button
    backgroundColor: currentTheme["101010"],
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: currentTheme.dimgray,
  },
  exitButtonText: {
    fontSize: 18,
    color: currentTheme.white,
    fontWeight: 'bold',
  },

  //ColorPicker Buttons
  colorPickerButtons: {
    width: 200,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',

    borderColor: 'black',
    borderRadius: 5,
    borderWidth: 2,
  }

  
});

console.log("selected color repeated: "+selectedColor);



    return(
      //full screen overlay
      <View style={styles.overlay}> 
          {/* 'popup' box */}
          <SafeAreaView style={styles.container}> 
              {/* all image related buttons */}
              <View style = {imageBoxStyles.imageButtonsContainer}>
                {/* Left cross button*/}
                {(selectedName || selectedImageUri ) && ( //if selectedName '' dont render pressable
                  <Pressable 
                    style={imageBoxStyles.crossButton}
                    onPress={() => {
                      setSelectedName('')
                      setSelectedImageUri('')
                    }}
                  >
                    <Ionicons name="close" size={24} color={currentTheme.white} /> 
                  </Pressable>
                )}

                {/* Display of icon (pressed reveals colour selection) */}
                <Pressable 
                  ref={iconRef}
                  onPress={() => {
                    measureIcon();
                    setShowModal(true);
                    setPrevColor(selectedColor);
                  }}
                  style = {imageBoxStyles.icon}
                  onLayout={(event) => { {/* get size according to box size on layout*/}
                    const { height } = event.nativeEvent.layout;
                    setIconSize(height * 0.7); //size of icon
                  }}
                > 
                  {(selectedImageUri && iconSize > 0) ? (  //Render image if exists otherwise carry on to icon
                  <Image
                    source={{ uri: selectedImageUri }}
                    style={{
                      width: 98,
                      aspectRatio: 1,
                    }}
                    resizeMode="cover"
                  />
                  ) :
                  selectedName && iconSize > 0 && ( // if selectedName and iconSize valid then render icon
                    <FontAwesome5 
                      name={selectedName as string}
                      color={selectedColor}
                      size = {iconSize}
                      alignSelf = 'center'
                    />
                  )}
                </Pressable>

                {/* Tick button, render if selectedimage not originalImage in any way and route back with image on press*/}
                {(
                  (originalImage === '' && (selectedImageUri !== '' || selectedName !== '')) || 
                  (originalImage !== '' && selectedImageUri !== originalImage && selectedName !== originalImage) ||
                  (originalImage !== '' && !isUri(originalImage) && (selectedColor != originalColor)) //colour changed (not relevant in non-icons)
                ) && (
                  <Pressable 
                  style={imageBoxStyles.tickButton}
                  onPress = {() => {
                    router.back();
                    //return either image uri or icon name, as well as color
                    router.setParams({color: selectedColor});
                    selectedImageUri ? router.setParams({ image: selectedImageUri }) : router.setParams({ image: selectedName });
                  }}
                  >
                    <Ionicons name="checkmark" size={24} color={currentTheme.white} />
                  </Pressable>
                )}
              </View>

              {/* Modal for picker popup */}
              <Modal visible={showModal} animationType="fade" transparent>
                <View style={{ flex: 1 }}>
                  {/* Background layer */}
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => {
                      setShowModal(false)
                      setSelectedColor(prevColor)
                      }
                    }
                  />

                  {/*Actual picker popup */}
                  <View
                    style={{
                      position: 'absolute',
                      top: iconPosition.y + 100 + 7, // + {icon size} + {5} offset
                      left: iconPosition.x + 50 - 100 - 15, // + {half icon size} - {picker size} - {padding} (might be off center?)
                      backgroundColor: currentTheme['101010'],
                      padding: 10,
                      borderRadius: 8,
                      borderColor: currentTheme['dimgray'],
                      borderWidth: 2,
                    }}
                    pointerEvents="auto" //blocks touch (dont exit on colour press)
                  >
                    <ColorPicker
                      style={{ 
                        width: 200, 
                        height: 200,
      
                      }}
                      value={selectedColor}
                      onComplete={onSelectColorWorklet}
                    >
                      <Preview 
                      hideInitialColor = {true}
                      />
                      <Panel1 /> 
                      <HueSlider />
                      <Swatches
                      style = {[{
                        marginTop: 10,
                        flexWrap: 'wrap',      // Allows wrapping to next row
                        flexDirection: 'row',  // Aligns items horizontally
                        justifyContent: 'space-evenly', // Distribute evenly
                      }]}
                      colors={['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D8BFD8',
                      '#E0BBE4', '#F7CAC9', '#F4C2C2', '#D1C6E3', '#C1D3FE', '#A8DADC',
                      '#BFD8B8', '#F5F5F5', '#D3D3D3']}
                      />
                      
                    </ColorPicker>
                    {/* 'Set Default Colourƒ' button (only white as of current for dark theme) */}
                    <Pressable
                      onPress={() => setSelectedColor(currentTheme["defaultIcon"])}
                      style={[
                        styles.colorPickerButtons,
                        { 
                          backgroundColor: currentTheme.white,
                          marginTop: 200 //for some reason need margin, height of hue slider = 50 + leighweight
                        }
                      ]}
                    >
                      <Text
                      style = {{
                        color: currentTheme.black,
                        fontWeight: 'bold',
                      }}>
                        Default
                      </Text>
                    </Pressable>
                    {/* Confirm button */}
                    <Pressable
                      onPress={() => setShowModal(false)}
                      style={[
                        styles.colorPickerButtons,
                        { backgroundColor: 'green' }
                      ]}
                    >
                      <Text
                      style = {{
                        color: currentTheme.black,
                        fontWeight: 'bold',
                      }}>
                        Confirm
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>

              {/* Icon selection list, render selectable icons*/}
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

              {/*personal image selection (someone can fix styling if they don't like it) */}
              <View style = {styles.SelectImageContainer}>
                <TouchableOpacity 
                style = {styles.selectImageButton}

                onPress={async () => { //Press function to get the image
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    alert('Permissions were declined');
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: 'images' as const,
                    allowsEditing: true,
                    quality: 1,
                  });
                  if (!result.canceled) { //If result successful
                    const selectedUri = result.assets[0].uri;
                    setSelectedImageUri(selectedUri); //save Uri
                    setSelectedName(''); //blank selected icon
                  }
                }}
                >
                  <MaterialCommunityIcons
                    name = 'file-image-plus-outline'
                    color = {currentTheme.dimgray}
                    size = {30}
                    style ={{
                      marginRight: 5
                    }}
                  />
                  <Text
                    style = {{
                      color: currentTheme.dimgray,
                      fontSize: 24,
                      fontStyle: 'italic',
                      fontWeight: '400',
                    }}
                  >
                    Custom Image
                  </Text>
                </TouchableOpacity>
              </View>
          </SafeAreaView>
          {/* Cancel Button (placed below the content) */}
    <Pressable
      onPress={() => {router.back()}}
      style={styles.exitButton}
    >
      <Text style={styles.exitButtonText}>
        Cancel
      </Text>
    </Pressable>
      </View>
        
    )
}

const width = Dimensions.get('window').width-1
const height = Dimensions.get('window').height-1
const paddingContainer = 20

const iconContainerWidth = (width * 0.85 - paddingContainer * 2) * 0.95 - 10; // Subtract horizontal padding
const iconSize = iconContainerWidth / 5; // 5 columns (could change for small devices?)

const itemStyle = StyleSheet.create({
 
  //individual items in scrollable list
  item: {
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  
});