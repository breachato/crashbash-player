'use strict';

// el-no-splash: nessuna finestra di caricamento. La finestra principale resta
// nascosta finche' il gioco non ha finito di caricarsi e il CSS e' applicato;
// poi compare gia' sistemata, senza mostrare il sito non modificato.

const { app, BrowserWindow, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const GAME_URL = 'https://crashbash.app/';
const ICON = path.join(__dirname, 'icon.ico');
const BAR_HEIGHT = 54;
const SMOKE = process.argv.includes('--smoke');
const CHECK_AUDIO = process.argv.includes('--check-audio');
const CHECK_UI = process.argv.includes('--check-ui');
const CHECK_GPU = process.argv.includes('--check-gpu');
const SHOT = process.argv.includes('--shot');
const TEST_MODE = SMOKE || CHECK_AUDIO || CHECK_UI || CHECK_GPU || SHOT;

// Crash Bash e' una web app (WebGL2 + WebAssembly) e gli asset arrivano dal suo
// server: questo contenitore serve solo a darle una finestra nativa su Windows 7.
// Electron 22 e' l'ultima major con supporto dichiarato a Windows 7/8/8.1.

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('no-first-run');
app.commandLine.appendSwitch('no-default-browser-check');

function logFile() {
  try {
    return path.join(app.getPath('userData'), 'player.log');
  } catch (_) {
    return path.join(os.tmpdir(), 'crashbash-player.log');
  }
}

function log(message) {
  const line = '[' + new Date().toISOString() + '] ' + message;
  try {
    fs.appendFileSync(logFile(), line + '\n');
  } catch (_) {
    // cartella in sola lettura: basta il log su console
  }
  console.log(message);
}

// la finestra e' dimensionata perche' l'area di gioco (finestra meno la barra)
// sia 16:9, cioe' 1280x720 oppure il massimo che entra nello schermo.
function windowSize() {
  const area = screen.getPrimaryDisplay().workAreaSize;
  const maxW = Math.min(area.width - 80, 1280);
  const maxH = area.height - 80;

  let width = maxW;
  let height = Math.round((width * 9) / 16) + BAR_HEIGHT;

  if (height > maxH) {
    height = maxH;
    width = Math.round(((height - BAR_HEIGHT) * 16) / 9);
  }
  if (width < 640) width = 640;
  if (height < 360 + BAR_HEIGHT) height = 360 + BAR_HEIGHT;
  return { width, height };
}

let win = null;

function createWindow() {
  const size = windowSize();
  win = new BrowserWindow({
    width: size.width,
    height: size.height,
    minWidth: 640,
    minHeight: 414,
    backgroundColor: '#080808',
    title: 'Crash Bash',
    icon: fs.existsSync(ICON) ? ICON : undefined, // icona opzionale: non inclusa nel repo
    autoHideMenuBar: true,
    show: TEST_MODE, // in uso normale compare solo quando il gioco e' pronto
    webPreferences: {
      partition: 'persist:crashbash',
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webgl: true,
    },
  });

  Menu.setApplicationMenu(null);

  win.on('page-title-updated', (event) => {
    event.preventDefault();
    win.setTitle('Crash Bash');
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  win.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      if (win && !win.isDestroyed() && !win.isVisible()) win.show();
    }, 500);
  });

  win.webContents.on('did-fail-load', (_event, code, description, url) => {
    log('caricamento fallito: ' + code + ' ' + description + ' ' + url);
    if (TEST_MODE) {
      app.exit(1);
      return;
    }
    if (!win.isVisible()) win.show();
    win.loadFile(path.join(__dirname, 'offline.html'));
  });

  win.loadURL(GAME_URL);
  return win;
}

const PROBE =
  'var q=function(s){var el=document.querySelector(s);if(!el)return null;' +
  'var r=el.getBoundingClientRect();var cs=getComputedStyle(el);' +
  'return {w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top),' +
  'x:Math.round(r.x),display:cs.display};};' +
  'JSON.stringify({viewport:{w:innerWidth,h:innerHeight},' +
  'screen:q("#screen"),game:q("#game"),bar:q("#cb-controls"),' +
  'help:q("#help"),status:q("#status"),result:q("#result"),toast:q("#toast"),' +
  'brand:q("#brand"),copy:q("#copy"),footer:q("footer"),chrome:q("#chrome")})';

// el-check-gpu: quale renderer sta usando davvero il gioco. Serve a capire se su
// un PC senza driver si sta appoggiando al fallback software (SwiftShader).
const GPU_PROBE =
  'JSON.stringify((function(){' +
  'var out={};' +
  'var c=document.createElement("canvas");' +
  'var gl=c.getContext("webgl2")||c.getContext("webgl");' +
  'out.gl=!!gl;' +
  'out.webgl2=!!(gl&&typeof WebGL2RenderingContext!=="undefined"&&' +
  'gl instanceof WebGL2RenderingContext);' +
  'if(gl){var ext=gl.getExtension("WEBGL_debug_renderer_info");' +
  'if(ext){out.vendor=gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);' +
  'out.renderer=gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);}' +
  'else{out.vendor=gl.getParameter(gl.VENDOR);out.renderer=gl.getParameter(gl.RENDERER);}' +
  'out.maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE);}' +
  'var r=String(out.renderer||"").toLowerCase();' +
  'out.software=/swiftshader|software|llvmpipe|basic render/.test(r);' +
  'return out;})())';

function gpuSummary(page) {
  if (!page.gl) return 'WebGL non disponibile: il gioco non puo` renderizzare';
  if (page.software) return 'fallback software attivo (' + page.renderer + ')';
  return 'accelerazione hardware (' + page.renderer + ')';
}

// in modalita' diagnostica non si prende il lock: l'app puo' restare aperta
if (!TEST_MODE && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    const window = createWindow();

    // se il gioco non risponde, la finestra non deve restare nascosta per sempre
    if (!TEST_MODE) {
      setTimeout(() => {
        if (window && !window.isDestroyed() && !window.isVisible()) window.show();
      }, 30000);
    }

    if (SMOKE) {
      const timer = setTimeout(() => {
        log('smoke: timeout');
        app.exit(2);
      }, 45000);
      window.webContents.once('did-finish-load', () => {
        clearTimeout(timer);
        log('smoke ok: ' + window.webContents.getURL() + ' | ' + window.getTitle());
        app.exit(0);
      });
    }

    if (CHECK_AUDIO) {
      const timer = setTimeout(() => {
        log('check-audio: timeout');
        app.exit(2);
      }, 60000);
      window.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          window.webContents
            .executeJavaScript(
              'JSON.stringify({audio: localStorage.getItem("crashbash.audio"),' +
                'motion: localStorage.getItem("crashbash.motion"),' +
                'screen: localStorage.getItem("crashbash.screen"),' +
                'music0: localStorage.getItem("crashbash.player.music0"),' +
                'preset: localStorage.getItem("crashbash.player.preset")})'
            )
            .then((dump) => {
              clearTimeout(timer);
              log('check-audio: ' + dump);
              app.exit(0);
            })
            .catch((error) => {
              clearTimeout(timer);
              log('check-audio errore: ' + error.message);
              app.exit(1);
            });
        }, 6000);
      });
    }

    if (CHECK_UI) {
      const timer = setTimeout(() => {
        log('check-ui: timeout');
        app.exit(2);
      }, 60000);
      window.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          window.webContents
            .executeJavaScript(PROBE)
            .then((dump) => {
              clearTimeout(timer);
              log('check-ui: ' + dump);
              app.exit(0);
            })
            .catch((error) => {
              clearTimeout(timer);
              log('check-ui errore: ' + error.message);
              app.exit(1);
            });
        }, 7000);
      });
    }

    if (CHECK_GPU) {
      const timer = setTimeout(() => {
        log('check-gpu: timeout');
        app.exit(2);
      }, 60000);
      window.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          Promise.all([window.webContents.executeJavaScript(GPU_PROBE), app.getGPUInfo('basic')])
            .then((results) => {
              const page = JSON.parse(results[0]);
              const info = results[1] || {};
              const device = (info.gpuDevice && info.gpuDevice[0]) || {};
              const features = app.getGPUFeatureStatus();
              clearTimeout(timer);
              const report = {
                    renderer: page.renderer || null,
                    vendor: page.vendor || null,
                    webgl: page.gl,
                    webgl2: page.webgl2,
                    maxTexture: page.maxTexture || null,
                    software: page.software,
                    scheda: device.vendorString && device.deviceString
                      ? device.vendorString + ' ' + device.deviceString
                      : null,
                    driver: device.driverVendor && device.driverVersion
                      ? device.driverVendor + ' ' + device.driverVersion
                      : null,
                    features: features,
                    esito: gpuSummary(page),
              };
              // i campi che il sistema non espone non vanno stampati come null
              Object.keys(report).forEach((key) => {
                if (report[key] === null) delete report[key];
              });
              log('check-gpu: ' + JSON.stringify(report));
              app.exit(0);
            })
            .catch((error) => {
              clearTimeout(timer);
              log('check-gpu errore: ' + error.message);
              app.exit(1);
            });
        }, 6000);
      });
    }

    if (SHOT) {
      const timer = setTimeout(() => {
        log('shot: timeout');
        app.exit(2);
      }, 60000);
      window.webContents.once('did-finish-load', () => {
        setTimeout(async () => {
          try {
            const image = await window.webContents.capturePage();
            const file = path.join(__dirname, 'shot.png');
            fs.writeFileSync(file, image.toPNG());
            clearTimeout(timer);
            log('shot ok: ' + file + ' ' + image.getSize().width + 'x' + image.getSize().height);
            app.exit(0);
          } catch (error) {
            clearTimeout(timer);
            log('shot errore: ' + error.message);
            app.exit(1);
          }
        }, 9000);
      });
    }
  });

  app.on('window-all-closed', () => app.quit());
}
