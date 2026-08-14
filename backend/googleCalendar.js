import { cacheCalendarEvents, getCachedEvents } from './db.js';

// Initial Mock Calendar Seed for instant zero-config demonstration
const mockCalendarEvents = [
  {
    id: 'evt_001',
    summary: 'Client Sync & Product Demo',
    start_time: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(9, 45, 0, 0)).toISOString(),
    location: 'Conference Room Alpha',
    attendees: ['john@stark.com', 'sarah@acme.org'],
    meet_link: 'https://meet.google.com/xyz-friday-demo'
  },
  {
    id: 'evt_002',
    summary: 'Executive Board Strategy',
    start_time: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
    location: 'Stark Tower HQ',
    attendees: ['pepper@stark.com', 'rhodey@defense.gov'],
    meet_link: 'https://meet.google.com/stark-board'
  },
  {
    id: 'evt_003',
    summary: 'Dentist Appointment',
    start_time: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    location: 'Downtown Dental Care',
    attendees: [],
    meet_link: ''
  }
];

export class GoogleCalendarService {
  constructor() {
    this.events = [...mockCalendarEvents];
  }

  /**
   * Get events for a specific date (default: today)
   */
  async getTodaySchedule() {
    const now = new Date();
    const todayEvents = this.events.filter(e => {
      const d = new Date(e.start_time);
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    });
    
    if (todayEvents.length === 0) {
      const cached = await getCachedEvents();
      if (cached.length > 0) return cached;
    }

    return todayEvents;
  }

  /**
   * Conflict Detection
   * Checks if requested event overlaps with any existing calendar event.
   */
  checkConflicts(startTime, endTime) {
    const reqStart = new Date(startTime).getTime();
    const reqEnd = new Date(endTime).getTime();

    for (const evt of this.events) {
      const evtStart = new Date(evt.start_time).getTime();
      const evtEnd = new Date(evt.end_time).getTime();

      // Overlap check
      if (reqStart < evtEnd && reqEnd > evtStart) {
        return {
          hasConflict: true,
          conflictingEvent: evt,
          suggestedStartTime: new Date(evtEnd).toISOString(),
          suggestedEndTime: new Date(evtEnd + (reqEnd - reqStart)).toISOString()
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Create Calendar Event with automatic conflict check & invite creation
   */
  async createEvent({ summary, startTime, endTime, attendees = [], location = '' }) {
    const conflictInfo = this.checkConflicts(startTime, endTime);
    
    if (conflictInfo.hasConflict) {
      const conflictEvt = conflictInfo.conflictingEvent;
      const suggestedTimeStr = new Date(conflictInfo.suggestedStartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      
      return {
        success: false,
        conflict: true,
        conflictingEvent: conflictEvt,
        message: `You have a conflict: "${conflictEvt.summary}" is scheduled at that time. Would you like to schedule after at ${suggestedTimeStr}?`,
        suggestedStart: conflictInfo.suggestedStartTime,
        suggestedEnd: conflictInfo.suggestedEndTime
      };
    }

    const newEvent = {
      id: 'evt_' + Date.now(),
      summary: summary || 'New Meeting',
      start_time: startTime,
      end_time: endTime,
      location: location || 'Virtual Meeting',
      attendees: attendees,
      meet_link: `https://meet.google.com/fri-${Math.random().toString(36).substring(7)}`
    };

    this.events.push(newEvent);
    await cacheCalendarEvents(this.events);

    return {
      success: true,
      conflict: false,
      event: newEvent,
      message: `Event "${newEvent.summary}" scheduled for ${new Date(startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Invites dispatched.`
    };
  }

  /**
   * Smart Scheduling Slot Finder
   * Scans calendar for available 30, 45, or 60 minute free slots
   */
  findSmartSlots(durationMinutes = 45, maxOptions = 3) {
    const options = [];
    const now = new Date();
    
    // Scan next 3 days during business hours (9 AM - 5 PM)
    for (let day = 0; day < 3; day++) {
      const date = new Date(now);
      date.setDate(now.getDate() + day);

      for (let hour = 9; hour <= 16; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

        if (slotStart.getTime() > now.getTime()) {
          const conflict = this.checkConflicts(slotStart.toISOString(), slotEnd.toISOString());
          if (!conflict.hasConflict) {
            const dayName = slotStart.toLocaleDateString('en-US', { weekday: 'short' });
            const timeStr = slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            options.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              label: `${dayName} at ${timeStr}`
            });
            if (options.length >= maxOptions) break;
          }
        }
      }
      if (options.length >= maxOptions) break;
    }

    return options;
  }

  /**
   * Automated Daily Executive Morning Briefing
   */
  async getDailyBriefing(personality = 'professional') {
    const todayEvents = await this.getTodaySchedule();
    const count = todayEvents.length;

    if (count === 0) {
      return personality === 'casual'
        ? "Good morning, boss! Your schedule is completely clear today. Enjoy the open day!"
        : "Executive Morning Briefing: Zero meetings scheduled for today. All systems nominal.";
    }

    const firstEvt = todayEvents[0];
    const firstTime = new Date(firstEvt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    const eventSummaries = todayEvents
      .map(e => `${e.summary} at ${new Date(e.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`)
      .join(', ');

    if (personality === 'concise') {
      return `Good morning. ${count} meetings today. First: ${firstEvt.summary} at ${firstTime}.`;
    } else if (personality === 'casual') {
      return `Morning boss! You've got ${count} meetings lined up today. First up is ${firstEvt.summary} at ${firstTime}. Schedule: ${eventSummaries}.`;
    } else {
      return `Good morning, boss. Daily Briefing: You have ${count} scheduled commitments today. Your first item is "${firstEvt.summary}" at ${firstTime}. Overall schedule density is moderate.`;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
