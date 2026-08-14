/**
 * Smart Reply Generator Engine
 */

export class SmartReplyEngine {
  generateSuggestions(messageText) {
    const text = messageText.toLowerCase();

    if (text.includes('dinner') || text.includes('food') || text.includes('7?')) {
      return [
        { label: 'Yes, see you at 7!', text: 'Yes, see you at 7!' },
        { label: 'Can we do 7:30 instead?', text: 'Can we do 7:30 instead?' },
        { label: 'I will be slightly late.', text: 'I am running slightly behind schedule, will arrive shortly.' }
      ];
    }

    if (text.includes('meeting') || text.includes('sync') || text.includes('call')) {
      return [
        { label: 'Yes, ready for the call.', text: 'Yes, standing by and ready for the call.' },
        { label: 'Can we push by 15 mins?', text: 'Can we push by 15 minutes?' },
        { label: 'Please send Google Meet link.', text: 'Could you please send over the Google Meet link?' }
      ];
    }

    return [
      { label: 'Got it, thanks!', text: 'Got it, thanks!' },
      { label: 'I will check and reply shortly.', text: 'I am reviewing now and will reply shortly.' },
      { label: 'Sounds good.', text: 'Sounds good, boss.' }
    ];
  }
}

export const smartReplyEngine = new SmartReplyEngine();
