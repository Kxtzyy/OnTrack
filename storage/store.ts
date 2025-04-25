import { create } from 'zustand'
import { TimePeriod, Tracker } from '@/types/Tracker'
import { Section } from '@/types/Section'
import { openDatabase } from '@/storage/sqlite' 
import { SectionRow } from '@/components/ZustandRefresh'

// Tracker Store section
type TrackersStore = {
  trackers: Tracker[]
    setTrackers: (newTrackers: Tracker[]) => void
    addTracker: (tracker: Tracker) => Promise<void>
    getTracker: (name: string, timePeriod: string) => Tracker | undefined
    addTracker2: (tracker: Tracker) => void
    incrementTracker: (trackerName: string, timePeriod: TimePeriod, change?: number) => Promise<void> 
}

export const useTrackerStore = create<TrackersStore>((set, get) => ({
    // State
    trackers: [],
  
    // Actions
    setTrackers: (newTrackers) => set({ trackers: newTrackers }),
  
    // Persists brand new tracker
    addTracker: async (tracker) => {
      // Local state
      set(state => ({ trackers: [...state.trackers, tracker] }));
  
      // Updates database
      const db = await openDatabase();
      await db.runAsync(
        `INSERT INTO trackers
           (tracker_name, icon, time_period, unit,
            bound_amount, current_amount, last_modified)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tracker.trackerName,
          tracker.icon,
          tracker.timePeriod,
          tracker.unit ?? null,
          tracker.bound,
          tracker.currentAmount,
          tracker.last_modified,
        ],
      );
    },
  
    // Non persistent helper
    addTracker2: (tracker) =>
      set(state => ({ trackers: [...state.trackers, tracker] })),
  
    // Retrieve single tracker
    getTracker: (name, timePeriod) =>
      get().trackers.find(
        (t) => t.trackerName === name && t.timePeriod === timePeriod,
      ),
  
    // Adds change to current amount 
    incrementTracker: async (name, timePeriod, change = 1) => {
        set(state => {
          // mutates object we have already
          state.trackers.forEach(t => {
            if (t.trackerName === name && t.timePeriod === timePeriod) {
              t.currentAmount  = (t.currentAmount ?? 0) + change;
              t.last_modified  = Date.now();
            }
          });
      
          // Gvie zustand new array so it re renders
          return { trackers: [...state.trackers] };   
        });
    
        // Update database
        const db = await openDatabase();
        await db.runAsync(
        `UPDATE trackers
            SET current_amount = current_amount + ?,
                last_modified = ?
        WHERE tracker_name = ? AND time_period = ?`,
        [change, Date.now(), name, timePeriod],
        );
    },
  
  }));
  

// Section Store section
type SectionsHomeStore = {
  sectionsH: Section[]
  setSectionsH: (newSectionsH: Section[]) => void
  addSectionH: (sectionH: Section) => Promise<void>
  moveSectionBy: (sectionH: Section, posChange: number) => void
  removeSectionH: (sectionHToRemove: Section) => void
  addTrackerToSection: (sectionTitle: string, time_period: string, tracker: Tracker) => Promise<void>
  initialAddTrackerToSection: (sectionTitle: string, time_period: string, tracker: Tracker) => void
}

export const useSectionStore = create<SectionsHomeStore>((set, get) => ({
  sectionsH: [],

  setSectionsH: (newSectionsH) => set({ sectionsH: newSectionsH }),

  addSectionH: async (sectionH) => {
    const db = await openDatabase();
    await db.runAsync(
        `INSERT INTO sections (section_title, time_period, position, last_modified)
         VALUES (?, ?, ?, ?)`,
        [sectionH.sectionTitle, sectionH.timePeriod, sectionH.position, sectionH.lastModified]
      );      

    set((state) => ({
      sectionsH: [...state.sectionsH, sectionH]
    }));

    
  },

  moveSectionBy: async(section,posChange) => {
    if (posChange === 0) return;

    const currentPos = section.position;
    const targetPos = currentPos+posChange;

    const {sectionsH} = get();

    const updatedSections = sectionsH.map((s) => { //move section to position
        if (s.sectionTitle === section.sectionTitle && s.timePeriod === section.timePeriod) {
            return { ...s, position: targetPos };
          }

          //displace other ones
          if ( //moving down
            targetPos > currentPos &&
            s.position > currentPos &&
            s.position <= targetPos
          ) {
            return { ...s, position: s.position - 1 };
          }

          // Displace others (moving up)
        if (
            targetPos < currentPos &&
            s.position < currentPos &&
            s.position >= targetPos
         ) {
            return { ...s, position: s.position + 1 };
        }
        return s;
    });

    try{
    //Move in database
    const db = await openDatabase();

    //Firstly delete from database
    const section_idFetched = await db.getFirstAsync(
        `SELECT section_id FROM sections
        WHERE section_title = ? AND time_period = ?`,
        [section.sectionTitle,section.timePeriod]
    ) as {section_id: number};

    const section_id: number = section_idFetched!.section_id;

    //const section_id: number = section_idFetched!
    await db.runAsync(
        `DELETE FROM sections
        WHERE section_title = ? AND time_period = ?`,
        [section.sectionTitle,section.timePeriod]
    );

    if(posChange > 0){
        await db.runAsync(
            `UPDATE sections
                SET position = position - 1, last_modified = ?
            WHERE position > ?`,
            [Date.now(), section.position]
        );
    }else if(posChange < 0){
        await db.runAsync(
            `UPDATE sections
                SET position = position + 1, Last_modified = ?
            WHERE position < ?`,
            [Date.now(), section.position]
        );
    }
    await db.runAsync(
        `INSERT INTO sections (section_id, section_title, time_period, position, last_modified)
       VALUES (?, ?, ?, ?, ?)`,
      [section_id, section.sectionTitle, section.timePeriod, targetPos, Date.now()]
    );
    }catch(error) {console.error("didnt write to database");}
},

  removeSectionH: (sectionHToRemove) => set((state) => ({
    sectionsH: state.sectionsH.filter((s) => s !== sectionHToRemove)
  })),

  addTrackerToSection: async (sectionTitle, time_period, tracker) => {
    const db = await openDatabase();
    let newSection: Section | undefined;
    
    set((state) => {
        const section = state.sectionsH.find(section =>
          section.timePeriod === time_period && section.sectionTitle === sectionTitle
        );
        if (section) {
            newSection = section;
          return {
            sectionsH: state.sectionsH.map(s =>
              s === section
                ? {
                  ...s,
                  trackers: [...s.trackers, tracker],
                  size: s.size + 1,
                } as Section
                : s
            )
          };
        }
        return { sectionsH: state.sectionsH };
      });
    if(!newSection) return;

    const [{ section_id }] = await db.getAllAsync<{ section_id: number }>(
      `SELECT section_id FROM sections WHERE section_title = ? AND time_period = ?`,
      [sectionTitle, time_period]
    );
    const [{ tracker_id }] = await db.getAllAsync<{ tracker_id: number }>(
      `SELECT tracker_id FROM trackers WHERE tracker_name = ? AND time_period = ?`,
      [tracker.trackerName, tracker.timePeriod]
    );
    try{
    await db.runAsync(
      `INSERT INTO section_trackers (section_id, tracker_id, tracker_position, last_modified)
       VALUES (?, ?, ?, ?)`,
      [section_id, tracker_id, newSection.trackers.length - 1, Date.now()]
    )}catch(error){
        console.log(error);
    };
  },



  initialAddTrackerToSection: (sectionTitle, time_period, tracker) => set((state) => {
    const section = state.sectionsH.find(section =>
      section.timePeriod === time_period && section.sectionTitle === sectionTitle
    );
    if (section) {
      return {
        sectionsH: state.sectionsH.map(s =>
          s === section
            ? {
              ...s,
              trackers: [...s.trackers, tracker],
              size: s.size + 1,
            } as Section
            : s
        )
      };
    }
    return { sectionsH: state.sectionsH };
  }),
}));
