import { Animated, PanResponder, View, Alert, Pressable, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons, MaterialCommunityIcons, AntDesign, Entypo, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Progress from "react-native-progress";
import { Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../ThemeContext"; // Import the ThemeContext
import { openDatabase } from "@/storage/sqlite";
import { useEffect, useState, useRef, useMemo } from "react";
import { Tracker } from "@/types/Tracker";
import { Section } from "@/types/Section";
import { useState as useReactState } from "react";
import { useTrackerStore } from "@/storage/store"; // Import the Zustand store
import { getImage } from "../trackerList"; // Import the getImage function
import { CalendarProps } from "../../components/CalendarComponent";
import NewSectionModal from "@/components/SectionModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getIconInfo } from "@/types/Misc";

import { useSectionStore } from "@/storage/store";
import type { TimePeriod } from "@/types/Tracker";
import { parseAsync } from "@babel/core";
import { Keyframe, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

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


// Used in square icon styling for dynamic styles - grid same for all phone sizes
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;
const itemsPerRow = 4;
const spacing = 12;
const totalSpacing = spacing * (itemsPerRow + 1);
const sidesPadding = 16; // for grid mostly
const itemSize = (screenWidth - totalSpacing - sidesPadding * 2) / itemsPerRow;
const tabs = 120;
const marginBetweenSections = 15;

export default function Index() {
  const insets = useSafeAreaInsets();
  
  const router = useRouter();
  const { currentTheme } = useTheme(); // Get the current theme from context
  

  //backend structures
  const trackers = useTrackerStore((state) => state.trackers);
  let sections = useSectionStore((state) => state.sectionsH);
  const addTrackerToSection = useSectionStore((state) => state.addTrackerToSection);
  const incrementTracker = useTrackerStore(state => state.incrementTracker);
  const moveSectionBy = useSectionStore(state => state.moveSectionBy);
  const deleteSection = useSectionStore(state => state.deleteSection)
  const removeTrackerFromSection = useSectionStore(state => state.removeTrackerFromSection)
  /* States */
  //modal states
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useReactState(false);
  const [targetSection, setTargetSection] = useReactState<Section | null>(null);

  

  //Time Period States (+ mode of calendar)
  type CalendarMode = CalendarProps["mode"];
  const buttons: CalendarMode[] = ["Daily", "Weekly", "Monthly"];
  const [selected, setSelected] = useState<CalendarMode>("Daily");

  //Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [exitedEdit, setExitedEdit] = useState(false); //if just exited (fixes slight bug)
  const [movingSection, setMovingSection] = useState(false);
  const [currentMovingSectionKey, setCurrentMovingSectionKey] = useState<string | null>(null);
  
  //heights and push function
  const sectionHeightsRef = useRef<number[]>([]);

  const ThresholdsFunc = (centralIndex: number, heights: number[]): number[] => {
    const thresholdsToReturn = new Array(heights.length).fill(0);

    // right of centralIndex
    for (let i = centralIndex + 1; i <= heights.length - 1; i++) {
      thresholdsToReturn[i] = thresholdsToReturn[i - 1] + heights[i - 1] + marginBetweenSections+2;
    }
  
    // left of centralIndex
    for (let i = centralIndex - 1; i >= 0; i--) {
      thresholdsToReturn[i] = - heights[i] + thresholdsToReturn[i + 1] - marginBetweenSections - 2;
    }
  
    // Center stays 0
    thresholdsToReturn[centralIndex] = 0;
  
    return thresholdsToReturn;
  };

  //Edit mode states
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null); //warning state for deletion
  //Edit mode refs
  const panRefs = useRef<{ [key: string]: Animated.ValueXY }>({}); //ref to all sections
  const pan = useRef(new Animated.ValueXY()).current; //ref to section being moved

  // ScrollView and scrolling state
  const scrollRef = useRef<ScrollView>(null);  // ref to the parent ScrollView
  const scrollEnabledState = useRef(true); // whether parent scroll is currently enabled
  const scrolledRef = useRef<number>(0); // current scroll Y position
  const scrollingNumRef = useRef<number>(0); // scroll offset in this drag

  //Layout measurements
  const layoutHeightRef = useRef<number>(0); // visible height of the ScrollView
  const contentHeightRef = useRef<number>(0); // total content height of the ScrollView

  //Auto-scroll timer
  const autoScrollIntervalRef = useRef<NodeJS.Timer | null>(null); // interval ID for edge-scrolling

  //Section swap thresholds & refs
  const thresholdsRef = useRef<number[]>([]); // Y-positions at which to swap sections
  const sectionRefs = useRef<{ [key: string]: View | null }>({}); // refs by key to each scetion view

  //Currently-moving section
  const currentMovingRef = useRef<Section | null>(null); // the section being dragged
  const selectedKeyRef = useRef<string | null>(null);
  const movingSectionRef = useRef<boolean>(false); // flag
  const positionsMoved = useRef<number>(0); // net positions shifted during this drag

  //Gesture/pan tracking
  const gestureDyRef = useRef(0); // latest gesture change in y
  const offsetY = useRef(0); // base pan offset before this move
  const checkedAlready = useRef<boolean>(false); // guard to only swap once per crossing

  //Function to reset drag values
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

  // Reset the animation state when switching view mode OR when sections is updated
  useEffect(() => {
    resetSectionState();
  }, [selected,sections]);

  function averageProgress(): number {
      let totalRatio = 0;
      let counted = 0;

      sections.filter(s => s.timePeriod === selected).forEach(section => {
          section.trackers.forEach(t => {
            
          // accept only trackers that have a target != 0
          const target  = Number(t.bound ?? 0);
          if (target == 0) return;
  
          const current = Number(t.currentAmount ?? 0);
          totalRatio += Math.min(1, current / (Math.abs(target)));
          counted += 1;
          });
      });
  
      if (counted === 0) return 0;          
      return totalRatio / counted; // return normalised value
  }


  //function to get height and pos of section given title ()
  const getSectInfo = (sectionTitle: string): {height: number, position: number} => { //ONLY CALL WHEN ALREADY UNWRAPPED SECTION
    const section : Section =  sections.find((s) => s.sectionTitle === sectionTitle && s.timePeriod === selected)!
    var sectHeight : number = 56.666 + 10; //(35) {height in theory} + (10) {padding size} + 11.666 (unaccounted for in top)
    var position : number = -1;
    if(section){
      const rows = Math.ceil((section.trackers.length +1)/ 4);
      sectHeight += (itemSize) *(rows) +(spacing*(rows-1)); //spacing per row
      position = section.position;
    }
    return {height: sectHeight, position: position}
  }
    
  // For all sections map their heights according to position
  useEffect(() => {
    const heights = sections
      .filter((s) => s.timePeriod === selected)
      .sort((a, b) => a.position - b.position)
      .map((section) => {
        const { height } = getSectInfo(section.sectionTitle);
        return height;
      });
      sectionHeightsRef.current = heights;
  }, [sections, selected]); // Dependency array to run this effect when 'sections' or 'selected' changes


    //finds section given y coord
    const findSectionAtPosY = async (touchY: number): Promise<Section> => { 
      const toUse = useSectionStore.getState().sectionsH;
    const measurements = await Promise.all(
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
    
    const found = measurements.find(m => touchY >= m.y && touchY <= m.y + m.height);
    if (!found) throw new Error('No section found at touch position');
    const section = sections.find(section => `${section.sectionTitle}-${section.timePeriod}` === found.id);
    if (!section) throw new Error('Section not found in state');
    return section;
  };

  //Function to respond to section movement (WILL EDIT)
  const panResponderSection = useMemo(() => PanResponder.create({

      onPanResponderTerminationRequest: () => !editMode,
      onShouldBlockNativeResponder: () => editMode,
      onStartShouldSetPanResponder: () => editMode, // only drag if in edit mode
      onMoveShouldSetPanResponder: () => editMode, //edit mode also

      onPanResponderGrant: (e) => { //if granted (edit mode)
        console.log(" GRANTED")
        /*Stops parent scroll view from interfering*/
        scrollEnabledState.current = false; 
        if (scrollRef.current) {
          scrollRef.current.setNativeProps({ scrollEnabled: false });
        }

        //Set current scroll total to 0
        scrollingNumRef.current = 0;
        const touchY = e.nativeEvent.pageY;

        //after finding a section set the movingkey 
        findSectionAtPosY(touchY).then((section) => {
          if (section) {
            const sectionKey = `${section.sectionTitle}-${section.timePeriod}`;
            setCurrentMovingSectionKey(sectionKey);
            currentMovingRef.current = section;
            

            thresholdsRef.current = ThresholdsFunc(section.position,sectionHeightsRef.current);
            const pan = panRefs.current[sectionKey];

            pan?.extractOffset();
          } else {
          }
        });
        setMovingSection(true);
        movingSectionRef.current = true;

        
      },


      onPanResponderMove: (e, gestureState) => {
        const pan = panRefs.current[currentMovingSectionKey!]; //force (oops)
        if(!pan) return;
        //setting the y to the offset + dy
        gestureDyRef.current = gestureState.dy;

        const dy = gestureState.dy;
        const totalY = offsetY.current + dy + scrollingNumRef.current;
        pan.setValue({ x: 0, y: totalY});
        const pageY = e.nativeEvent.pageY;
        if(pageY<(tabs + 30) && scrolledRef.current > 0){ 
          if (!autoScrollIntervalRef.current) {
            autoScrollIntervalRef.current = setInterval(() => {
              
              if (scrolledRef.current <= 0 ){ 
                scrolledRef.current = 0;
                return;
              }
              scrollingNumRef.current -= 5;
              scrolledRef.current -= 5;
      
              scrollRef.current?.scrollTo({ y: scrolledRef.current, animated: false });
              // keep moving the item down visually
              const newY = offsetY.current + gestureDyRef.current + scrollingNumRef.current;
              pan.setValue({ x: 0, y: newY });

              if (currentMovingRef.current && pan) {
                const currentPos = currentMovingRef.current.position;
                const moveCount = positionsMoved.current;
              
                const upThreshold = thresholdsRef.current[currentPos - 1 + moveCount];
                if (upThreshold !== null && newY < upThreshold) {
                  // Perform swap
                  const sectionToMove = sections.find((s) => s.position === currentPos - 1 + moveCount);
                  if (sectionToMove) {
                    const panToSwap = panRefs.current[`${sectionToMove.sectionTitle}-${sectionToMove.timePeriod}`];
                    panToSwap?.flattenOffset();
                    panToSwap?.setOffset({ 
                      x: 0, 
                      y: sectionHeightsRef.current[pos] + 17 
                    });
                    panToSwap?.setValue({ x: 0, y: 0 });
                    
                    // Update current section
                    positionsMoved.current -= 1;
                  }
                }
              }
              checkedAlready.current = true;
            }, 16); // ~60fps
          }
        }else if(pageY>(screenHeight - tabs - 30) && scrolledRef.current < contentHeightRef.current-layoutHeightRef.current-0.1){ 
          if (!autoScrollIntervalRef.current) {
            autoScrollIntervalRef.current = setInterval(() => {
              
              //Check if at bottom
              if (scrolledRef.current >= contentHeightRef.current-layoutHeightRef.current-0.15){
                scrolledRef.current = contentHeightRef.current-layoutHeightRef.current -0.1;
                return;
              }

              //add offset
              scrollingNumRef.current += 5;
              scrolledRef.current += 5;
              scrollRef.current?.scrollTo({ y: scrolledRef.current, animated: false });

              const newY = offsetY.current + gestureDyRef.current + scrollingNumRef.current;
              // keep moving the item down visually
              pan.setValue({ x: 0, y: newY });


              if (currentMovingRef.current && pan) {
                const currentPos = currentMovingRef.current.position;
                const moveCount = positionsMoved.current;
        
                // Check for downward swap
                const downThreshold = thresholdsRef.current[currentPos + 1 + moveCount];
                if (downThreshold !== null && newY > downThreshold) {
                  // Perform swap
                  const sectionToMove = sections.find((s) => s.position === currentPos + 1 + moveCount);
                  if (sectionToMove) {
                    const panToSwap = panRefs.current[`${sectionToMove.sectionTitle}-${sectionToMove.timePeriod}`];
                    panToSwap?.flattenOffset();
                    panToSwap?.setOffset({ x: 0, y: -sectionHeightsRef.current[currentPos] -17});
                    panToSwap?.setValue({ x: 0, y: 0 });
                    
                    // Update current section
                    positionsMoved.current += 1;
                  }
                }
              }
              checkedAlready.current = true;
            }, 16); // ~60fps
          }
        }else{
          if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current as any);
            autoScrollIntervalRef.current = null;
          }
          
        }if(movingSectionRef.current === false){
          clearInterval(autoScrollIntervalRef.current as any);
            autoScrollIntervalRef.current = null;
        }

        const pos = currentMovingRef.current!.position;
        const visibleY = totalY;

        if(!checkedAlready.current){
        if(thresholdsRef.current[pos + 1 + positionsMoved.current] !== null ){
          const thresholdDown = thresholdsRef.current[pos+1+positionsMoved.current]
          if (visibleY > thresholdDown){
            if(positionsMoved.current < 0) {
              const sectionToMove = sections.find((s) => s.position === pos+positionsMoved.current && s.timePeriod === selected)!
              const panToSwap = panRefs.current[`${sectionToMove.sectionTitle}-${sectionToMove.timePeriod}`]
              currentMovingRef.current && panToSwap.flattenOffset();
              currentMovingRef.current && panToSwap.setOffset({x: 0, y: 0});
              currentMovingRef.current && panToSwap.setValue({ x: 0, y: 0 });
            }else{
              const sectionToMove = sections.find((s) => s.position === pos+1+positionsMoved.current && s.timePeriod === selected)!
              const panToSwap = panRefs.current[`${sectionToMove.sectionTitle}-${sectionToMove.timePeriod}`]
              currentMovingRef.current && panToSwap.flattenOffset();
              currentMovingRef.current && panToSwap.setOffset({x: 0, y: -sectionHeightsRef.current[pos] - 17});
              currentMovingRef.current && panToSwap.setValue({ x: 0, y: 0 });   

            }
            //pan.setOffset({ x: 0, y: 0});
            //pan.setValue({x:0,y:0});
            offsetY.current = visibleY - scrollingNumRef.current;
            gestureState.dy = 0;
            positionsMoved.current+=1;
          }
        }

      if(thresholdsRef.current[pos - 1 + positionsMoved.current] !== null){
        const thresholdUp = thresholdsRef.current[pos-1+positionsMoved.current];;
        if (visibleY < thresholdUp){

          if(positionsMoved.current > 0){ //going back, need to reswap
            const sectionToMove = sections.find((s) => s.position === pos+positionsMoved.current && s.timePeriod === selected)!
            const panToSwap = panRefs.current[`${sectionToMove.sectionTitle}-${sectionToMove.timePeriod}`]
            currentMovingRef.current && panToSwap.flattenOffset();
            currentMovingRef.current && panToSwap.setOffset({x: 0, y: 0});
            currentMovingRef.current && panToSwap.setValue({ x: 0, y: 0 });
          }else{
            const sectionToMove = sections.find((s) => s.position === pos-1+positionsMoved.current && s.timePeriod === selected)!
            const panToSwap = panRefs.current[`${sectionToMove.sectionTitle}-${sectionToMove.timePeriod}`]
            currentMovingRef.current && panToSwap.flattenOffset();
            currentMovingRef.current && panToSwap.setOffset({x: 0, y: sectionHeightsRef.current[pos] + 17});
            currentMovingRef.current && panToSwap.setValue({ x: 0, y: 0 });
          }
          //pan.setOffset({ x: 0, y: 0 });
          offsetY.current = visibleY - scrollingNumRef.current;
          gestureState.dy = 0;
          positionsMoved.current-=1;
        }
      }
    }
    checkedAlready.current = false;
      },

      onPanResponderRelease: () => {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current as any);
          autoScrollIntervalRef.current = null;
        }
        
        setCurrentMovingSectionKey(null);
        setMovingSection(false);

        offsetY.current = 0;
        
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start(() => {
          sections.forEach(section => {
            const key = `${section.sectionTitle}-${section.timePeriod}`;
              panRefs.current[key]?.setValue({ x: 0, y: 0 });
              panRefs.current[key]?.setOffset({ x: 0, y: 0 });
          }
          
          );
        });
        moveSectionBy(currentMovingRef.current!.sectionTitle,currentMovingRef.current!.timePeriod,positionsMoved.current);
        
        

        movingSectionRef.current = false;
        if (autoScrollIntervalRef.current) {
          //clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }

        /*Reallows interference*/
        scrollEnabledState.current = true;
        if (scrollRef.current) {
          scrollRef.current.setNativeProps({ scrollEnabled: true });
        }

        //resets everything

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

  //Modal functions
  const handlePlusPress = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setTargetSection(null);
  };


  const circleAverage = averageProgress();
  const circleAveragePercentage = Math.round(circleAverage * 100);
  const circleAverageString = `${circleAveragePercentage}%`;
  const { user } = useAuth();

  return (
    //whole screen
    <SafeAreaView style={[
      styles.safeArea, { 
      //position: 'relative',
      //backgroundColor: c',
      backgroundColor: currentTheme["101010"],
     }]}>
      <View
      style = {[{
        minHeight: '100%',
        backgroundColor: currentTheme['101010'],
      }]}>

      
      {/*<StatusBar style="light" />*/}
      {/* Top view row */}
      <View style={[
        {
          backgroundColor: currentTheme['101010'],
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          width: '100%',
          //alignContent: 'center',
          flexDirection: 'row',
          //paddingTop: insets.top,
          zIndex: 1,
          //borderColor: 'white'
        }
      ]}>
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
          onPress={() => router.push("/newTrackerView")}
          style={[ { backgroundColor: currentTheme["101010"], height: '100%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }]}
        >
          <Entypo name="plus" size={40} color={currentTheme.white} />
        </Pressable>
      </View>

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
        ref = {scrollRef} //whether scroll is enabled
        scrollEnabled = {scrollEnabledState.current}
        onStartShouldSetResponder={() => !scrollEnabledState.current}
        contentContainerStyle={[
        styles.scrollView,
        {}
      ]}
      showsVerticalScrollIndicator={false}>
        <Pressable
        pointerEvents="auto"
        onLongPress={()=> { //on long press edit
          (!editMode && !exitedEdit) && setEditMode(true);
        }}
        onPressIn={(e) =>{ //press in to close edit
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
            size={100} // Size of the circle
            progress={circleAverage} // 76% progress
            thickness={10} // Border thickness
            showsText={false} // We add text separately
            color={currentTheme.lightgreen} // Progress color
            unfilledColor={currentTheme.dimgray} // Background color
            borderWidth={0} // No border
            style={[
              {position: 'absolute'
              }
            ]}
          />
          <Text style={[styles.progressText, { color: currentTheme.white }]}>{circleAverageString}</Text>
        </View>

        {/*START dynamic sections rendering */}
        {sections
          .filter((s) => s.timePeriod === selected)
          .sort((a, b) => a.position - b.position)
          .map((section) => {            
            const sectionKey = `${section.sectionTitle}-${section.timePeriod}`;
            if (!panRefs.current[sectionKey]) {
              panRefs.current[sectionKey] = new Animated.ValueXY();
            }
            const pan = panRefs.current[sectionKey];
            return(
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
                // Block the press event from parent 
                if (editMode) {
                  e.stopPropagation();
                }
              }}
            >
            <Animated.View //Moveable view (on edit mode)
            
            style = {
              [
                pan.getLayout(), //stored in pan object created by useRef earlier
                {borderWidth: 1,
                  borderRadius: 8,
                  borderColor: editMode ? currentTheme["dimgray"] : 'transparent',
                  marginTop: section.position === 0 ? 20 : 15, //num1 from circle, num2 from other sections
                  paddingVertical: 10,
                  width: '100%',
                  minWidth: '100%',
                  backgroundColor: (movingSection && (currentMovingSectionKey === `${section.sectionTitle}-${section.timePeriod}`)) ? currentTheme['lowOpacityWhite'] : 'transparent',
                }
              ]
            }
            {...(currentMovingSectionKey === `${section.sectionTitle}-${section.timePeriod}` ? panResponderSection.panHandlers : {})}//passing gesture handlers into view
            
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
                        deleteSection(section.sectionTitle,section.timePeriod)
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
              {/* Section's Row of Tracker Icons */}
              <View style={styles.iconRow}>
                {section.trackers.map((tracker) => (
                  <View
                    key = {tracker.trackerName + tracker.timePeriod}
                    style = {[
                      {flexDirection: 'row'}
                    ]}
                  >
                    
                    
                    <Pressable
                        // Single tap increment 
                        onPress={() => {
                            if (!editMode) { // don’t increment while you’re dragging sections
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
                                color:    getIconInfo(tracker.icon).color,
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
                          getIconInfo(tracker.icon).color, 0               
                        ),
                      },
                    ]}                                                       
                  >
                    {(() => {                                                
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
                                getIconInfo(tracker.icon).color, 0.15   
                            ),                                              
                          }}                                                
                        />                                                  
                      );                                                   
                    })()}                                                   
                  
                    {getImage(tracker, 40).icon}
                  </Pressable>
                  {/* Cross */}
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


                {/* Plus button to open modal and store section */}
                <Pressable
                  onPress={() => {
                    setTargetSection(section);     // Store selected section
                    setIsModalVisible(true);       // Show modal
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
          //onPress={() => create section}
          style={[styles.sectionCreateButton, { borderColor: currentTheme.dimgray }]}
          onPress={() => setSectionModalOpen(true)}
        >
          <AntDesign name="plus" size={50} color={currentTheme.white} />
        </Pressable>

        {/* Modal for the popup */}
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
              const exists = targetSection.trackers.some(
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
    // position: "absolute",
    // top: 38,
    // left: 29,
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
    // padding: 0,
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: spacing / 2,
    marginTop: spacing,
  },
  sectionCreateButton: {
    padding: 12,
    minWidth: '80%', //feel free to change
    borderRadius: 5,
    borderWidth: 1,
    borderStyle: 'dashed' as const,

    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent background
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
  modalText: {
    fontSize: 16,
    textAlign: "center",
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
    width: 40,
  },

  trackerText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
    flex:1
  },
});

