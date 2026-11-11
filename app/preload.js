'use strict';

// Applicato alla pagina del gioco prima che i suoi script partano:
// 1. impostazioni automatiche:
//    - MUSIC VOLUME a 0 (musica muta), FX VOLUME a 5 su 10 (una volta sola, poi
//      contano le scelte dell'utente);
//    - MOVIMENTO: FLUIDO ("crashbash.motion" = smooth), riasserito a ogni avvio;
//    - SCHERMO: AMPIO ("crashbash.screen" = 16:9), riasserito a ogni avvio.
// 2. modalita' "solo gioco": via header, testi marketing, footer, barra, aiuti e
//    righe di stato del sito; resta il gioco 16:9 e una barra comandi italiana.

const GAME_HOST = 'crashbash.app';
const AUDIO_KEY = 'crashbash.audio';
const MUSIC0_KEY = 'crashbash.player.music0'; // el-music0
const PRESET_KEY = 'crashbash.player.preset';
const BAR_HEIGHT = 54;
const AREA_H = 'calc(100vh - ' + BAR_HEIGHT + 'px)';
const AREA_W = 'min(100vw, calc((100vh - ' + BAR_HEIGHT + 'px) * 16 / 9))';

function applyVolume() {
  if (location.hostname !== GAME_HOST) return;
  if (localStorage.getItem(MUSIC0_KEY) === '1') return;

  // default: musica muta, effetti a meta' (5 su 10), audio attivo
  let audio = { sound: true, music: 0, fx: 0.5 };
  try {
    const stored = JSON.parse(localStorage.getItem(AUDIO_KEY) || 'null');
    if (stored && typeof stored === 'object') audio = Object.assign(audio, stored);
  } catch (_) {
    // valore corrotto: si riparte dai default
  }
  audio.music = 0;
  if (typeof audio.fx !== 'number' || !Number.isFinite(audio.fx)) audio.fx = 0.5;
  if (typeof audio.sound !== 'boolean') audio.sound = true;

  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify(audio));
    localStorage.setItem(MUSIC0_KEY, '1');
  } catch (_) {
    // storage non disponibile: il gioco resta ai suoi default
  }
}

function applyPreferences() {
  if (location.hostname !== GAME_HOST) return;
  // el-preset-always: movimento e schermo vengono riasseriti a ogni avvio
  try {
    localStorage.setItem('crashbash.motion', 'smooth'); // MOVIMENTO: FLUIDO
    localStorage.setItem('crashbash.screen', '16:9'); // SCHERMO: AMPIO
    localStorage.setItem(PRESET_KEY, '1');
  } catch (_) {
    // storage non disponibile: restano i default del gioco
  }
}

const CSS = [
  '#brand, #copy, #consent, #chrome, #screen-controls, #input-badge,',
  '#help, #status, #result, #toast, body > footer { display: none !important; }',
  'html, body { margin: 0 !important; padding: 0 !important; height: 100% !important;',
  '  overflow: hidden !important; background: #000 !important; }',
  'main#app { position: fixed !important; inset: 0 !important; width: 100vw !important;',
  '  height: 100vh !important; max-width: none !important; max-height: none !important;',
  '  margin: 0 !important; padding: 0 !important; overflow: hidden !important;',
  '  background: #000 !important; }',
  '#screen { position: fixed !important; top: 0 !important; left: 50% !important;',
  '  transform: translateX(-50%) !important; width: ' + AREA_W + ' !important;',
  '  height: ' + AREA_H + ' !important; max-width: none !important; max-height: none !important;',
  '  margin: 0 !important; padding: 0 !important; background: #000 !important;',
  '  border: 0 !important; }',
  '#game, #hud, #hud-edge { position: absolute !important; top: 0 !important; left: 0 !important;',
  '  width: 100% !important; height: 100% !important; max-width: none !important;',
  '  max-height: none !important; margin: 0 !important; padding: 0 !important; }',
  '#loading { color: #ffb400 !important; font: 16px Verdana, Tahoma, Arial, sans-serif !important; }',
  '#cb-controls {',
  '  position: fixed; left: 0; right: 0; bottom: 0; height: ' + BAR_HEIGHT + 'px;',
  '  display: flex; align-items: center; justify-content: center; gap: 12px;',
  '  flex-wrap: wrap; padding: 0 10px; box-sizing: border-box;',
  '  background: #0d0d0d; border-top: 1px solid #262626;',
  '  color: #cfcfcf; font: 12px/1.15 Verdana, Tahoma, Arial, sans-serif;',
  '  z-index: 2147483647; user-select: none; -webkit-user-select: none;',
  '}',
  '#cb-controls b { color: #ffb400; font-weight: bold; }',
  '#cb-controls .cb-key {',
  '  display: inline-block; min-width: 14px; padding: 2px 5px; margin-right: 4px;',
  '  border: 1px solid #3a3a3a; border-bottom-width: 2px; border-radius: 3px;',
  '  background: #191919; color: #f0f0f0; font-size: 11px; text-align: center;',
  '}',
  '@media (max-width: 1000px) {',
  '  #cb-controls { font-size: 11px; gap: 8px; }',
  '  #cb-controls .cb-opt { display: none; }',
  '}',
].join('\n');

function buildBar() {
  const bar = document.createElement('div');
  bar.id = 'cb-controls';
  bar.setAttribute('role', 'note');
  bar.setAttribute('aria-label', 'Comandi di gioco');
  bar.innerHTML = [
    '<span><span class="cb-key">\u2190\u2191\u2193\u2192</span><b>Muovi</b> frecce o WASD</span>',
    '<span><span class="cb-key">Spazio</span><b>Salta</b></span>',
    '<span><span class="cb-key">X</span><b>Attacca</b></span>',
    '<span><span class="cb-key">Z</span><b>Prendi / lancia</b></span>',
    '<span><span class="cb-key">C</span><b>Provoca</b></span>',
    '<span><span class="cb-key">F</span><b>Schermo intero</b></span>',
    '<span class="cb-opt"><span class="cb-key">Q / E</span><b>Scivola (Ballistix)</b></span>',
    '<span class="cb-opt"><b>Controller</b> premi un tasto per collegarlo</span>',
  ].join('');
  return bar;
}

// el-early-style: il foglio va inserito appena esiste <head>, cioe' prima che il
// body venga disegnato, altrimenti per un attimo si vede il sito originale.
function injectEarlyStyle() {
  if (document.getElementById('crashbash-player-style')) return true;
  if (!document.head) return false;
  const style = document.createElement('style');
  style.id = 'crashbash-player-style';
  style.textContent = CSS;
  document.head.appendChild(style);
  return true;
}

function installGameOnlyMode() {
  if (location.hostname !== GAME_HOST) return;
  injectEarlyStyle();
  if (document.getElementById('cb-controls')) return;

  document.body.appendChild(buildBar());

  const nudge = () => window.dispatchEvent(new Event('resize'));
  nudge();
  setTimeout(nudge, 150);
  setTimeout(nudge, 700);
}

applyVolume();
applyPreferences();
injectEarlyStyle();

if (!injectEarlyStyle() && typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(() => {
    if (injectEarlyStyle()) observer.disconnect();
  });
  observer.observe(document, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installGameOnlyMode);
} else {
  installGameOnlyMode();
}
