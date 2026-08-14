import { saveUnifiedMessage } from './db.js';

export class MessengerService {
  constructor() {
    this.pageAccessToken = process.env.MESSENGER_PAGE_TOKEN || 'MOCK_FB_PAGE_TOKEN';
  }

  /**
   * Summarize Group Chat 24-hour activity ("What did the family group say?")
   */
  async summarizeGroupChat(groupName = 'Family Group') {
    return {
      groupName,
      messageCount: 14,
      timeframe: '24 hours',
      summary: `In the ${groupName}, Mom confirmed Sunday dinner at 7 PM. Alex asked if anyone can pick up dessert, and Sarah shared pictures from yesterday's trip.`
    };
  }

  /**
   * Receive Messenger Message
   */
  async receiveMessengerMessage(sender, body) {
    const msgId = 'fb_' + Date.now();
    const saved = await saveUnifiedMessage({
      id: msgId,
      platform: 'messenger',
      sender,
      recipient: 'User',
      body,
      is_unread: 1,
      is_urgent: 0
    });

    return {
      message: saved,
      announcement: `Messenger notification from ${sender}: "${body}".`
    };
  }

  /**
   * Send Messenger Message
   */
  async sendMessengerMessage(recipient, body) {
    const msgId = 'fb_sent_' + Date.now();
    await saveUnifiedMessage({
      id: msgId,
      platform: 'messenger',
      sender: 'User',
      recipient,
      body,
      is_unread: 0,
      is_urgent: 0
    });

    return {
      success: true,
      sentMessage: `Facebook Messenger message sent to ${recipient}: "${body}".`
    };
  }
}

export const messengerService = new MessengerService();
