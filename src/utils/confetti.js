import confetti from 'canvas-confetti';

export function fireConfetti(color = '#6366f1') {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.75 },
      colors: [color, '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      ticks: 200,
    });
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}

export function fireSuperConfetti() {
  try {
    const end = Date.now() + 1.2 * 1000;
    const colors = ['#bb0000', '#ffffff', '#6366f1', '#10b981', '#f59e0b'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  } catch (err) {
    console.warn('Super confetti error:', err);
  }
}
