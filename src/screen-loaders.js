const once = load => {
  let pending;
  return () => pending ??= load();
};

// Loading one screen must not start the other screen's download.
export const loadMapScreen = once(() => import('./map-screen.js'));
export const loadObservationScreen = once(() => import('./learning.js'));

export function waitForScreen(pending, signal) {
  return new Promise((resolve, reject) => {
    const finish = settle => value => {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      settle(value);
    };
    // Tie cleanup to the wait, since the import can outlive both a timeout and a scene change.
    const fail = finish(reject);
    const cancel = () => fail(signal.reason);
    const timer = setTimeout(() => fail(new Error('Screen load timed out')), 10000);
    if (signal.aborted) cancel();
    else signal.addEventListener('abort', cancel, { once: true });
    pending.then(finish(resolve), fail);
  });
}
