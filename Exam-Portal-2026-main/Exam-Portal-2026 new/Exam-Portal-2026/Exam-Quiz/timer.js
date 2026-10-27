/* Countdown timer */
class CountdownTimer {
  constructor(seconds, onTick, onEnd) {
    this.remaining = seconds;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.handle = null;
  }
  start() {
    this.onTick(this.remaining);
    this.handle = setInterval(() => {
      this.remaining--;
      this.onTick(this.remaining);
      if (this.remaining <= 0) { this.stop(); this.onEnd(); }
    }, 1000);
  }
  stop() { if (this.handle) clearInterval(this.handle); this.handle = null; }
}
function formatTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
