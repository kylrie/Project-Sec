import { saveUnifiedMessage } from './db.js';

export class ViberService {
  constructor() {
    this.botToken = process.env.VIBER_BOT_TOKEN || 'MOCK_VIBER_TOKEN_FRIDAY';
  }

  /**
   * Receive / Seed Incoming Viber Message
   */
  async receiveViberMessage(sender, body) {
    const msgId = 'viber_' + Date.now();
    const saved = await saveUnifiedMessage({
      id: msgId,
      platform: 'viber',
      sender,
      recipient: 'User',
      body,
      is_unread: 1,
      is_urgent: 0
    });

    return {
      message: saved,
      announcement: `Viber message from ${sender}: "${body}".`
    };
  }

  /**
   * Voice Draft & Send Viber Message
   */
  async sendViberMessage(recipient, body) {
    const msgId = 'viber_sent_' + Date.now();
    await saveUnifiedMessage({
      id: msgId,
      platform: 'viber',
      sender: 'User',
      recipient,
      body,
      is_unread: 0,
      is_urgent: 0
    });

    return {
      success: true,
      sentMessage: `Viber message sent to ${recipient}: "${body}".`
    };
  }
}

export const viberService = new ViberService();
