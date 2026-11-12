// Turns a request that hangs forever into a visible error after `ms` milliseconds.
export function withTimeout<T>(p: PromiseLike<T>, ms = 15000, label = "Request"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s. Check the browser console (F12) and your Supabase settings.`)),
      ms
    );
    Promise.resolve(p).then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}
