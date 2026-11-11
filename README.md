# Crash Bash Player

A portable [Electron](https://www.electronjs.org/) window for **Crash Bash Online**: the game only, in a native Windows frame, with an Italian command bar underneath. Built to run on **Windows 7** with no installation, no administrator rights and no Chrome install.

- **Game only** — the site's header, marketing copy, footer, panels, help and status lines are hidden by CSS injected before the first paint. The canvas stays exactly 16:9, centred, with the command bar below it.
- **Italian command bar** — arrows/WASD, Space, X, Z, C, F, plus the optional Ballistix slide on Q/E.
- **Automatic settings** — music at 0, effects at 5/10, smooth motion and wide screen, re-asserted on every launch.
- **No splash** — the window stays hidden until the game has loaded and the CSS is applied, then appears already laid out. Never shows the untouched site.
- **Offline page** — a local page with a *Retry* button when the game cannot be reached.

## Why

Crash Bash Online is a WebGL2 and WebAssembly web app, so it needs a modern engine and a working renderer. Windows 7 has neither a current Chrome nor a store to install one from, so this project ships its own: **Electron 22.3.27**, the last major with declared Windows 7/8/8.1 support.

The player does not reimplement the game. It is a container that opens the public site, applies the settings and the game-only layout, and adds a command bar in Italian.

## Requirements

- Windows 7 SP1 or later, 32 or 64 bit.
- An internet connection: the game, its assets and the online rooms come from `crashbash.app`. The assets are served by that server behind authorization, so they are **not** included in this repository.

## Download

Grab the portable build from [Releases](https://github.com/breachato/crashbash-player/releases):

| Build | File | Runs on |
| --- | --- | --- |
| 64 bit | `crashbash-player-1.0.0-win32-x64.zip` | Windows 7 SP1+ 64 bit |
| 32 bit | `crashbash-player-1.0.0-win32-ia32.zip` | Windows 7 SP1+ 32 bit |

Unzip it anywhere and run `Crash Bash.exe`. Nothing to install, no registry keys, no administrator prompt. Settings, session and cache live in the app's data folder (`%APPDATA%`), the log in `player.log` next to them.

The builds are unsigned, so Windows SmartScreen may ask for confirmation the first time: *More info* → *Run anyway*.

## Build

Node.js 18 or later on Windows.

```bash
cd app
npm install              # downloads Electron 22.3.27 for the host architecture
```

Portable layout (a folder with the executable, no installer):

```bash
mkdir -p "../dist/Crash Bash-win32-x64/resources/app"
cp -r node_modules/electron/dist/. "../dist/Crash Bash-win32-x64/"
cp main.js preload.js offline.html package.json "../dist/Crash Bash-win32-x64/resources/app/"
mv "../dist/Crash Bash-win32-x64/electron.exe" "../dist/Crash Bash-win32-x64/Crash Bash.exe"
```

For a **32 bit** build, take the `electron-v22.3.27-win32-ia32.zip` package of the same version from the [Electron releases](https://github.com/electron/electron/releases/tag/v22.3.27), unpack it into `app/node_modules/electron/dist`, and repeat the steps with `win32-ia32` in the folder name.

Unneeded languages can be dropped from the build, keeping only `locales/it.pak` and `locales/en-US.pak`; the application works the same.

### Icon

The repository ships no icons: `app/icon.ico` belongs to third parties. Put your own icon in `app/icon.ico` (and `app/icon.png` for the preview) and the window will use it.

## Diagnostics

From the build folder:

```bash
"Crash Bash.exe" --smoke        # checks that the game loads, then exits
"Crash Bash.exe" --check-ui     # prints game and bar measurements, then exits
"Crash Bash.exe" --check-audio  # prints the saved audio settings, then exits
"Crash Bash.exe" --check-gpu    # reports which renderer the game uses, then exits
"Crash Bash.exe" --shot         # saves a screenshot to shot.png, then exits
```

`--check-gpu` reports the real renderer (`renderer` and `vendor`), whether WebGL2 is available, the recognised card and driver, and a plain outcome: **hardware acceleration** or **software fallback active** (SwiftShader). On a PC without drivers the software fallback shows up, and that is what keeps the game running without acceleration.

Diagnostic runs do not take the single-instance lock, so the player can stay open while they run.

## Files

| File | What it is |
| --- | --- |
| `app/main.js` | Window, sizing, single instance, fullscreen key, diagnostics |
| `app/preload.js` | Settings applied before the game starts, game-only CSS, Italian command bar |
| `app/offline.html` | Local page shown when the network is missing |
| `app/package.json` | Electron version and app metadata |
| `.github/workflows/release.yml` | Release build: portable zips for both architectures, attached to the release |

## Notes

- The window is sized so the game area (window minus the 54 px bar) is 16:9: 1280×720, or the largest size that fits the screen.
- A second launch focuses the running window instead of opening another one.
- **F11** toggles fullscreen; the application menu is removed.
- The session lives in the `persist:crashbash` partition, so the login survives restarts.
- If the game does not answer within 30 seconds the window is shown anyway, never left hidden.
- Log in `%APPDATA%\<app name>\player.log`, data and cache in the same folder.

## Legal

Unofficial project, not affiliated with or endorsed by the people running Crash Bash Online, Activision or Sony. It contains no code, assets, images or data from the game: it is only an Electron container that opens the public site. *Crash Bandicoot* and related marks belong to their respective owners. Electron and Chromium are third-party components under their own licenses; they are bundled in the release builds and are not covered by the license of this project.

## License

Proprietary and **All Rights Reserved**. The source is visible, but it is not open source: no permission is granted to use, copy, modify or redistribute it. See [`LICENSE.md`](./LICENSE.md) for the full terms.
