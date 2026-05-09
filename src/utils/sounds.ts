import { Howl } from 'howler';

// Using standard UI sounds for now as placeholders
const clickSound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'],
  volume: 0.5
});

const wicketSound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
  volume: 0.7
});

const boundarySound = new Howl({
  src: ['https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'],
  volume: 0.6
});

export const playSound = (type: 'click' | 'wicket' | 'boundary') => {
  try {
    if (type === 'click') clickSound.play();
    if (type === 'wicket') wicketSound.play();
    if (type === 'boundary') boundarySound.play();
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};
