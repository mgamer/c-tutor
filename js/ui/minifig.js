// SVG minifig avatar built from simple layers (legs, torso, head, hair/hat).
import { findItem, getState } from '../game.js';

const SKIN = '#f6d23a';
const SKIN_DARK = '#d9b21f';

function face() {
  return `
    <ellipse cx="41" cy="44" rx="3.2" ry="4.2" fill="#1b2a34"/>
    <ellipse cx="59" cy="44" rx="3.2" ry="4.2" fill="#1b2a34"/>
    <circle cx="42" cy="42.6" r="1.1" fill="#fff"/>
    <circle cx="60" cy="42.6" r="1.1" fill="#fff"/>
    <path d="M38 53 Q50 64 62 53" fill="none" stroke="#1b2a34" stroke-width="3" stroke-linecap="round"/>`;
}

function head() {
  return `
    <rect x="42" y="15" width="16" height="9" rx="2.5" fill="${SKIN}" stroke="${SKIN_DARK}" stroke-width="1.2"/>
    <rect x="28" y="22" width="44" height="44" rx="12" fill="${SKIN}" stroke="${SKIN_DARK}" stroke-width="1.5"/>
    <rect x="33" y="26" width="7" height="22" rx="3.5" fill="#fff" opacity=".28"/>
    ${face()}`;
}

function hair(color) {
  return `<path d="M25 44 C24 22 36 12 50 12 C66 12 77 22 75 44 L71 44 C70 34 66 28 60 26 C52 33 38 34 30 31 C29 36 29 40 29 44 Z" fill="${color}"/>
    <path d="M40 16 C46 13 56 13 62 16" stroke="#fff" stroke-opacity=".25" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}

function hat(id, hairColor) {
  switch (id) {
    case 'cap':
      return `<path d="M27 32 C27 14 73 14 73 32 Z" fill="#d01012"/><path d="M60 30 L88 31 C88 35 80 36 60 35 Z" fill="#a50d0f"/>
        <circle cx="50" cy="15" r="3" fill="#a50d0f"/>`;
    case 'hardhat':
      return `<path d="M26 32 C26 10 74 10 74 32 Z" fill="#f2cd37"/><rect x="20" y="29" width="60" height="6" rx="3" fill="#e0b81c"/>
        <rect x="46" y="11" width="8" height="20" rx="3" fill="#ffe27a"/>`;
    case 'beanie':
      return `<path d="M27 34 C25 10 75 10 73 34 Z" fill="#0055bf"/><rect x="25" y="28" width="50" height="8" rx="4" fill="#003f8f"/>
        <circle cx="50" cy="9" r="6" fill="#f4f4f4"/>`;
    case 'wizard':
      return `${hair(hairColor)}<path d="M18 33 L82 33 C82 38 18 38 18 33 Z" fill="#3b2a7a"/><path d="M28 33 L52 -14 L72 33 Z" fill="#4b3699"/>
        <circle cx="47" cy="15" r="2.5" fill="#f2cd37"/><circle cx="56" cy="4" r="2" fill="#f2cd37"/><circle cx="60" cy="24" r="2" fill="#f2cd37"/>`;
    case 'crown':
      return `${hair(hairColor)}<path d="M30 30 L30 10 L40 20 L50 6 L60 20 L70 10 L70 30 Z" fill="#f2cd37" stroke="#c99a0e" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="50" cy="22" r="3" fill="#d01012"/><circle cx="38" cy="25" r="2" fill="#0055bf"/><circle cx="62" cy="25" r="2" fill="#237841"/>`;
    default:
      return hair(hairColor);
  }
}

function body(torso, legs, torsoId) {
  const logo = torsoId === 'space'
    ? `<circle cx="50" cy="90" r="7" fill="#0055bf"/><path d="M45 92 L55 86" stroke="#f2cd37" stroke-width="2.5"/>`
    : `<rect x="44" y="83" width="12" height="12" rx="2" fill="#fff" opacity=".85"/><circle cx="47.5" cy="86.5" r="1.6" fill="${torso}"/><circle cx="52.5" cy="86.5" r="1.6" fill="${torso}"/>`;
  return `
    <rect x="44" y="64" width="12" height="8" fill="${SKIN}"/>
    <path d="M18 116 L24 76 Q26 70 32 70 L68 70 Q74 70 76 76 L82 116 Z" fill="${torso}" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>
    <path d="M25 76 L14 104" stroke="${torso}" stroke-width="11" stroke-linecap="round"/>
    <path d="M75 76 L86 104" stroke="${torso}" stroke-width="11" stroke-linecap="round"/>
    <circle cx="13" cy="110" r="6" fill="none" stroke="${SKIN}" stroke-width="5"/>
    <circle cx="87" cy="110" r="6" fill="none" stroke="${SKIN}" stroke-width="5"/>
    ${logo}
    <rect x="18" y="116" width="64" height="9" rx="2" fill="${legs}" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>
    <path d="M20 125 L48 125 L48 154 L20 154 Z" fill="${legs}" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>
    <path d="M52 125 L80 125 L80 154 L52 154 Z" fill="${legs}" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>
    <rect x="18" y="152" width="32" height="6" rx="2" fill="${legs}" filter="brightness(.8)"/>
    <rect x="50" y="152" width="32" height="6" rx="2" fill="${legs}"/>`;
}

/** Full-body or head-only minifig SVG markup. */
export function minifigSvg({ full = false, fig = getState().minifig, size } = {}) {
  const hairColor = findItem('hair', fig.hair).color;
  const torso = findItem('torso', fig.torso).color;
  const legs = findItem('legs', fig.legs).color;
  const vb = full ? '0 -16 100 176' : '14 -4 72 74';
  const dims = size ? `width="${size}" height="${full ? Math.round(size * 1.76) : size}"` : '';
  return `<svg class="minifig" viewBox="${vb}" ${dims} role="img" aria-label="Your minifig" xmlns="http://www.w3.org/2000/svg">
    ${full ? body(torso, legs, fig.torso) : ''}${head()}${hat(fig.hat, hairColor)}</svg>`;
}
