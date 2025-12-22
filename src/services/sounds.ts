// Simple synthesized sound effects using Web Audio API
// No external files needed - generates sounds programmatically

export const playLevelUpSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant ascending chime sequence for level up
    const now = audioContext.currentTime;
    const notes = [
      { freq: 523.25, time: 0, duration: 0.1 },      // C5
      { freq: 659.25, time: 0.1, duration: 0.1 },    // E5
      { freq: 783.99, time: 0.2, duration: 0.2 },    // G5
      { freq: 1046.5, time: 0.4, duration: 0.3 },    // C6 (high note - longest)
    ];

    notes.forEach(note => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = note.freq;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.3, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  } catch (e) {
    console.log('Audio context not available');
  }
};

export const playXpSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // Simple short "ding" sound for XP gain
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.value = 800;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {
    console.log('Audio context not available');
  }
};
export const playCriticalSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a distinctive double "ding" for critical hit
    const now = audioContext.currentTime;
    const notes = [
      { freq: 900, time: 0, duration: 0.12 },      // Higher pitch first
      { freq: 1100, time: 0.15, duration: 0.15 },  // Even higher second
    ];

    notes.forEach(note => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = note.freq;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.25, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  } catch (e) {
    console.log('Audio context not available');
  }
};

export const playMessageNotificationSound = () => {
  try {
    console.log('[SOUND] playMessageNotificationSound called - PLAYING MESSAGE SOUND NOW');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant "message received" sound - ascending notes
    const now = audioContext.currentTime;
    const notes = [
      { freq: 440, time: 0, duration: 0.08 },      // A4
      { freq: 554.37, time: 0.08, duration: 0.08 }, // C#5
    ];

    notes.forEach(note => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = note.freq;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.2, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  } catch (e) {
    console.log('Audio context not available');
  }
};

export const playFriendRequestSound = () => {
  try {
    console.log('[SOUND] playFriendRequestSound called - PLAYING FRIEND REQUEST SOUND NOW');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a distinctive "friend request" sound - three notes
    const now = audioContext.currentTime;
    const notes = [
      { freq: 523.25, time: 0, duration: 0.1 },    // C5
      { freq: 659.25, time: 0.1, duration: 0.1 },  // E5
      { freq: 523.25, time: 0.2, duration: 0.15 }, // C5 again
    ];

    notes.forEach(note => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = note.freq;
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.25, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  } catch (e) {
    console.log('Audio context not available');
  }
};