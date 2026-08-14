/**
 * Wake Word Detection & Desktop Global Hotkey Manager
 */

class WakeWordService {
  constructor() {
    this.wakeWord = 'hey friday';
    this.listeners = [];
    this.initHotkeys();
  }

  setWakeWord(word) {
    if (word && word.trim()) {
      this.wakeWord = word.trim().toLowerCase();
      console.log(`[WakeWord] Updated wake word string to: "${this.wakeWord}"`);
    }
  }

  initHotkeys() {
    window.addEventListener('keydown', (e) => {
      // Global shortcut: Ctrl + Shift + Space or Cmd + Shift + Space
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        console.log('[Hotkey] Ctrl+Shift+Space triggered! Activating FRIDAY.');
        this.triggerWakeWord('HOTKEY');
      }
    });
  }

  triggerWakeWord(source = 'VOICE') {
    this.listeners.forEach(cb => cb({ wakeWord: this.wakeWord, source, timestamp: Date.now() }));
  }

  onWakeWord(callback) {
    this.listeners.push(callback);
  }
}

export const wakeWordService = new WakeWordService();
