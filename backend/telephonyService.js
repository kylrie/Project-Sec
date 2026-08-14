import { saveUnifiedMessage, logCall } from './db.js';

export class TelephonyService {
  /**
   * Auto-extract OTPs, addresses, and appointment times from SMS body
   */
  extractSMSMetadata(body) {
    const otpMatch = body.match(/(?:code|otp|verify|pin) (?:is )?(\d{4,6})/i) || body.match(/\b\d{4,6}\b/);
    const timeMatch = body.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i);
    const addressMatch = body.match(/\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)/i);

    return {
      is_otp: Boolean(otpMatch),
      otp_code: otpMatch ? otpMatch[1] || otpMatch[0] : null,
      appointment_time: timeMatch ? timeMatch[0] : null,
      address: addressMatch ? addressMatch[0] : null
    };
  }

  /**
   * Process Incoming SMS
   */
  async receiveSMS(sender, body) {
    const meta = this.extractSMSMetadata(body);
    const msgId = 'sms_' + Date.now();

    const saved = await saveUnifiedMessage({
      id: msgId,
      platform: 'sms',
      sender,
      recipient: 'User',
      body,
      is_unread: 1,
      is_urgent: meta.is_otp ? 1 : 0,
      is_otp: meta.is_otp ? 1 : 0
    });

    let announcement = `SMS from ${sender}: "${body}".`;
    if (meta.is_otp) {
      announcement += ` F.R.I.D.A.Y. detected OTP Security Code: ${meta.otp_code}.`;
    }

    return {
      message: saved,
      metadata: meta,
      announcement
    };
  }

  /**
   * Send SMS by voice command
   */
  async sendSMS(recipient, body) {
    const msgId = 'sms_sent_' + Date.now();
    await saveUnifiedMessage({
      id: msgId,
      platform: 'sms',
      sender: 'User',
      recipient,
      body,
      is_unread: 0,
      is_urgent: 0,
      is_otp: 0
    });

    return {
      success: true,
      sentMessage: `SMS sent to ${recipient}: "${body}".`
    };
  }

  /**
   * Initiate Call & Log Summary
   */
  async initiateCall(contactName, phoneNumber = '+1-555-0199') {
    const durationSec = 300; // 5 minutes mock
    const summary = `You spoke with ${contactName} for 5 minutes. Discussed project deliverables and hardware budget specs.`;
    
    const callRecord = await logCall(contactName, phoneNumber, durationSec, summary);
    return {
      success: true,
      call: callRecord,
      announcement: `Initiating call to ${contactName} at ${phoneNumber}... ${summary}`
    };
  }
}

export const telephonyService = new TelephonyService();
