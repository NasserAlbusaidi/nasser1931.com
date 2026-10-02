// The hidden room at /pluto: the ninth body, demoted in 2006, so it gets no section and no link.
// These are the pure rules behind the ways in. No imports, so `node --test` can load it as is.

export const ROOM = '/pluto';

/**
 * Every way in, in the order the room lists them. The hint shows until a way is found, the label after,
 * and `via` finishes "You came in by …" for the way just used.
 */
export const WAYS = [
  { id: 'konami', hint: 'An old cheat code, typed anywhere', label: 'The Konami code', via: 'the Konami code' },
  { id: 'name', hint: 'Say its name, anywhere', label: 'Typing "pluto"', via: 'typing its name' },
  { id: 'sun', hint: 'Knock on the Sun nine times', label: 'Nine knocks on the Sun', via: 'knocking on the Sun nine times' },
  { id: 'console', hint: 'Look under the hood', label: 'The developer console', via: 'the developer console' },
  { id: 'lost', hint: 'Get lost', label: 'The 404 page', via: 'getting lost' },
];
export const isWay = (id) => WAYS.some((way) => way.id === id);

export const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
export const NAME = ['p', 'l', 'u', 't', 'o'];
// Held for a capital letter or a shortcut; they are not part of any sequence.
const MODIFIERS = new Set(['shift', 'control', 'alt', 'meta', 'capslock', 'altgraph']);

/**
 * Watches keys for any of the sequences. `feed` takes a KeyboardEvent key and returns the id of the
 * sequence it completed, or null. A wrong key does not throw away a sequence that is still possible
 * from the keys just typed, so "ppluto" and "↑↑↑↓↓…" both still count.
 */
export function keyWatcher(sequences) {
  const longest = Math.max(...Object.values(sequences).map((seq) => seq.length));
  let recent = [];
  return {
    feed(key) {
      if (typeof key !== 'string' || !key || MODIFIERS.has(key.toLowerCase())) return null;
      recent = [...recent, key.toLowerCase()].slice(-longest);
      for (const [id, seq] of Object.entries(sequences)) {
        const tail = recent.slice(-seq.length);
        if (tail.length === seq.length && tail.every((k, i) => k === seq[i])) {
          recent = [];
          return id;
        }
      }
      return null;
    },
  };
}

// Nine knocks for the ninth body. Each must follow the last within this long, or the count starts again.
export const KNOCKS = 9;
export const KNOCK_GAP_MS = 2500;

/** Counts knocks on the Sun. `knock` takes a timestamp in ms and returns true on the ninth in a row. */
export function knocker(count = KNOCKS, gap = KNOCK_GAP_MS) {
  let knocks = 0;
  let last = -Infinity;
  return {
    knock(time) {
      knocks = time - last <= gap ? knocks + 1 : 1;
      last = time;
      if (knocks < count) return false;
      knocks = 0;
      return true;
    },
  };
}

/** Which ways a visitor has found, from what was stored (any shape) plus the way just used. Unknown ids are dropped. */
export const foundWays = (stored, used) => {
  const list = Array.isArray(stored) ? stored : [];
  return WAYS.map((way) => way.id).filter((id) => list.includes(id) || id === used);
};
