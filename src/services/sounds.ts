// Simple synthesized sound effects using Web Audio API
// No external files needed - generates sounds programmatically

// Check if browser supports Web Audio API
const isAudioSupported = () => {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
};

// Create a single shared AudioContext to avoid browser limits
let audioContext: AudioContext | null = null;
let audioContextInitialized = false;

// Initialize AudioContext on first user gesture to satisfy browser autoplay policy
export const initAudioContext = async () => {
  if (audioContextInitialized) {
    return;
  }
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    audioContextInitialized = true;
  } catch (e) {
    console.error('[SOUND] ❌ Failed to initialize AudioContext:', e);
    audioContextInitialized = true;
  }
};

const getAudioContext = async (): Promise<AudioContext | null> => {
  if (!isAudioSupported()) {
    return null;
  }

  // Only return existing context - never create new one here
  // AudioContext must be created during user gesture only
  if (!audioContext) {
    return null;
  }
  
  // Resume if suspended
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
    } catch (e) {
      console.error('[SOUND] Failed to resume AudioContext:', e);
    }
  }
  
  return audioContext;
};

export const playLevelUpSound = async () => {
  try {
    const ctx = await getAudioContext();
    if (!ctx) return;
    const audioContext = ctx;
    
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

export const playXpSound = async () => {
  try {
    const ctx = await getAudioContext();
    if (!ctx) return;
    const audioContext = ctx;
    const now = audioContext.currentTime;

    // Simple short "ding" sound for XP gain
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.value = 800;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {
    console.log('Audio context not available');
  }
};
export const playCriticalSound = async () => {
  try {
    const ctx = await getAudioContext();
    if (!ctx) return;
    const audioContext = ctx;
    
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

      gain.gain.setValueAtTime(0.1, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  } catch (e) {
    console.log('Audio context not available');
  }
};

export const playMessageNotificationSound = async () => {
  try {
    const ctx = await getAudioContext();
    if (!ctx) {
      return;
    }
    
    try {
      const audioContext = ctx;
      
      if (audioContext.state !== 'running') {
        await audioContext.resume();
      }
      
      // Create a pleasant "message received" sound - ascending notes
      const now = audioContext.currentTime;
      const notes = [
        { freq: 440, time: 0, duration: 0.08 },      // A4
        { freq: 554.37, time: 0.08, duration: 0.08 }, // C#5
      ];

      notes.forEach((note, idx) => {
        try {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();

          osc.connect(gain);
          gain.connect(audioContext.destination);

          osc.frequency.value = note.freq;
          osc.type = 'sine';

          gain.gain.setValueAtTime(0.1, now + note.time);
          gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

          osc.start(now + note.time);
          osc.stop(now + note.time + note.duration);
        } catch (noteError) {
      console.error('[SOUND] Error creating note', idx, ':', noteError);
        }
      });
    } catch (audioError) {
      console.error('[SOUND] ❌ Audio system error:', audioError);
    }
  } catch (e) {
    console.error('[SOUND] ❌ Error in playMessageNotificationSound:', e);
  }
};

export const playFriendRequestSound = async () => {
  try {
    const ctx = await getAudioContext();
    if (!ctx) return;
    
    try {
      // Small delay to let audio system settle
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const audioContext = ctx;
      
      // Create a distinctive "friend request" sound - three notes
      const now = audioContext.currentTime;
      const notes = [
        { freq: 523.25, time: 0, duration: 0.1 },    // C5
        { freq: 659.25, time: 0.1, duration: 0.1 },  // E5
        { freq: 523.25, time: 0.2, duration: 0.15 }, // C5 again
      ];

      notes.forEach(note => {
        try {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();

          osc.connect(gain);
          gain.connect(audioContext.destination);

          osc.frequency.value = note.freq;
          osc.type = 'sine';

          gain.gain.setValueAtTime(0.1, now + note.time);
          gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

          osc.start(now + note.time);
          osc.stop(now + note.time + note.duration);
        } catch (e) {
          console.error('[SOUND] Error in friend request sound:', e);
        }
      });
    } catch (audioError) {
      console.error('[SOUND] Audio device error (this is safe to ignore)');
    }
  } catch (e) {
    console.log('Audio context not available');
  }
};