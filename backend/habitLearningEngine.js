import { saveLearnedHabit, getLearnedHabits } from './db.js';

const sampleHabits = [
  {
    category: 'calendar',
    pattern: 'Cancels Friday 4 PM meetings',
    suggestedAction: 'Block Friday 4 PM for focus time',
    confidence: 0.92
  },
  {
    category: 'telephony',
    pattern: 'Calls Mom on Sundays at 6 PM',
    suggestedAction: 'Remind to call Mom on Sunday evening',
    confidence: 0.89
  },
  {
    category: 'fitness',
    pattern: 'No workouts logged in 3 days',
    suggestedAction: 'Suggest 2 PM free slot for workout',
    confidence: 0.95
  }
];

export class HabitLearningEngine {
  constructor() {
    this.seeded = false;
  }

  async seedHabits() {
    if (this.seeded) return;
    for (const h of sampleHabits) {
      await saveLearnedHabit(h.category, h.pattern, h.suggestedAction, h.confidence);
    }
    this.seeded = true;
  }

  async getHabits() {
    await this.seedHabits();
    const habits = await getLearnedHabits();
    return habits.length > 0 ? habits : sampleHabits;
  }

  async getProactiveHabitSuggestions() {
    const habits = await this.getHabits();
    return habits.map(h => `Habit Insights: ${h.pattern} (${Math.round(h.confidence * 100)}% confidence). Recommendation: ${h.suggestedAction}.`);
  }
}

export const habitLearningEngine = new HabitLearningEngine();
