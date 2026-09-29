import { agoLabel, motion } from '../../lib/orrery';
import { isBody, isMoon, type Info } from './types';

/** The panel that opens for a body. Its markup lives in Orrery.astro; this only fills it in. */
export function createCard(root: HTMLElement, onClose: () => void, signal: AbortSignal) {
  const part = <T extends HTMLElement>(name: string) => root.querySelector<T>(`[data-orrery-${name}]`)!;
  const card = part('card');
  const eyebrow = part('eyebrow');
  const title = part('title');
  const stats = part('stats');
  const why = part('why');
  const link = part<HTMLAnchorElement>('link');
  part('close').addEventListener('click', onClose, { signal });

  const describe = (info: Info, now: number) => {
    if (isMoon(info)) return { eyebrow: `Moon of ${info.parent.name}`, title: info.name, lines: [info.note], why: `Part of ${info.parent.section}.`, href: info.parent.href, section: info.parent.section };
    const days = motion(info.changed, now).days;
    const lines = [...info.stats, ...(days === null ? [] : [`Changed ${agoLabel(days)}`])];
    const kicker = isBody(info) ? (info.kind === 'sun' ? 'The Sun' : info.name) : info.name;
    return { eyebrow: kicker, title: info.section, lines, why: info.why, href: info.href, section: info.section };
  };

  return {
    open(info: Info, now: number) {
      const d = describe(info, now);
      eyebrow.textContent = d.eyebrow;
      title.textContent = d.title;
      stats.replaceChildren(...d.lines.map((line) => Object.assign(document.createElement('li'), { textContent: line })));
      why.textContent = d.why;
      link.href = d.href;
      const arrow = Object.assign(document.createElement('span'), { textContent: '→' });
      arrow.setAttribute('aria-hidden', 'true');
      link.replaceChildren(`Open ${d.href === '/' ? 'the homepage' : d.section} `, arrow);
      card.hidden = false;
    },
    close() {
      card.hidden = true;
    },
    get isOpen() {
      return !card.hidden;
    },
  };
}
