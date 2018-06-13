class TimeUtil {
   static setIntervalImmediate(fn, ms) {
      setInterval(fn, ms);
      fn();
   }
}

module.exports = TimeUtil;