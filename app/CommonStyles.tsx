import { StyleSheet, Dimensions, PixelRatio } from 'react-native';
import { useTheme } from './ThemeContext';
import { useMemo } from 'react';

const width = Dimensions.get('window').width-1


export const CommonStyles = () => {
    const { currentTheme } = useTheme();
    const scale = PixelRatio.get();

    return useMemo(() => StyleSheet.create({       // useMemo to memorise styles to improve performance (dont have to recompute them every time since its now a function)

    // Profile styles (userLoggedIn and ForgotPassword now use these)
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: currentTheme["rgba(0, 0, 0, 0.8)"], // Use theme background color
        position: "absolute",
        top: 0,
        left: 0,    
        right: 0,
        bottom: 0,
      },
  
      container: {
        width: width*0.85,
        backgroundColor: currentTheme["101010"],
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 15, 
        borderWidth: 1,
        borderColor: currentTheme.dimgray,
        alignItems: "center",
        justifyContent: 'center',
        //justifyContent: "flex-start",
      },
  
      header: {
        fontSize: 18,
        color: currentTheme.white,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10, 
      },
  
      input: {
        width: '82%',
        padding: 12,
        marginTop: 14,
        borderWidth: 1,
        borderRadius: 5,
        borderColor: currentTheme.dimgray,
        color: currentTheme.white,
      },
    
      blueText: {
        color: currentTheme.lightblue,
        marginTop: 5,
        marginBottom: 5,
      },
    
      button: {
        marginTop: 20,
        backgroundColor: currentTheme["101010"],
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: currentTheme.dimgray,
      },
    
      buttonText: {
        fontSize: 18,
        color: currentTheme.white,
        fontWeight: 'bold',
      },
  
      profileIcon: {
        width: 100,
        height: 100,
        borderRadius: 50, 
        marginBottom: 10,
        marginTop: 10,
      },

      // newTrackerView styles:        // ****** HAVEN'T BEEN PUT IN YET ******  (hard to do without messing up proportions)

      // Contains input fields
      inputContainer: {
        width: width*0.85*0.8,
        backgroundColor: currentTheme["101010"],
        borderColor: currentTheme.dimgray,
        marginBottom: 5,
        borderRadius: 5,
        borderWidth: 1,
        
        alignSelf: 'center',
      },
          
            // Dropdown styling
            dropdownContainer: {
              width: width*0.8*0.85,
              marginBottom: 10,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: currentTheme.dimgray,
              zIndex: 1000, 
              alignSelf: 'center',
              alignContent: 'center',
            },
            dropdown: {
              backgroundColor: currentTheme["101010"],
              borderColor: 'transparent',
            },
            dropdownList: {
              backgroundColor: currentTheme["101010"],
              borderColor: currentTheme.dimgray,
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
              height: 50,
              width: width * 0.85 * 0.8,
              flexDirection: 'row',
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
            dimgrayText:{
              fontSize: 20,
              color: "dimgray" //dull display
            },
          
            exitButtonInvisible: {
              marginTop: 20, // Adds some space above the button
              backgroundColor: '#transparent',
              paddingVertical: 12,
              paddingHorizontal: 30,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: 'transparent',
            },
            exitButtonTextInvisible:{
              fontSize: 18,
              color: 'transparent',
              fontWeight: 'bold',
            },
      
      
          //Cross, Icon box and tick (used in select image)

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
          borderTopColor: '#101010',
          borderBottomColor: '#094F23',
          borderBottomWidth: 7,
      
          backgroundColor: '#075F28',
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
          borderTopColor: '#101010',
          borderBottomColor: '#860B0B', 
          borderBottomWidth: 7,
          borderLeftColor: 'transparent',
      
          backgroundColor: '#a30a0a',
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

    }), [currentTheme]);    // only recompute styles when currentTheme changes
};