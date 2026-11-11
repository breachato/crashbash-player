# Crash Bash Player

Player portatile per [Crash Bash Online](https://crashbash.app/): una finestra nativa Windows che mostra solo il gioco, con una barra comandi in italiano sotto.

Nasce per far girare il gioco su **Windows 7** (32 e 64 bit) senza installazione, senza privilegi di amministratore e senza Chrome installato. Usa **Electron 22.3.27**, l'ultima major con supporto dichiarato a Windows 7/8/8.1.

## Purpose

* dare al gioco una finestra nativa e portatile su Windows 7;
* mostrare solo il gioco, con i comandi in italiano invece dei pannelli del sito;
* applicare da sole le impostazioni utili (musica muta, effetti a metà, movimento fluido, schermo ampio);
* documentare il progetto e tenerne traccia delle modifiche.

## Cosa fa

* **Solo gioco**: header, testi marketing, footer, pannelli, aiuti e righe di stato del sito vengono nascosti via CSS iniettato prima del primo disegno; il canvas resta 16:9 esatto, centrato, con la barra comandi sotto.
* **Barra comandi in italiano**: frecce/WASD, spazio, X, Z, C, F.
* **Impostazioni automatiche**: musica a 0, effetti a 5 su 10, movimento fluido e schermo ampio, riasseriti a ogni avvio.
* **Nessun flash del sito**: la finestra resta nascosta finché il gioco non è pronto e compare già sistemata.
* **Senza rete**: pagina di errore locale con il pulsante *Riprova*.

## Requisiti

* Windows 7 SP1 o successivo, 32 o 64 bit.
* Connessione a internet: gioco, asset e stanze online arrivano da `crashbash.app`. Gli asset sono serviti dal server dietro autorizzazione, quindi **non** sono inclusi in questo repository.

## Compilare

Serve Node.js 18 o successivo su Windows.

```bash
cd app
npm install              # scarica Electron 22.3.27 (architettura della macchina)
```

Per una build **32 bit** serve il pacchetto Electron ia32 della stessa versione: scaricalo da `https://github.com/electron/electron/releases/tag/v22.3.27` (`electron-v22.3.27-win32-ia32.zip`) e scompattalo in `app/node_modules/electron/dist`.

Build portatile (cartella con l'eseguibile, nessun installer):

```bash
mkdir -p "../dist/Crash Bash-win32-ia32/resources/app"
cp -r node_modules/electron/dist/. "../dist/Crash Bash-win32-ia32/"
cp main.js preload.js offline.html package.json "../dist/Crash Bash-win32-ia32/resources/app/"
mv "../dist/Crash Bash-win32-ia32/electron.exe" "../dist/Crash Bash-win32-ia32/Crash Bash.exe"
```

Per la 64 bit la procedura è identica cambiando il nome della cartella (`win32-x64`).

Le lingue inutili si possono togliere dalla build lasciando solo `locales/it.pak` e `locales/en-US.pak`; l'applicazione funziona lo stesso.

### Icona

Il repository non include icone: `app/icon.ico` è di terzi. Metti la tua icona in `app/icon.ico` (e `app/icon.png` per l'anteprima) e verrà usata dalla finestra.

## Diagnostica

Dalla cartella della build:

```bash
"Crash Bash.exe" --smoke        # verifica che il gioco si carichi, poi esce
"Crash Bash.exe" --check-ui     # stampa misure di gioco e barra, poi esce
"Crash Bash.exe" --check-audio  # stampa le impostazioni salvate, poi esce
"Crash Bash.exe" --shot         # salva uno screenshot in shot.png, poi esce
```

Log in `%APPDATA%\Crash Bash\player.log`, dati e cache nella stessa cartella.

## Note legali

Progetto **non ufficiale**, non affiliato né approvato da chi gestisce Crash Bash Online, Activision o Sony. Non contiene codice, asset, immagini o dati del gioco: è solo un contenitore Electron che apre il sito pubblico. *Crash Bandicoot* e i marchi collegati appartengono ai rispettivi proprietari.

## License

This project is proprietary and **All Rights Reserved**.

You are **not** permitted to:

* use this software anywhere;
* copy, modify, or redistribute the source code;
* create derivative works;
* sell or commercially exploit any part of this project.

Viewing the source code does **not** grant permission to use it.

See the `LICENSE.md` file for the complete terms.
