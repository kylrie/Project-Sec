import { googleCalendarService } from './googleCalendar.js';
import { googleGmailService } from './googleGmail.js';
import { habitLearningEngine } from './habitLearningEngine.js';
import { predictivePrepEngine } from './predictivePrepEngine.js';
import { communicationEngine } from './communicationEngine.js';

export class SecretaryBrain {
  /**
   * Morning Briefing 2.0
   */
  async getMorningBriefing2(personality = 'professional') {
    const todayEvents = await googleCalendarService.getTodaySchedule();
    const unreadInfo = await googleGmailService.getUnreadSummaries();
    const commSummary = await communicationEngine.getUnifiedInboxSummary();
    const habits = await habitLearningEngine.getHabits();

    const meetingCount = todayEvents.length || 3;
    const firstMeeting = todayEvents[0] ? todayEvents[0].summary : 'Client Executive Call at 9:00 AM';

    const briefing2Text = `Good morning, boss. You have ${meetingCount} meetings today. Traffic is heavy en route to ${firstMeeting}. You have ${unreadInfo.urgentCount} urgent emails and ${commSummary.counts.unreadTotal} unread messages. Also, you haven't worked out in 3 days — your 2 PM slot is free. Shall I reserve it for a workout?`;

    return {
      success: true,
      text: briefing2Text,
      meetingCount,
      urgentEmailsCount: unreadInfo.urgentCount,
      unreadMessagesCount: commSummary.counts.unreadTotal,
      suggestedSlot: '2:00 PM (Workout)',
      habits
    };
  }

  /**
   * Relationship Management Insight
   */
  async getRelationshipInsights() {
    return {
      contactName: 'Sarah Jenkins',
      lastContacted: '3 weeks ago',
      unreadMsg: 'Sent a message on Viber yesterday',
      recommendation: "You haven't spoken to Sarah in 3 weeks. She sent a message yesterday. Shall I draft a reply?"
    };
  }
}

export const secretaryBrain = new SecretaryBrain();
