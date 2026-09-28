// Finds metadata in an MP4 that can say where it was made. The repository is
// public, so committed timelapses must carry none. ffprobe is not on CI, so this
// walks the top-level boxes and scans every one except the media data, where
// the same bytes can appear by chance.
const MARKERS = ['©xyz', 'loci', '<x:xmpmeta'];
const SKIP = new Set(['mdat', 'free', 'skip']);

export const locationMarkers = (buffer) => {
  const found = new Set();
  for (let at = 0; at < buffer.length;) {
    if (buffer.length - at < 8) throw new Error(`truncated box at byte ${at}`);
    let size = buffer.readUInt32BE(at);
    const type = buffer.toString('latin1', at + 4, at + 8);
    if (size === 1) size = Number(buffer.readBigUInt64BE(at + 8));
    else if (size === 0) size = buffer.length - at;
    if (size < 8 || at + size > buffer.length) throw new Error(`bad size for box ${type} at byte ${at}`);
    if (!SKIP.has(type)) {
      const box = buffer.subarray(at, at + size);
      for (const marker of MARKERS) if (box.includes(Buffer.from(marker, 'latin1'))) found.add(marker);
    }
    at += size;
  }
  return [...found];
};
