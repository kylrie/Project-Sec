import { getDndSettings, setDndSettings } from './db.js';

export class DNDAutoResponder {
  async enableDND(mode = 'meeting', customText = null) {
    const settings = await setDndSettings(true, mode, customText);
    return {
      success: true,
      settings,
      message: `Do Not Disturb mode active (${mode}). Only emergency alerts will interrupt. Auto-responder dispatched.`
    };
  }

  async disableDND() {
    const settings = await setDndSettings(false);
    return {
      success: true,
      settings,
      message: `Do Not Disturb mode disabled. Normal notifications restored.`
    };
  }

  async checkDndFilter(sender, body) {
    const settings = await getDndSettings();
    if (!settings.enabled) {
      return { interrupt: true, autoResponded: false };
    }

    const text = body.toLowerCase();
    const isEmergency = text.includes('urgent') || text.includes('emergency') || text.includes('help') || text.includes('asap');

    if (isEmergency) {
      return {
        interrupt: true,
        autoResponded: false,
        reason: 'Emergency keyword detected'
      };
    }

    return {
      interrupt: false,
      autoResponded: true,
      autoResponseText: settings.auto_response_text || "F.R.I.D.A.Y. is managing Tony's messages. They'll reply shortly."
    };
  }
}

export const dndAutoResponder = new DNDAutoResponder();
