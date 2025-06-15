import { useTheme } from "../app/Contexts/ThemeContext"; // Import the ThemeContext

//get icon info {type,name,color}
export const getIconInfo = (input: string): { type: string; name: string; color: string,
 } => {
    console.log("ICON INFO GOT STRING GIVEN IN "+input);
    var type : string = "fa5";
    var name : string = "";
    var color : string = 'white';
    const inputSplit = input.split('|');
    if (inputSplit.length === 3 || inputSplit.length === 2){
        type = inputSplit[0];
        name = inputSplit[1];
    }if (inputSplit.length === 3){
        color = inputSplit[2];
    }
    return { type, name, color };
  };