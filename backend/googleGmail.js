import { createEmailDraft, getPendingDrafts, updateDraftStatus } from './db.js';

// Initial Mock Gmail Inbox Seed for instant demonstration
const mockUnreadEmails = [
  {
    id: 'msg_001',
    from: 'Pepper Potts <pepper@stark.com>',
    subject: 'URGENT: Q3 Financial Audit Sign-Off',
    snippet: 'Tony, we need your final signature on the Q3 audit report by 5 PM today or the SEC filing gets delayed.',
    is_unread: true,
    is_urgent: true,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'msg_002',
    from: 'Sarah Jenkins <sarah@acme.org>',
    subject: 'Revised Budget & Deliverable Specs',
    snippet: 'Attached is the updated project budget breakdown for the Q4 launch. Please review the hardware line items.',
    is_unread: true,
    is_urgent: false,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'msg_003',
    from: 'GitHub Notifications <notifications@github.com>',
    subject: 'Build #841 Succeeded on main branch',
    snippet: 'All 42 integration test suites passed in 14 seconds.',
    is_unread: true,
    is_urgent: false,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  }
];

export class GoogleGmailService {
  constructor() {
    this.inbox = [...mockUnreadEmails];
  }

  /**
   * Summarize unread emails with 1-sentence summaries prioritized by urgency
   */
  async getUnreadSummaries() {
    const unread = this.inbox.filter(e => e.is_unread);
    
    if (unread.length === 0) {
      return {
        count: 0,
        summaryText: "Your inbox is clear. You have no unread emails, boss."
      };
    }

    // Sort by urgency first, then recency
    const sorted = [...unread].sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0));

    const summaries = sorted.map((email) => {
      const senderName = email.from.split('<')[0].trim();
      return `${email.is_urgent ? 'URGENT from ' : 'From '}${senderName}: "${email.subject}" — ${email.snippet}`;
    });

    const urgentCount = sorted.filter(e => e.is_urgent).length;
    const summaryText = `You have ${unread.length} unread email${unread.length > 1 ? 's' : ''}${urgentCount > 0 ? `, including ${urgentCount} urgent alert` : ''}. ${summaries.slice(0, 3).join('. ')}`;

    return {
      count: unread.length,
      urgentCount,
      summaryText,
      emails: sorted
    };
  }

  /**
   * Urgent Triage Check
   */
  async getUrgentEmails() {
    const urgent = this.inbox.filter(e => e.is_unread && (e.is_urgent || e.subject.toLowerCase().includes('urgent') || e.snippet.toLowerCase().includes('asap')));
    
    if (urgent.length === 0) {
      return "No urgent emails flagged in your inbox right now.";
    }

    const first = urgent[0];
    const sender = first.from.split('<')[0].trim();
    return `Urgent alert: You have an unread email from ${sender} regarding "${first.subject}". Snippet: "${first.snippet}"`;
  }

  /**
   * Search Email
   */
  async searchEmails(query) {
    const q = query.toLowerCase();
    const matches = this.inbox.filter(e => 
      e.from.toLowerCase().includes(q) || 
      e.subject.toLowerCase().includes(q) || 
      e.snippet.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      return `No emails found matching query "${query}".`;
    }

    const topMatch = matches[0];
    return `Found ${matches.length} matching email${matches.length > 1 ? 's' : ''}. Top match from ${topMatch.from.split('<')[0].trim()}: "${topMatch.subject}" — "${topMatch.snippet}"`;
  }

  /**
   * Voice Email Draft Generator
   * Creates a draft pending approval gate before sending
   */
  async createDraft(recipient, subject, body) {
    const draft = await createEmailDraft(recipient, subject, body);
    return {
      success: true,
      draft,
      promptText: `I've prepared a draft email to ${recipient} with subject "${subject}". Body: "${body}". Would you like me to send it now?`
    };
  }

  /**
   * Send Email upon user voice confirmation ("Send it")
   */
  async sendDraft(draftId) {
    const drafts = await getPendingDrafts();
    const targetDraft = drafts.find(d => d.id === parseInt(draftId, 10)) || drafts[0];

    if (!targetDraft) {
      return { success: false, message: "No pending email draft found to send." };
    }

    await updateDraftStatus(targetDraft.id, 'sent');
    
    return {
      success: true,
      sentMessage: `Email successfully sent to ${targetDraft.recipient} via Gmail API.`
    };
  }
}

export const googleGmailService = new GoogleGmailService();
