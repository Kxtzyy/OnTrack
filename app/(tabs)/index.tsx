/*
//This page defines the home page, as well as it's functionality.
- This is the main page in which tracker data is shown and adjusted
*/

import { Animated, PanResponder, View, Alert, Pressable, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Dimensions } from "react-native";
import { MaterialCommunityIcons, AntDesign, Entypo, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Progress from "react-native-progress";
import { useTheme } from "../ThemeContext"; // Import the ThemeContext
import { useEffect, useState, useRef, useMemo } from "react";
import { Section } from "@/types/Section";
import { useTrackerStore } from "@/storage/store"; // Import the Zustand store
import { getImage } from "../trackerList"; // Import the getImage function
import { CalendarProps } from "../../components/CalendarComponent";
import NewSectionModal from "@/components/SectionModal";
import { getIconInfo } from "@/types/Misc";
import { useSectionStore } from "@/storage/store";
import { useAuth } from '@/app/LoginContext';

// Helper function (same as one in Calendar.tsx)
const hexToRgba = (hex: string, alpha: number): string => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
};


// Screen constants
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

// Used in square icon styling for dynamic styles - grid same for all phone sizes
const itemsPerRow = 4;
const spacing = 12;
const totalSpacing = spacing * (itemsPerRow + 1);
const sidesPadding = 16;
const itemSize = (screenWidth - totalSpacing - sidesPadding * 2) / itemsPerRow;
const tabs = 120;
const marginBetweenSections = 15;

export default function Index() {
  const router = useRouter();
  const { currentTheme } = useTheme(); // Get the current theme from context
  
  // Backend structures
  const trackers = useTrackerStore((state) => state.trackers);
  let sections = useSectionStore((state) => state.sectionsH);

  const addTrackerToSection = useSectionStore((state) => state.addTrackerToSection);
  const incrementTracker = useTrackerStore(state => state.incrementTracker);
  const moveSectionBy = useSectionStore(state => state.moveSectionBy);
  const deleteSection = useSectionStore(state => state.deleteSection)
  const removeTrackerFromSection = useSectionStore(state => state.removeTrackerFromSection)

  /* States */
  // Section modal states
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [targetSection, setTargetSection] = useState<Section | null>(null);

  // Time Period States (+ mode of calendar)
  type CalendarMode = CalendarProps["mode"]; 
  const buttons: CalendarMode[] = ["Daily", "Weekly", "Monthly"];
  const [selected, setSelected] = useState<CalendarMode>("Daily");

  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [exitedEdit, setExitedEdit] = useState(false); //if just exited (fixes slight bug)
  const [movingSection, setMovingSection] = useState(false);
  const [currentMovingSectionKey, setCurrentMovingSectionKey] = useState<string | null>(null);
  
  // Heights of each section physically in pixels
  const sectionHeightsRef = useRef<number[]>([]);

  // Function to get physical height of a section given it's title
  const getSectInfo = (sectionTitle: string): {height: number} => {
    const section : Section =  sections.find((s) => s.sectionTitle === sectionTitle && s.timePeriod === selected)!
    var sectHeight : number = 56.666 + 10; //(35) {height in theory} + (10) {padding size} + 11.666 (unaccounted for in top)
    if(section){
      const rows = Math.ceil((section.trackers.length +1)/ itemsPerRow); // +1 accounts for plus button
      sectHeight += (itemSize) *(rows) +(spacing*(rows-1)); // Spacing per row added
    }
    return {height: sectHeight}
  }

  // Return thresholds (lines at which dragging a section to them causes a swap)
  const ThresholdsFunc = (centralIndex: number, heights: number[]): number[] => {
    const thresholdsToReturn = new Array(heights.length).fill(0);

    // Below section (right of centralIndex) 
    for (let i = centralIndex + 1; i <= heights.length - 1; i++) {
      thresholdsToReturn[i] = thresholdsToReturn[i - 1] + heights[i - 1] + marginBetweenSections+2;
    }
  
    // Above section (left of centralIndex)
    for (let i = centralIndex - 1; i >= 0; i--) {
      thresholdsToReturn[i] = - heights[i] + thresholdsToReturn[i + 1] - marginBetweenSections - 2;
    }
  
    // Center stays 0, can't swap with itself]
    thresholdsToReturn[centralIndex] = 0;
  
    return thresholdsToReturn;
  };

  //Edit mode refs
  const panRefs = useRef<{ [key: string]: Animated.ValueXY }>({}); // ref to all sections
  const pan = useRef(new Animated.ValueXY()).current; // ref to section being moved

  // ScrollView and scrolling refs
  const scrollRef = useRef<ScrollView>(null);  // ref to the parent ScrollView
  const scrollEnabledState = useRef(true); // whether parent scroll is currently enabled
  const scrolledRef = useRef<number>(0); // current scroll Y position
  const scrollingNumRef = useRef<number>(0); // scroll offset in this drag

  // Layout measurements
  const layoutHeightRef = useRef<number>(0); // visible height of the ScrollView
  const contentHeightRef = useRef<number>(0); // total content height of the ScrollView

  // Auto-scroll timer
  const autoScrollIntervalRef = useRef<NodeJS.Timer | null>(null); // interval ID for edge-scrolling

  // Section swap thresholds & refs
  const thresholdsRef = useRef<number[]>([]); // Y-positions at which to swap sections
  const sectionRefs = useRef<{ [key: string]: View | null }>({}); // refs by key to each scetion view

  // Currently-moving section
  const currentMovingRef = useRef<Section | null>(null); // the section being dragged
  const movingSectionRef = useRef<boolean>(false); // flag
  const positionsMoved = useRef<number>(0); // net positions shifted during this drag

  // Gesture/pan tracking
  const gestureDyRef = useRef(0); // latest gesture change in y
  const offsetY = useRef(0); // base pan offset before this move
  const checkedAlready = useRef<boolean>(false); // guard to only swap once per crossing

  // Function to reset drag values
  const resetSectionState = () => {
    // Reset Pan state for each section
    sections.forEach(section => {
      const key = `${section.sectionTitle}-${section.timePeriod}`;
      panRefs.current[key]?.setValue({ x: 0, y: 0 });
      panRefs.current[key]?.setOffset({ x: 0, y: 0 });
    });
  
    // Reset other state variables
    scrollEnabledState.current = true;
    scrollingNumRef.current = 0;
    thresholdsRef.current = [];
    positionsMoved.current = 0;
    movingSectionRef.current = false;
    currentMovingRef.current = null;
    checkedAlready.current = false;
    gestureDyRef.current = 0;
    offsetY.current = 0;
  
    // Clear the auto-scroll interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current as any);
      autoScrollIntervalRef.current = null;
    }
  
    // Re-enable scroll view
    if (scrollRef.current) {
      scrollRef.current.setNativeProps({ scrollEnabled: true });
    }
  };

  // Call reset when selection state changes
  useEffect(() => {
    resetSectionState();
  }, [selected]);


  // Function takes the tracker names as a state (no duplicates) and calculates the percentage of bound_amount to total_amount
  function averageProgress(): number {
      let totalRatio = 0;
      let counted = 0;

      const trackers = new Set<string>;
      sections.filter(s => s.timePeriod === selected).forEach(section => {
          section.trackers.forEach(t => {
            
          // Accept only trackers that have a target != 0 and not already been checked
          const target  = Number(t.bound ?? 0);
          if (target == 0 || (trackers.has(t.trackerName))) return;

          // Add to set + calculate progress
          trackers.add(t.trackerName);
          const current = Number(t.currentAmount ?? 0);
          totalRatio += Math.min(1, current / (Math.abs(target)));
          counted += 1; //increment counted
          });
      });
  
      if (counted === 0) return 0;          
      return totalRatio / counted; // Return percentages averaged
  }


  
  // Calculate heights using helper and add to sectionHeightsRef sorted 
  useEffect(() => {
    const heights = sections
      .filter((s) => s.timePeriod === selected)
      .sort((a, b) => a.position - b.position)
      .map((section) => {
        const { height } = getSectInfo(section.sectionTitle);
        return height;
      });
      sectionHeightsRef.current = heights;
  }, [sections, selected]); // if Sections or time period change


    // Finds a section given where you've clicked's y
    const findSectionAtPosY = async (touchY: number): Promise<Section> => { 
      const toUse = useSectionStore.getState().sectionsH;
    const measurements = await Promise.all( // Calculate all heights and y positions of each sections
        toUse.map(section => {
        return new Promise<{ id: string, y: number, height: number }>((resolve) => {
            const ref = sectionRefs.current[`${section.sectionTitle}-${section.timePeriod}`];
            if (!ref) return resolve({ id: `${section.sectionTitle}-${section.timePeriod}`, y: Infinity, height: 0 });

            ref.measure((x, y, width, height, pageX, pageY) => { //measurements of reference
            resolve({ id: `${section.sectionTitle}-${section.timePeriod}`, y: pageY, height });
            });
        });
        })
    );
    
    // If y position matches then return the section id
    const found = measurements.find(m => touchY >= m.y && touchY <= m.y + m.height);
    if (!found) throw new Error('No section found at touch position');
    const section = sections.find(section => `${section.sectionTitle}-${section.timePeriod}` === found.id);
    if (!section) throw new Error('Section not found in state');
    return section;
  };

  //Function to respond to section movement
  const panResponderSection = useMemo(() => PanResponder.create({
    onPanResponderTerminationRequest: () => !editMode, // Don't allow scrolling to terminate function
    onShouldBlockNativeResponder: () => editMode, // Block scrollview if edit mode

    // Only allow calling if edit mode
    onStartShouldSetPanResponder: () => editMode,
    onMoveShouldSetPanResponder: () => editMode,

    // On initial touch
    onPanResponderGrant: (e) => {
      // Disable scrolling on parent ScrollView to prevent interference
      scrollEnabledState.current = false;
      scrollRef.current?.setNativeProps({ scrollEnabled: false });

      // Reset cumulative scroll offset
      scrollingNumRef.current = 0;
      const touchY = e.nativeEvent.pageY;

      // Find which section was touched based on the Y coordinate
      findSectionAtPosY(touchY).then((section) => {
        if (section) {
          // Build the key for section
          const sectionKey = `${section.sectionTitle}-${section.timePeriod}`;
          setCurrentMovingSectionKey(sectionKey);
          currentMovingRef.current = section;

          // Calculate swap thresholds based on current position
          thresholdsRef.current = ThresholdsFunc(section.position, sectionHeightsRef.current);

          // Prepare the pan value for dragging
          const pan = panRefs.current[sectionKey];
          pan?.extractOffset();
        }
      });

      // Mark that a section is now moving (state and ref)
      setMovingSection(true);
      movingSectionRef.current = true;
    },

    // Called while dragging
    onPanResponderMove: (e, gestureState) => {
      const pan = panRefs.current[currentMovingSectionKey!];
      if (!pan) return;

      // Track the vertical drag distance
      gestureDyRef.current = gestureState.dy;
      const dy = gestureState.dy;
      const totalY = offsetY.current + dy + scrollingNumRef.current;
      pan.setValue({ x: 0, y: totalY });

      const pageY = e.nativeEvent.pageY;

      // Auto-scroll up if near top while dragging
      if (pageY < (tabs + 30) && scrolledRef.current > 0) {
        if (!autoScrollIntervalRef.current) {
          autoScrollIntervalRef.current = setInterval(() => {
            if (scrolledRef.current <= 0) {
              scrolledRef.current = 0;
              return;
            }
            // Scroll up by 5px
            scrollingNumRef.current -= 5;
            scrolledRef.current -= 5;
            scrollRef.current?.scrollTo({ y: scrolledRef.current, animated: false });

            // Continue moving the dragged item visually
            const newY = offsetY.current + gestureDyRef.current + scrollingNumRef.current;
            pan.setValue({ x: 0, y: newY });

            // Check if we need to swap with the section above
            if (currentMovingRef.current && pan) {
              const currentPos = currentMovingRef.current.position;
              const moveCount = positionsMoved.current;
              const upThreshold = thresholdsRef.current[currentPos - 1 + moveCount];
              if (upThreshold !== null && newY < upThreshold) {
                // Perform swap with the section above
                const sectionToMove = sections.find(s => s.position === currentPos - 1 + moveCount);
                if (sectionToMove) {
                  const panToSwap = panRefs.current[`${sectionToMove.sectionTitle}-${sectionToMove.timePeriod}`];
                  panToSwap?.flattenOffset();
                  panToSwap?.setOffset({ x: 0, y: sectionHeightsRef.current[pos] + 17 });
                  panToSwap?.setValue({ x: 0, y: 0 });
                  positionsMoved.current -= 1;
                }
              }
            }
            checkedAlready.current = true;
          }, 16); // ~60fps
        }

      // Auto-scroll down if near bottom while dragging
      } else if (pageY > (screenHeight - tabs - 30)
                && scrolledRef.current < contentHeightRef.current - layoutHeightRef.current - 0.1) {
        if (!autoScrollIntervalRef.current) {
          autoScrollIntervalRef.current = setInterval(() => {
            // Stop at bottom
            if (scrolledRef.current >= contentHeightRef.current - layoutHeightRef.current - 0.15) {
              scrolledRef.current = contentHeightRef.current - layoutHeightRef.current - 0.1;
              return;
            }
            // Scroll down by 5px
            scrollingNumRef.current += 5;
            scrolledRef.current += 5;
            scrollRef.current?.scrollTo({ y: scrolledRef.current, animated: false });

            // Continue moving the dragged item visually
            const newY = offsetY.current + gestureDyRef.current + scrollingNumRef.current;
            pan.setValue({ x: 0, y: newY });

            // Check if we need to swap with the section below
            if (currentMovingRef.current && pan) {
              const currentPos = currentMovingRef.current.position;
              const moveCount = positionsMoved.current;
              const downThreshold = thresholdsRef.current[currentPos + 1 + moveCount];
              if (downThreshold !== null && newY > downThreshold) {
                const sectionToMove = sections.find(s => s.position === currentPos + 1 + moveCount);
                if (sectionToMove) {
                  const panToSwap = panRefs.current[`${sectionToMove.sectionTitle}-${sectionToMove.timePeriod}`];
                  panToSwap?.flattenOffset();
                  panToSwap?.setOffset({ x: 0, y: -sectionHeightsRef.current[currentPos] - 17 });
                  panToSwap?.setValue({ x: 0, y: 0 });
                  positionsMoved.current += 1;
                }
              }
            }
            checkedAlready.current = true;
          }, 16); // ~60fps
        }

      // If not near edges, stop auto-scrolling
      } else {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current as any);
          autoScrollIntervalRef.current = null;
        }
      }

      // If dragging has been cancelled, clear auto-scroll
      if (movingSectionRef.current === false) {
        clearInterval(autoScrollIntervalRef.current as any);
        autoScrollIntervalRef.current = null;
      }

      // Handle manual threshold swaps when auto-scroll isn’t active
      const pos = currentMovingRef.current!.position;
      const visibleY = totalY;

      if (!checkedAlready.current) {
        // Downward swap logic
        if (thresholdsRef.current[pos + 1 + positionsMoved.current] !== null) {
          const thresholdDown = thresholdsRef.current[pos + 1 + positionsMoved.current];
          if (visibleY > thresholdDown) { // Swap
            // Reset offsets on swapped section and update positionsMoved
            offsetY.current = visibleY - scrollingNumRef.current;
            gestureState.dy = 0;
            positionsMoved.current += 1;
          }
        }
        // Upward swap logic
        if (thresholdsRef.current[pos - 1 + positionsMoved.current] !== null) {
          const thresholdUp = thresholdsRef.current[pos - 1 + positionsMoved.current];
          if (visibleY < thresholdUp) { // Swap
            offsetY.current = visibleY - scrollingNumRef.current;
            gestureState.dy = 0;
            positionsMoved.current -= 1;
          }
        }
      }
      checkedAlready.current = false; // Used to stop redundant swap checks
    },

    // Called when touch is released
    onPanResponderRelease: () => {
      // Clear any ongoing auto-scroll
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current as any);
        autoScrollIntervalRef.current = null;
      }

      // Reset moving state and keys
      setCurrentMovingSectionKey(null);
      setMovingSection(false);
      offsetY.current = 0;

      // Animate the dragged item back into place
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start(() => {
        // After animation, reset all pan values and offsets
        sections.forEach(section => {
          const key = `${section.sectionTitle}-${section.timePeriod}`;
          panRefs.current[key]?.setValue({ x: 0, y: 0 });
          panRefs.current[key]?.setOffset({ x: 0, y: 0 });
        });
      });

      // Persist the new section order
      moveSectionBy(
        currentMovingRef.current!.sectionTitle,
        currentMovingRef.current!.timePeriod,
        positionsMoved.current
      );

      // Final cleanup
      movingSectionRef.current = false;
      scrollEnabledState.current = true;
      scrollRef.current?.setNativeProps({ scrollEnabled: true });
      currentMovingRef.current = null;
      positionsMoved.current = 0;
      thresholdsRef.current = [];
      scrollingNumRef.current = 0;
    },
  }), [editMode, currentMovingSectionKey, selected, sections]);


  // Dynamic styles for square icon buttons
  const squareIconButtonStyle = (size: number) => ({
    ...styles.squareIconButton,
    position: "relative" as const,
    overflow: "hidden" as const,
    backgroundColor: currentTheme["101010"],
    borderColor: currentTheme.dimgray,
    width: size,
    height: size,
  });

  // Code for when closing section modal
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setTargetSection(null);
  };


  // Percentage progress displayed
  const circleAverage = averageProgress();
  const circleAveragePercentage = Math.round(circleAverage * 100);
  const circleAverageString = `${circleAveragePercentage}%`;
  const { user } = useAuth();

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

      {/* Top view row (profile,time periods,section creation)*/}
      <View style={[
        {
          backgroundColor: currentTheme['101010'],
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          width: '100%',
          flexDirection: 'row',
          zIndex: 1,
        }
      ]}>
        {/* Profile button */}
        <Pressable
          onPress={() => {if (user === null){
            router.push("/Profile")} 
          else{
            router.push("/userLoggedIn")
          }
        }}
          style={[ { backgroundColor: currentTheme["101010"], height: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center'}]}
        >
          <MaterialCommunityIcons name="account" size={40} color={currentTheme.white} />
        </Pressable>

        {/* Time Period buttons */}
        <View
          style = {[
            {
              flex: 1,
              height: '100%',
              flexDirection: 'row'
            }
          ]}>
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
              backgroundColor: "transparent",
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
        {/* Tracker Creation button */}
        <Pressable
          onPress={() => router.push("/newTrackerView")}
          style={[ { backgroundColor: currentTheme["101010"], height: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }]}
        >
          <Entypo name="plus" size={40} color={currentTheme.white} />
        </Pressable>
      </View>

      {/* Sections + Trackers display */}
      <ScrollView
      style = {[{
        flex: 1,
      }]}
        onLayout={(e) => {
          layoutHeightRef.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={(w, h) =>{
          contentHeightRef.current = h;
        }}
        onScroll={(e) => {
          scrolledRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        ref = {scrollRef} // Whether scroll is enabled
        scrollEnabled = {scrollEnabledState.current}
        onStartShouldSetResponder={() => !scrollEnabledState.current}
        contentContainerStyle={[
        styles.scrollView,
        {}
      ]}
      showsVerticalScrollIndicator={false}>
        <Pressable
        pointerEvents="auto"
        onLongPress={()=> { // On long press edit
          (!editMode && !exitedEdit) && setEditMode(true);
        }}
        onPressIn={(e) =>{ // Press in to close edit mode
          editMode && (setEditMode(false), setExitedEdit(true));
        }}
        onPressOut={() =>{
          !editMode && setExitedEdit(false);
        }}
        style={[
          styles.scrollView,
          {
            paddingHorizontal: 5,}
        ]}
        >
        <View style={[styles.progressContainer,
        {
          width: 100,
          height:100,
          //marginTop: 10,
        }
        ]}>
          <Progress.Circle
            size={100}
            progress={circleAverage}
            thickness={10}
            showsText={false} // Text added separately
            color={currentTheme.lightgreen} // Progress color
            unfilledColor={currentTheme.dimgray} // Background color
            borderWidth={0}
            style={[
              {position: 'absolute'}
            ]}
          />
          <Text style={[styles.progressText, { color: currentTheme.white }]}>{circleAverageString}</Text>
        </View>

        {/* Dynamic sections rendering */}
        {sections
          .filter((s) => s.timePeriod === selected)
          .sort((a, b) => a.position - b.position)
          .map((section) => {
            // Assign keys and refs to each section
            const sectionKey = `${section.sectionTitle}-${section.timePeriod}`;
            if (!panRefs.current[sectionKey]) {
              panRefs.current[sectionKey] = new Animated.ValueXY();
            }
            const pan = panRefs.current[sectionKey];
            return(
            //Return a view with an animated view containing it's title, trackers and a plus button for each section
            <View 
              key={`${section.sectionTitle}-${section.timePeriod}`}
              ref={ref => sectionRefs.current[`${section.sectionTitle}-${section.timePeriod}`] = ref}
              onStartShouldSetResponder={() => editMode}
              onResponderGrant={(e) => {
                if (editMode) {
                  const touchY = e.nativeEvent.pageY;
                  findSectionAtPosY(touchY).then((section) => {
                    if (section) {
                      setCurrentMovingSectionKey(`${section.sectionTitle}-${section.timePeriod}`);
                    }
                  });
                }
              }}
              onResponderStart={(e) => {
                if (editMode) {
                  e.stopPropagation(); // Block the press event from parent 
                }
              }}
            >
            <Animated.View //Moveable view (on edit mode)
            
            style = {
              [
                pan.getLayout(), // Layout stored in ref
                {borderWidth: 1,
                  borderRadius: 8,
                  borderColor: editMode ? currentTheme["dimgray"] : 'transparent',
                  marginTop: section.position === 0 ? 20 : 15, // num1 from circl (1st section), num2 from other sections
                  paddingVertical: 10,
                  width: '100%',
                  minWidth: '100%',
                  backgroundColor: (movingSection && (currentMovingSectionKey === `${section.sectionTitle}-${section.timePeriod}`)) ? currentTheme['lowOpacityWhite'] : 'transparent', // If moving set background white
                }
              ]
            }
            {...(currentMovingSectionKey === `${section.sectionTitle}-${section.timePeriod}` ? panResponderSection.panHandlers : {})} // Passing gesture handlers into view
            
            >
              
              <View 
              style = {[
                {height: 30,
                  minWidth: '100%',
                  alignItems: 'center',
                  alignContent: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  marginBottom: 5
                }
              ]}
              >
              
              {/* Section Title */}
              <Text style={[styles.title, { color: currentTheme.white, paddingLeft: 0}]}>
                {section.sectionTitle}
              </Text>
              {/* Delete button if in edit mode */}
              {editMode &&(
              <TouchableOpacity style = {[
                {width: 30,
                  height:30,
                  position: 'absolute',
                  left: 10,
                }
              ]}
              onPress={() =>{
                Alert.alert(
                  "Delete Section?",
                  section.sectionTitle + " will be deleted permanently",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "OK",
                      onPress: () => {
                        deleteSection(section.sectionTitle,section.timePeriod) // Delete section in backend
                      },
                    },
                  ],
                  { cancelable: true }
                );
              }
              }>
                <Feather
                name="minus-circle"
                size={23}
                color={currentTheme['white']}
                />
              </TouchableOpacity>
              )}
              </View>
              {/* Section's Rows of Tracker Icons */}
              <View style={styles.iconRow}>
                {section.trackers.map((tracker) => (
                  <View
                    key = {tracker.trackerName + tracker.timePeriod}
                  >
                    <Pressable
                        // Increment on tap
                        onPress={() => {
                            if (!editMode) { // Don’t increment in edit mode
                            incrementTracker(tracker.trackerName, tracker.timePeriod);
                            }else{

                            }
                        }}
                        // Hold press opens edit tracker
                        onLongPress={() => {
                          if(!editMode){
                            router.push({
                            pathname: "/editTracker",
                            params: {
                                trackerN: tracker.trackerName,
                                timeP:    tracker.timePeriod,
                                color:    (getIconInfo(tracker.icon).color == '#ffffff' || getIconInfo(tracker.icon).color == '#000000') ? currentTheme['defaultIcon'] : getIconInfo(tracker.icon).color,
                                image:    getIconInfo(tracker.icon).name,
                            },
                            });
                          }
                        }}
                    style={[
                      squareIconButtonStyle(itemSize),
                      {
                        borderColor: editMode ? currentTheme.dimgray : currentTheme.dimgray,
                        backgroundColor: hexToRgba( 
                            // Set to 0 for transparency                          
                            (getIconInfo(tracker.icon).color == '#ffffff' || getIconInfo(tracker.icon).color == '#000000') ? currentTheme['defaultIcon'] : getIconInfo(tracker.icon).color, 0               
                        ),
                      },
                    ]}                                                       
                  >
                    {(() => {  
                      // Create a view filining up the icon according to percentage currentAmount to bound                                              
                      const bound = tracker.bound ?? 0;                   
                      const progress = bound !== 0 ? Math.min(1, tracker.currentAmount / Math.abs(bound)) : 0;                                              
                      return (        
                                                         
                        <View                                               
                          style={{                                          
                            position: "absolute",                           
                            bottom: 0,                                         
                            left: 0,                                        
                            right: 0,                                       
                            height: `${progress * 100}%`,                   
                            backgroundColor: hexToRgba(     
                                // Set to 0.15 for filling up icon               
                                (getIconInfo(tracker.icon).color == '#ffffff' || getIconInfo(tracker.icon).color == '#000000') ? currentTheme['defaultIcon'] : getIconInfo(tracker.icon).color, 0.15   
                            ),                                              
                          }}                                                
                        />                                                  
                      );                                                   
                    })()}                                                   
                  
                    {getImage(tracker, 40).icon}
                  </Pressable>
                  {/* Delete tracker from section button */}
                  {editMode &&(
                    <TouchableOpacity
                    onPress={() => {
                      removeTrackerFromSection(section.sectionTitle,selected,tracker)
                    }}
                    style = {[
                      {position: 'absolute',
                        backgroundColor: currentTheme['101010'],
                        right: -4,
                        top: 2,
                        borderRadius: spacing,
                      }
                    ]}> 
                      <Feather
                          name="x-circle"
                          size={21}
                          color={currentTheme['white']}
                          style={{ margin: -1 }} 
                        />
                    </TouchableOpacity>
                  )}
                  
                  </View>
                  
                ))}


                {/* Plus button to open 'add tracker to section' modal and store section */}
                <Pressable
                  onPress={() => {
                    setTargetSection(section); // Store section for trackers to be added to
                    setIsModalVisible(true); // Show modal
                  }}
                  style={
                    squareIconButtonStyle(itemSize)
                    
                  }
                >
                  <AntDesign name="plus" size={30} color={currentTheme.white} />
                </Pressable>
                </View>
            </Animated.View>
            </View>
          
            )
            })}
        
        {/* END dynamic sections rendering */}

        <Pressable //section creation
          style={[styles.sectionCreateButton, { borderColor: currentTheme.dimgray }]}
          onPress={() => setSectionModalOpen(true)}
        >
          <AntDesign name="plus" size={50} color={currentTheme.white} />
        </Pressable>

        {/* Modal to add tracker to section */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseModal}>
      
          <View style={[styles.modalOverlay, { backgroundColor: currentTheme["rgba(0, 0, 0, 0.8)"] }]}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme["101010"], borderColor: currentTheme['dimgray'] }]}>
              <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                <AntDesign name="close" size={24} color={currentTheme.white} />
              </Pressable>

              {/* Scrollable tracker list */}
              <ScrollView
                style={styles.scrollView2}
                contentContainerStyle={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  paddingBottom: 50,
                }}
                showsVerticalScrollIndicator={false}
              >
                {trackers
                .filter((tracker) => tracker.timePeriod === selected)
                .map((tracker) => (
                  <TouchableOpacity
                    onPress={() => {
                      if (!targetSection) return;
                      const exists = targetSection.trackers.some( // Whether tracker already exists in section
                        (t) => t.trackerName === tracker.trackerName && t.timePeriod === tracker.timePeriod
                      );
                      if (exists) {
                        handleCloseModal();
                        return;
                      }else{
                        addTrackerToSection(
                          targetSection.sectionTitle,
                          targetSection.timePeriod,
                          tracker
                      );
                      handleCloseModal();
                      }}
                    }
                    key = {tracker.trackerName}
                    style = {[
                        styles.trackerButton,
                        {borderColor: 'transparent'}, 
                    ]}>
                      {/* Icon */}
                      <View style = {[styles.iconContainer]}>
                          {getImage(tracker,40).icon}
                      </View>
                      
                      {/* Text (tracker name) */}
                      <Text style={[
                          styles.trackerText,
                          {color: currentTheme['white']}
                      ]}>
                          {tracker.trackerName}
                      </Text>

                      {/* Plus */}
                      <View style = {[
                      styles.iconContainer,
                      {
                          marginLeft: 'auto', 
                      }
                      ]}>
                        <Entypo name="plus" size={25} color={currentTheme['dimgray']} />
                      </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Section creation modal */}
        <NewSectionModal
          visible={sectionModalOpen}
          onClose={() => setSectionModalOpen(false)}
        />
        </Pressable>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  scrollView: {
    alignItems: "center",
    paddingBottom: 50,
  },
  scrollView2: {
    paddingBottom: 50,
  },

  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: 25,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 0,
    textAlign: "center",
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  squareIconButton: {
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: spacing / 2,
    marginTop: spacing,
  },
  sectionCreateButton: {
    padding: 12,
    minWidth: '80%',
    borderRadius: 5,
    borderWidth: 1,
    borderStyle: 'dashed' as const,

    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: screenWidth * 0.9,
    height: 450,
    borderRadius: 10,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  trackerButton: {
    height: 40,
    width: '100%',
    margin: 10,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: 'row',
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 50,
  },
  trackerText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 20,
    flex:1
  },
});

