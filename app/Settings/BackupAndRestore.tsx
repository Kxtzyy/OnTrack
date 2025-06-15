import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useTheme } from "../Contexts/ThemeContext";
import { createClient } from "@supabase/supabase-js";
import { openDatabase } from "@/storage/sqlite";
import {useAuth} from '@/app/Contexts/LoginContext'
import {setupDatabase} from "@/components/ZustandRefresh";
import { router } from "expo-router";

const supabaseUrl = 'https://fffxxiuqbfoitlnlqyxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZnh4aXVxYmZvaXRsbmxxeXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1OTU2NTIsImV4cCI6MjA1ODE3MTY1Mn0.Ak-pzqJ9NweyWdF7np4s-8BT7cKebyNRlQyyV-M5wIA';
export const supabase = createClient(supabaseUrl, supabaseKey);


export default function AccountSettings() {
  const { currentTheme: theme } = useTheme();
  const { user } = useAuth();

  const handleBackup = async () => {
    const db = await openDatabase();
    if (user===null){
        console.log("Not logged in")
    } else{

        const { data, error } = await supabase
        .from('Users')
        .select('user_id')
        .eq('email', user.email)  // or use 'username' if that's what you have
        .single(); // returns one row instead of array
        if (error) {
        console.error("Failed to get user_id:", error);
        } else {
        const user_id = data.user_id;
        console.log("User ID is:", user_id);
        }

        if (data) try {

            const rows = await db.getAllAsync('SELECT tracker_id, tracker_name, icon, time_period, unit, bound_amount, current_amount, last_modified FROM trackers');
            const sections = await db.getAllAsync('SELECT section_id, section_title, time_period, position, last_modified FROM sections');
            const sectionTrackers = await db.getAllAsync('SELECT relation_id, section_id, tracker_id, tracker_position, last_modified FROM section_trackers');
            console.log(sectionTrackers)
            const rowsWithUser = rows.map((row: any) => ({
                ...row,
                user_id: data.user_id,
              }));

              const sectionsWithUser = sections.map((section: any) => ({
                ...section,
                user_id: data.user_id,
              }));

              const sectionTrackersWithUser = sectionTrackers.map((sectionTracker: any) => ({
                ...sectionTracker,
                user_id: data.user_id,
              }));


            const { error:trackerError } = await supabase.from('Trackers').upsert(rowsWithUser, { onConflict: 'user_id,tracker_id' });
            if (trackerError) {
                console.error("Tracker Error:", trackerError);
                return;
              }

            const { error:sectionError } = await supabase.from('Sections').upsert(sectionsWithUser, { onConflict: 'user_id,section_id' });
            if (sectionError) {
                console.error("Section Error:", sectionError);
                return;
              }
            const { error:sectionTrackerError } = await supabase.from('Section_Trackers').upsert(sectionTrackersWithUser, { onConflict: 'user_id,tracker_id,section_id' });
            if (sectionTrackerError) {
                console.error("SectionTracker Error:", sectionTrackerError);
                return;
              }

            if (trackerError || sectionError || sectionTrackerError) {
                console.error('Tracker Error:', trackerError);
                console.error('Section Error:', sectionError);
                console.error('SectionTracker Error:', sectionTrackerError);
            } else {
              console.log('Upload successful');
              await Alert.alert(
                "Data Uploaded",
                "Your data has been backed up to the cloud.",
                [
                  { text: "Okay", style: "cancel" },
                ],
                { cancelable: true }
              )
                router.back();
            }
          } catch (err) {
            console.error('Unexpected error:', err);
            }
        }
      };

  const handleRestore = async () => {
      // Get the current user
    if (user===null){
        console.log("Not logged in")
    } else{

        const { data, error } = await supabase
        .from('Users')
        .select('user_id')
        .eq('email', user.email)  // or use 'username' if that's what you have
        .single(); // returns one row instead of array
        if (error) {
        console.error("Failed to get user_id:", error);
        } else {
        const user_id = data.user_id;
        console.log("User ID is:", user_id);
        }

  const db = await openDatabase();

  if (data) try {
    // Step 1: Fetch data from Supabase tables
    const { data: trackers, error: trackerError } = await supabase
      .from("Trackers")
      .select("tracker_id, tracker_name, icon, time_period, unit, bound_amount, current_amount, last_modified")
      .eq("user_id", data.user_id); // Filter by user_id

    if (trackerError) {
      console.error("Error fetching Trackers:", trackerError);
      return;
    }

    const { data: sections, error: sectionError } = await supabase
      .from("Sections")
      .select("section_id, section_title, time_period, position, last_modified")
      .eq("user_id", data.user_id);

    if (sectionError) {
      console.error("Error fetching Sections:", sectionError);
      return;
    }

    const { data: sectionTrackers, error: sectionTrackerError } = await supabase
      .from("Section_Trackers")
      .select("relation_id, section_id, tracker_id, tracker_position, last_modified")
      .eq("user_id", data.user_id);

    if (sectionTrackerError) {
      console.error("Error fetching Section_Trackers:", sectionTrackerError);
      return;
    }

    await db.runAsync('DELETE FROM trackers');
    await db.runAsync('DELETE FROM sections');
    await db.runAsync('DELETE FROM section_trackers');
    // Step 2: Populate SQLite database
    // Insert Trackers data into SQLite
    const trackerInsertPromises = trackers.map((tracker: any) => {
      return db.runAsync(
        'INSERT INTO trackers (tracker_id, tracker_name, icon, time_period, unit, bound_amount, current_amount, last_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          tracker.tracker_id,
          tracker.tracker_name,
          tracker.icon,
          tracker.time_period,
          tracker.unit,
          tracker.bound_amount,
          tracker.current_amount,
          tracker.last_modified
        ]
      );
    });

    await Promise.all(trackerInsertPromises);

    // Insert Sections data into SQLite
    const sectionInsertPromises = sections.map((section: any) => {
      return db.runAsync(
        'INSERT INTO sections (section_id, section_title, time_period, position, last_modified) VALUES (?, ?, ?, ?, ?)',
        [
          section.section_id,
          section.section_title,
          section.time_period,
          section.position,
          section.last_modified
        ]
      );
    });

    await Promise.all(sectionInsertPromises);

    // Insert Section_Trackers data into SQLite
    const sectionTrackerInsertPromises = sectionTrackers.map((sectionTracker: any) => {
      return db.runAsync(
        'INSERT INTO section_trackers (relation_id, section_id, tracker_id, tracker_position, last_modified) VALUES (?, ?, ?, ?, ?)',
        [
          sectionTracker.relation_id,
          sectionTracker.section_id,
          sectionTracker.tracker_id,
          sectionTracker.tracker_position,
          sectionTracker.last_modified
        ]
      );
    });

    await Promise.all(sectionTrackerInsertPromises);

    console.log(sectionTrackerInsertPromises);
    console.log(trackerInsertPromises);
    setupDatabase();
    Alert.alert(
                  "Data Restored",
                  "Your data has been restored from the cloud.",
                  [
                    { text: "Okay", style: "cancel" },
                  ],
                  { cancelable: true }
                )
    router.back();
    console.log("SQLite database successfully populated with Supabase data!");
  } catch (err) {
    console.error("Error populating SQLite database:", err);
  }
};
  };

  return (
    <View style={[styles.container, { backgroundColor: theme["101010"] }]}>
      <Text style={[styles.header, { color: theme["FFFFFF"] }]}>Backup and Restore</Text>

      <Pressable style={[styles.button, { backgroundColor: theme["101010"] }]} onPress={handleBackup}>
        <Text style={[styles.buttonText, { color: theme["FFFFFF"] }]}>Backup Data</Text>
      </Pressable>

      <Pressable style={[styles.button, { backgroundColor: theme["101010"] }]} onPress={handleRestore}>
        <Text style={[styles.buttonText, { color: theme["FFFFFF"] }]}>Restore Data</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "red",
  },
});