import { saveUserFeedback } from './db.js';

export class FeedbackEngine {
  async submitFeedback(messageId, rating, comment = null) {
    const record = await saveUserFeedback(messageId, rating, comment);
    return {
      success: true,
      record,
      message: `Thank you for your feedback! Rating logged for model fine-tuning.`
    };
  }
}

export const feedbackEngine = new FeedbackEngine();
