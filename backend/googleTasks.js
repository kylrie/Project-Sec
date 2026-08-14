import { cacheTasks, getCachedTasks } from './db.js';

const mockTasks = [
  { id: 'task_001', title: 'Buy almond milk & groceries', due_date: new Date().toISOString(), status: 'needsAction' },
  { id: 'task_002', title: 'Submit Q3 quarterly report to Pepper', due_date: new Date().toISOString(), status: 'needsAction' },
  { id: 'task_003', title: 'Review FRIDAY speech synthesis benchmarks', due_date: new Date(Date.now() + 86400000).toISOString(), status: 'needsAction' }
];

export class GoogleTasksService {
  constructor() {
    this.tasks = [...mockTasks];
  }

  async getDueTasks() {
    const active = this.tasks.filter(t => t.status === 'needsAction');
    
    if (active.length === 0) {
      const cached = await getCachedTasks();
      const activeCached = cached.filter(t => t.status === 'needsAction');
      if (activeCached.length > 0) {
        return {
          count: activeCached.length,
          responseText: `You have ${activeCached.length} active tasks: ${activeCached.map(t => t.title).join(', ')}.`
        };
      }

      return {
        count: 0,
        responseText: "You have no pending tasks on your Google Tasks list, boss."
      };
    }

    const taskTitles = active.map(t => `"${t.title}"`).join(', ');
    return {
      count: active.length,
      tasks: active,
      responseText: `You have ${active.length} pending Google Task${active.length > 1 ? 's' : ''}: ${taskTitles}.`
    };
  }

  async addTask(title, dueDate = null) {
    const newTask = {
      id: 'task_' + Date.now(),
      title: title.trim(),
      due_date: dueDate || new Date().toISOString(),
      status: 'needsAction'
    };

    this.tasks.push(newTask);
    await cacheTasks(this.tasks);

    return {
      success: true,
      task: newTask,
      responseText: `Added "${newTask.title}" to your Google Tasks.`
    };
  }

  async completeTask(titleQuery) {
    const q = titleQuery.toLowerCase();
    const target = this.tasks.find(t => t.title.toLowerCase().includes(q) && t.status === 'needsAction');

    if (!target) {
      return {
        success: false,
        responseText: `Could not find an open task matching "${titleQuery}".`
      };
    }

    target.status = 'completed';
    await cacheTasks(this.tasks);

    return {
      success: true,
      task: target,
      responseText: `Marked task "${target.title}" as complete.`
    };
  }
}

export const googleTasksService = new GoogleTasksService();
