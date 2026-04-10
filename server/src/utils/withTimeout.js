class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
    this.code = 'timeout';
  }
}

const withTimeout = (taskOrPromise, { timeoutMs, message = 'Operation timed out' } = {}) => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('timeoutMs must be a positive number');
  }

  const workPromise =
    typeof taskOrPromise === 'function'
      ? Promise.resolve().then(taskOrPromise)
      : Promise.resolve(taskOrPromise);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(message));
    }, timeoutMs);

    if (typeof timer.unref === 'function') {
      timer.unref();
    }

    workPromise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
};

module.exports = {
  TimeoutError,
  withTimeout,
};
