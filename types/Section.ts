import { Tracker } from "./Tracker";
import { TimePeriod } from "./Tracker";

export class Section{
    position: number;
    sectionTitle: string;
    size: number = 0;
    trackers: Tracker[] = [];
    timePeriod: TimePeriod;
    lastModified: number;

    constructor(sectionTitle: string,timePeriod: TimePeriod, position: number, trackers: Tracker[], size: number, lastModified: number){
        this.sectionTitle = sectionTitle;
        this.timePeriod = timePeriod;
        this.position = position;
        this.lastModified = lastModified;
    }
}

