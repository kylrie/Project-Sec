import { googleCalendarService } from './googleCalendar.js';
import { googleGmailService } from './googleGmail.js';
import { googleTasksService } from './googleTasks.js';

class WorkspaceEngine {
  constructor() {
    this.recentEventContext = null;
    this.recentEmailContext = null;
  }

  /**
   * Updates context memory when user queries or interacts with specific items
   */
  setEventContext(event) {
    this.recentEventContext = event;
  }

  setEmailContext(email) {
    this.recentEmailContext = email;
  }

  getEventContext() {
    return this.recentEventContext;
  }

  getEmailContext() {
    return this.recentEmailContext;
  }

  /**
   * Generates proactive notifications (10-minute pre-meeting alerts & urgent email flags)
   */
  async getProactiveAlerts() {
    const alerts = [];
    const now = Date.now();

    // 1. Check for upcoming meetings starting within 10 minutes
    const todayEvents = await googleCalendarService.getTodaySchedule();
    for (const evt of todayEvents) {
      const startTime = new Date(evt.start_time).getTime();
      const diffMinutes = Math.round((startTime - now) / (60 * 1000));

      if (diffMinutes > 0 && diffMinutes <= 15) {
        alerts.push({
          id: 'alert_evt_' + evt.id,
          type: 'MEETING_10MIN',
          title: `Meeting Starting Soon: ${evt.summary}`,
          message: `"${evt.summary}" starts in ${diffMinutes} minutes. Join Google Meet?`,
          meet_link: evt.meet_link,
          time_str: new Date(evt.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        });
      }
    }

    // 2. Check for urgent emails
    const unreadData = await googleGmailService.getUnreadSummaries();
    if (unreadData.urgentCount > 0 && unreadData.emails) {
      const topUrgent = unreadData.emails[0];
      alerts.push({
        id: 'alert_email_' + topUrgent.id,
        type: 'URGENT_EMAIL',
        title: `Urgent Email: ${topUrgent.from.split('<')[0].trim()}`,
        message: `Unread email from ${topUrgent.from.split('<')[0].trim()}: "${topUrgent.subject}"`,
        snippet: topUrgent.snippet
      });
    }

    return alerts;
  }
}

export const workspaceEngine = new WorkspaceEngine();
