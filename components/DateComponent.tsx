import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import moment from 'moment';
import React from 'react';
import { useTheme } from '../app/Contexts/ThemeContext'; // Import useTheme

// Define the prop types for the Date component
interface DateComponentProps {
  date: Date;
  onSelectDate: (date: string) => void;
  selected: string;
  mode: "Daily" | "Weekly" | "Monthly";
}

// Date component: displays a formatted day and day number
const Date: React.FC<DateComponentProps> = ({ date, onSelectDate, selected, mode }) => {
  const { currentTheme } = useTheme(); // Access currentTheme

  // Format the provided date
  const formattedDate = moment(date).format('YYYY-MM-DD');

  const m = moment(date);
  let day = '';
  let dayNumber = '';
  const today = moment().format('YYYY-MM-DD');

  if (mode == "Daily"){
    // Display "Today" if the date is equal to current date, otherwise show abbreviated weekday name
    day = formattedDate === today ? 'Today' : moment(date).format('ddd');
    dayNumber = moment(date).format('D');
  }
  else if (mode == "Weekly"){
      const start = m.clone().startOf('week').format('D');
      const end = m.clone().endOf('week').format('D');
      day = moment(date).format('MMM');
      dayNumber = `${start}-${end}`;
  }
  else if (mode == "Monthly"){
    day = moment(date).format('MMM');
    dayNumber = moment(date).format('MM');
  }

  return (
    // TouchableOpacity makes the date card pressable
    <TouchableOpacity
      onPress={() => onSelectDate(formattedDate)}
      // Apply default card style and change background if this card is selected
      style={[
        styles.card,
        { backgroundColor: currentTheme["101010"] }, // Use theme background color
        selected === formattedDate && { backgroundColor: currentTheme["FFFFFF"] }, // Selected background
      ]}
    >
      {/* Display the day label */}
      <Text
        style={[
          styles.big,
          { color: currentTheme.gray }, // Use theme text color
          selected === formattedDate && { color: currentTheme["101010"] }, // Selected text color
        ]}
      >
        {day}
      </Text>
      {/* Spacer between day label and day number */}
      <View style={{ height: 10 }} />
      {/* Display the numeric day value; apply different styling when selected */}
      <Text
        style={[
          styles.medium,
          { color: currentTheme.gray }, // Use theme text color
          selected === formattedDate && {
            color: currentTheme["101010"], // Selected text color
            fontWeight: 'bold',
            fontSize: 17,
          },
          selected === formattedDate && mode === 'Weekly' && {
            color: currentTheme["101010"], // Selected text color
            fontWeight: 'bold',
            fontSize: 17,
          }
        ]}
      >
        {dayNumber}
      </Text>
    </TouchableOpacity>
  );
};

export default Date;

// Define component-specific styles using StyleSheet.create
const styles = StyleSheet.create({
  // Style for the date card container
  card: {
    borderRadius: 10,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 0,
    marginVertical: 10,
    alignItems: 'center',
    height: 70,
    width: 70,
    marginHorizontal: 5,
  },
  // Base style for the day label text
  big: {
    fontWeight: 'regular',
    fontSize: 15,
  },
  // Base style for the day number text
  medium: {
    fontSize: 17,
  },
});