export class Tracker { //export so referencable
    trackerName: string;
    icon: string; // Assuming it's a URL
    timePeriod: TimePeriod; // Enum alternative
    currentAmount: number;
    last_modified: number;
    unit?: string; // Optional field
    bound: number; //- if limit, +if goal, 0 if neither
    
    constructor(trackerName: string, icon: string, timePeriod: TimePeriod, last_modified: number, bound: number, unit?: string);
    constructor(trackerName: string, icon: string, timePeriod: TimePeriod, last_modified: number, bound: number,  unit: string | undefined, currentAmount: number,);
    constructor(
      trackerName: string,
      icon: string,
      timePeriod: TimePeriod,
      last_modified: number,
      bound: number,
      unit?: string,
      currentAmount?: number,
    ) {
      this.trackerName = trackerName;
      this.icon = icon;
      this.timePeriod = timePeriod;
      this.last_modified = last_modified;
      this.bound = bound;
      this.currentAmount = currentAmount ? currentAmount : 0;
      this.unit = unit;
    }

}

export type TimePeriod = 'Daily' | 'Weekly' | 'Monthly'; 