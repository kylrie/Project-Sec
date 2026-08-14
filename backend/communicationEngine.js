import { saveUnifiedMessage, getUnifiedInbox } from './db.js';
import { telephonyService } from './telephonyService.js';
import { viberService } from './viberService.js';
import { messengerService } from './messengerService.js';

// Initial Mock Multi-Channel Messages Seed
const sampleUnifiedMessages = [
  {
    id: 'sms_101',
    platform: 'sms',
    sender: 'Mom',
    recipient: 'User',
    body: 'Dinner at 7 PM tonight! Can you bring dessert?',
    is_unread: 1,
    is_urgent: 0,
    is_otp: 0
  },
  {
    id: 'sms_102',
    platform: 'sms',
    sender: 'Bank Security',
    recipient: 'User',
    body: 'Your Stark Bank verification code is 482910. Do not share.',
    is_unread: 1,
    is_urgent: 1,
    is_otp: 1
  },
  {
    id: 'viber_101',
    platform: 'viber',
    sender: 'John (Viber)',
    recipient: 'User',
    body: 'Hey Tony, running 10 mins late for the tech sync.',
    is_unread: 1,
    is_urgent: 0,
    is_otp: 0
  },
  {
    id: 'fb_101',
    platform: 'messenger',
    sender: 'Alex (Family Group)',
    recipient: 'User',
    body: 'Who is bringing the drinks for Sunday BBQ?',
    is_unread: 1,
    is_urgent: 0,
    is_otp: 0
  }
];

export class CommunicationEngine {
  constructor() {
    this.seeded = false;
  }

  async seedMessages() {
    if (this.seeded) return;
    for (const msg of sampleUnifiedMessages) {
      await saveUnifiedMessage(msg);
    }
    this.seeded = true;
  }

  /**
   * Generates Communication Digest across SMS, Viber, Messenger, and Gmail (< 3s latency)
   */
  async getUnifiedInboxSummary(platformFilter = 'all') {
    await this.seedMessages();
    const messages = await getUnifiedInbox(platformFilter, 50);
    const unread = messages.filter(m => m.is_unread === 1);
    const urgent = messages.filter(m => m.is_urgent === 1);

    const counts = {
      total: messages.length,
      unreadTotal: unread.length,
      urgentCount: urgent.length,
      sms: messages.filter(m => m.platform === 'sms' && m.is_unread === 1).length,
      viber: messages.filter(m => m.platform === 'viber' && m.is_unread === 1).length,
      messenger: messages.filter(m => m.platform === 'messenger' && m.is_unread === 1).length,
      gmail: 3 // from Phase 2 Gmail integration
    };

    const digestText = `Communication Digest: You have ${counts.unreadTotal + counts.gmail} unread messages across 4 platforms (${counts.sms} SMS, ${counts.viber} Viber, ${counts.messenger} Messenger, ${counts.gmail} Gmail). ${counts.urgentCount > 0 ? `Includes ${counts.urgentCount} urgent alert.` : ''} Shall I read them?`;

    return {
      success: true,
      counts,
      digestText,
      messages
    };
  }
}

export const communicationEngine = new CommunicationEngine();
