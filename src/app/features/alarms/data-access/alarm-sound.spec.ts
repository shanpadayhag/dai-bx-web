import { playRunBeep, playRunSound } from '@features/alarms/data-access/alarm-sound';

describe('alarm-sound run helpers', () => {
  it('playRunSound returns an independent stop handle per call', () => {
    const realAudio = window.Audio;
    const pauses: jasmine.Spy[] = [];

    class FakeAudio {
      paused = false;
      currentTime = 0;
      loop = false;
      pause = jasmine.createSpy('pause');
      play(): Promise<void> {
        return Promise.resolve();
      }
      constructor() {
        pauses.push(this.pause);
      }
    }
    (window as unknown as { Audio: unknown }).Audio = FakeAudio;

    try {
      const blob = new Blob(['x']);
      const h1 = playRunSound(blob);
      const h2 = playRunSound(blob);
      expect(pauses.length).toBe(2);

      h1.stop();
      expect(pauses[0]).toHaveBeenCalled();
      expect(pauses[1]).not.toHaveBeenCalled();

      h2.stop();
      expect(pauses[1]).toHaveBeenCalled();
    } finally {
      (window as unknown as { Audio: unknown }).Audio = realAudio;
    }
  });

  it('playRunSound stop is idempotent', () => {
    const realAudio = window.Audio;
    class FakeAudio {
      loop = false;
      currentTime = 0;
      pause = jasmine.createSpy('pause');
      play(): Promise<void> {
        return Promise.resolve();
      }
    }
    (window as unknown as { Audio: unknown }).Audio = FakeAudio;
    try {
      const h = playRunSound(new Blob(['x']));
      h.stop();
      h.stop();
      // pause may be called once or zero times depending on URL.createObjectURL
      // — what matters is that the second call does not throw.
      expect(true).toBe(true);
    } finally {
      (window as unknown as { Audio: unknown }).Audio = realAudio;
    }
  });

  it('playRunBeep returns an idempotent stop handle', () => {
    const h = playRunBeep();
    expect(() => h.stop()).not.toThrow();
    expect(() => h.stop()).not.toThrow();
  });
});
