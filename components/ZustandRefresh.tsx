import { openDatabase } from "@/storage/sqlite";
import {TimePeriod, Tracker } from "@/types/Tracker";
import { Section } from "@/types/Section";
import { useSectionStore, useTrackerStore } from "@/storage/store";
import { SQLiteDatabase } from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";

moment.updateLocale('en', {
  week: { dow: 1, // Monday is the first day of the week
  },
});

export type SectionRow = {
  section_id: number;
  section_title: string;
  time_period: TimePeriod;
  position: number;
  last_modified: number;
};

export type TrackerRow = {
  tracker_id: number;
  tracker_name: string;
  icon: string;
  time_period: TimePeriod;
  last_modified: number;
  bound_amount: number;
  unit?: string;
  current_amount?: number;
};

export type SectionTrackerRelation = {
  section_id: number,
  tracker_id: number,
  tracker_position: number,
};

//If new date threshold passed
async function checkIfNewDay() {
  const lastDateStr = await AsyncStorage.getItem('lastActiveDate');
  const todayStr = moment().format("YYYY-MM-DD");; // 'Fri Apr 26 2025'

  if (!lastDateStr) { //First time, dont set
      await AsyncStorage.setItem('lastActiveDate', todayStr);
      return false;
    }

  if (lastDateStr !== todayStr) {//New date
    await AsyncStorage.setItem('lastActiveDate', todayStr);
    return true;
  } else {
    return false;
  }
}

async function checkIfNewWeek() {
  const lastWeekStr = await AsyncStorage.getItem('lastActiveWeek');
  const mondayThisWeek = moment().startOf('isoWeek').format("YYYY-MM-DD");

  if (!lastWeekStr) {
    await AsyncStorage.setItem('lastActiveWeek', mondayThisWeek);
    return false;
  }

  if (lastWeekStr !== mondayThisWeek) {
    await AsyncStorage.setItem('lastActiveWeek', mondayThisWeek);
    return true;
  } else {
    return false;
  }
}

async function checkIfNewMonth() {
  const lastMonthStr = await AsyncStorage.getItem('lastActiveMonth');
  
  const monthStr = moment().startOf('month').format("YYYY-MM-DD"); 

  if (!lastMonthStr) {
    await AsyncStorage.setItem('lastActiveMonth', monthStr);
    return false;
  }

  if (lastMonthStr !== monthStr) {
    await AsyncStorage.setItem('lastActiveMonth', monthStr);
    return true;
  } else {
    return false;
  }
}




export const setupDatabase = async (): Promise<SQLiteDatabase | null> => {
  const lastDateStr = await AsyncStorage.getItem('lastActiveDate');
  const lastWeekStr = await AsyncStorage.getItem('lastActiveWeek');
  const lastMonthStr = await AsyncStorage.getItem('lastActiveMonth')
  var isNewDay = false;
  var isNewWeek = false;
  var isNewMonth = false;
  try {
    const db = await openDatabase();
    (async () => {
      isNewDay = await checkIfNewDay();
      isNewWeek = await checkIfNewWeek();
      isNewMonth = await checkIfNewMonth();

      if (isNewDay) {
        console.log('New day!');
          try{
          const trackersToChange = await  db.getAllAsync(
            `SELECT tracker_id, last_modified, bound_amount, current_amount, unit
            FROM trackers
            WHERE time_period = ? AND (current_amount != 0)`,
          ["Daily"]) as {tracker_id: number, last_modified: number, bound_amount : number, current_amount: number, unit: string}[];

          await db.runAsync(
            `UPDATE trackers
            SET current_amount = 0
            WHERE time_period = ? AND (current_amount != 0)`,
            ["Daily"]
          )

          for (const row of trackersToChange){
          
          const existingRecord = await db.getFirstAsync(
            `SELECT 1 FROM tracker_history WHERE tracker_id = ? AND date = ?`,
            [row.tracker_id, lastDateStr]
          );

          if(!existingRecord){
          
          await db.runAsync(
            `INSERT INTO tracker_history
               (tracker_id,date,bound_amount,current_amount,unit,last_modified)
             VALUES (?,?,?,?,?,?)`,
            [
              row.tracker_id,
              lastDateStr,
              row.bound_amount,
              row.current_amount,
              row.unit ?? null,
              Date.now(),
            ],
          );
        };
        try {
          // Fetch all records from the tracker_history table
          const trackerHistory = await db.getAllAsync(
            `SELECT * FROM tracker_history`
          );
      
          // Log each record to the console
          console.log('All tracker_history records:');
          trackerHistory.forEach(record => {
            console.log(record);
          });
        } catch (err) {
          console.error("Error fetching tracker_history records: ", err);
        }
        
          trackersToChange.forEach(t => {
            console.log("tracked_id: "+t.tracker_id);
          });
        }
        }catch(e){console.log(e)};
      }
      if (isNewWeek) {
        console.log('New Week!');
        try{
          const trackersToChange = await  db.getAllAsync(
            `SELECT tracker_id, last_modified, bound_amount, current_amount, unit
            FROM trackers
            WHERE time_period = ? AND (current_amount != 0)`,
          ["Weekly"]) as {tracker_id: number, last_modified: number, bound_amount : number, current_amount: number, unit: string}[];

          await db.runAsync(
            `UPDATE trackers
            SET current_amount = 0
            WHERE time_period = ? AND (current_amount != 0)`,
            ["Weekly"]
          )

          for (const row of trackersToChange){
          
          const existingRecord = await db.getFirstAsync(
            `SELECT 1 FROM tracker_history WHERE tracker_id = ? AND date = ?`,
            [row.tracker_id, lastWeekStr]
          );

          if(!existingRecord){
          
          await db.runAsync(
            `INSERT INTO tracker_history
               (tracker_id,date,bound_amount,current_amount,unit,last_modified)
             VALUES (?,?,?,?,?,?)`,
            [
              row.tracker_id,
              lastWeekStr,
              row.bound_amount,
              row.current_amount,
              row.unit ?? null,
              Date.now(),
            ],
          );
        };
        try {
          // Fetch all records from the tracker_history table
          const trackerHistory = await db.getAllAsync(
            `SELECT * FROM tracker_history`
          );
      
          // Log each record to the console
          console.log('All tracker_history records:');
          trackerHistory.forEach(record => {
            console.log(record);
          });
        } catch (err) {
          console.error("Error fetching tracker_history records: ", err);
        }
        
          trackersToChange.forEach(t => {
            console.log("tracked_id: "+t.tracker_id);
          });
        }
        }catch(e){console.log(e)};
      }
      if (isNewMonth) {
        console.log('New Month!');
        try{
          const trackersToChange = await  db.getAllAsync(
            `SELECT tracker_id, last_modified, bound_amount, current_amount, unit
            FROM trackers
            WHERE time_period = ? AND (current_amount != 0)`,
          ["Monthly"]) as {tracker_id: number, last_modified: number, bound_amount : number, current_amount: number, unit: string}[];

          await db.runAsync(
            `UPDATE trackers
            SET current_amount = 0
            WHERE time_period = ? AND (current_amount != 0)`,
            ["Monthly"]
          )

          for (const row of trackersToChange){
          
          const existingRecord = await db.getFirstAsync(
            `SELECT 1 FROM tracker_history WHERE tracker_id = ? AND date = ?`,
            [row.tracker_id, lastMonthStr]
          );

          if(!existingRecord){
          
          await db.runAsync(
            `INSERT INTO tracker_history
               (tracker_id,date,bound_amount,current_amount,unit,last_modified)
             VALUES (?,?,?,?,?,?)`,
            [
              row.tracker_id,
              lastMonthStr,
              row.bound_amount,
              row.current_amount,
              row.unit ?? null,
              Date.now(),
            ],
          );
        };
        try {
          // Fetch all records from the tracker_history table
          const trackerHistory = await db.getAllAsync(
            `SELECT * FROM tracker_history`
          );
      
          // Log each record to the console
          console.log('All tracker_history records:');
          trackerHistory.forEach(record => {
            console.log(record);
          });
        } catch (err) {
          console.error("Error fetching tracker_history records: ", err);
        }
        
          trackersToChange.forEach(t => {
            console.log("tracked_id: "+t.tracker_id);
          });
        }
        }catch(e){console.log(e)};
        }
    })();

    console.log("Database initialized");

    const trackersInfo: TrackerRow[] = await db.getAllAsync("SELECT tracker_id,tracker_name,icon,time_period,unit,bound_amount,current_amount,last_modified FROM trackers");
    if (isNewDay){ //reset values to 0 if new threshold reached
      trackersInfo.forEach(t => {
        t.current_amount = (t.time_period === "Daily") ? 0 : t.current_amount;
      });
    }
    if (isNewWeek){
      trackersInfo.forEach(t => {
        t.current_amount = (t.time_period === "Weekly") ? 0 : t.current_amount;
      });
    }
    if (isNewDay){
      trackersInfo.forEach(t => {
        t.current_amount = (t.time_period === "Monthly") ? 0 : t.current_amount;
      });
    }
    const sectionsInfo: SectionRow[] = await db.getAllAsync("SELECT section_id,section_title,time_period,position,last_modified FROM sections");
    const sectionTrackersInfo: SectionTrackerRelation[] = await db.getAllAsync("SELECT section_id,tracker_id,tracker_position FROM section_trackers");

    console.log("SECTIONS: ")
    sectionsInfo.forEach(section => {
      console.log(section.section_title +" pos: " + section.position+ " id: "+section.section_id)
    });

    console.log("TRACKERS: ")
    trackersInfo.forEach(tracker => {
      console.log(tracker.tracker_name+" id: "+tracker.tracker_id)
    });

    console.log("RELATIONS: ")
    sectionTrackersInfo.forEach(relation => {
      console.log("sectionID: "+relation.section_id+" trackerID: "+relation.tracker_id+" position: "+relation.tracker_position)
    });

    const { setTrackers, addTracker, getTracker } = useTrackerStore.getState();
    const { setSectionsH, addSectionH, initialAddTrackerToSection } = useSectionStore.getState();

    // Clear existing state
    setTrackers([]);
    setSectionsH([]);

    var trackersDBFormat: Tracker[] = []; //initialize trackers in db format to set
    const trackers: TrackerRow[] = trackersInfo.map((tracker) => {
      const newTracker = new Tracker(
        tracker.tracker_name,
        tracker.icon,
        tracker.time_period,
        tracker.last_modified,
        tracker.bound_amount,
        tracker.unit,
        tracker.current_amount ?? 0
      );
      //addTracker(newTracker);
      trackersDBFormat.push(newTracker);
      return tracker;
    });
    setTrackers(trackersDBFormat);


    var sectionsDBFormat: Section[] = []; //initialize trackers in db format to set
    const sections: SectionRow[] = sectionsInfo.map((section) => {
      const newSection = new Section(
        section.section_title,
        section.time_period,
        section.position,
        [],
        0,
        section.last_modified
      );
      sectionsDBFormat.push(newSection);
      return section;
    });
    setSectionsH(sectionsDBFormat)


    sections.sort((a, b) => a.position - b.position);
    sections.forEach((section) => {
      const trackersInSection = sectionTrackersInfo
        .filter((st) => st.section_id === section.section_id)
        .sort((a, b) => a.tracker_position - b.tracker_position);
      trackersInSection.forEach((trackerInS) => {
        const trackerRow = trackers.find((t) => t.tracker_id === trackerInS.tracker_id);
        if (trackerRow) {
          const tracker = getTracker(trackerRow.tracker_name, trackerRow.time_period);
          if (tracker) {
            initialAddTrackerToSection(section.section_title, section.time_period, tracker);
          }
        }
      });
    });
    return db;
  } catch (error) {
    console.error("Database error:", error);
  }
  return null;
  
};