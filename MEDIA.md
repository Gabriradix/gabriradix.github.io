# Media locali e immagini progressive

Il sito Astro aggiornato si trova nella cartella principale `AstroPortfolio`. Da questa cartella:

```sh
npm run dev
```

Tutti i file di `public` sono inclusi nel checkout. Se una nuova copia usa sparse checkout, recuperare anche i media con `git sparse-checkout add public`.

Le immagini statiche del portfolio usano `ProgressiveImage.astro`: il browser seleziona JPEG XL attraverso `<picture>`, oppure JPEG progressivo (WebP per le immagini con trasparenza). Si scarica una sola rappresentazione; non vengono caricati proxy seguiti dagli originali. Le gallerie aprono il file già selezionato dal browser. Safari visualizza JXL, ma al momento non lo rende progressivamente durante il download.

I caroselli conservano le dimensioni ottimizzate delle anteprime come immagini finali. Le sei GIF hanno una versione JXL animata e un'alternativa WebP animata, sia a piena risoluzione sia per i caroselli. I tempi dei fotogrammi sono conservati, normalizzando i ritardi GIF inferiori a 20 ms a 100 ms come nei browser. Le animazioni si fermano su un fotogramma statico quando escono dallo schermo o quando si riduce il movimento.

Safari dichiara supporto per `image/jxl` ma non riproduce le animazioni: il solo `<picture>` non basta a scegliere una versione funzionante. Per questo le animazioni JXL sono abilitate conservativamente su Chrome/Chromium 155+ e Firefox 158+; gli altri browser ricevono WebP animato. L'elenco è in `src/utils/animated-images.ts`. Con JavaScript disabilitato si usa WebP animato.

SVG e video restano nei propri formati. La prova del loop senza audio di Homo Deus produce 11,4 MB in JXL rispetto ai 556 KB in MP4: dopo il confronto si è scelto di mantenere MP4/WebM. Gli originali e il vecchio sito archiviato in `public/guidosegniedition` sono conservati.

## Rigenerare i media

```sh
npm run media:generate
npm run build
```

La build rigenera automaticamente anteprime e immagini progressive quando cambia un file sorgente. I manifest `src/data/image-delivery.json` e `src/data/animated-delivery.json`, insieme ai file generati `.jxl`, `.progressive.jpg`, `.fallback.webp`, `.animated.webp` e `.poster.webp` in `public`, devono essere inclusi insieme alle modifiche al sito. I file invariati vengono riutilizzati.

Il generatore richiede `cjxl` di [libjxl](https://github.com/libjxl/libjxl/releases), usa `--progressive`, distanza visiva 1 ed effort 5. Le animazioni richiedono anche FFmpeg nel PATH (oppure `FFMPEG_PATH`). Su Windows questa postazione usa il binario ufficiale v0.12.0 in `work/media-tools/libjxl-v0.12.0/x64-windows-static/bin/cjxl.exe`, relativo alla cartella principale del progetto. Su altre postazioni installare libjxl e impostare `CJXL_PATH` al percorso di `cjxl`, oppure inserirlo nel PATH su Linux/macOS. Esempio PowerShell:

```powershell
$env:CJXL_PATH = 'C:\strumenti\libjxl\cjxl.exe'
npm run media:generate
```

La workflow GitHub Pages installa `libjxl-tools` prima della build. Le modifiche locali non pubblicano automaticamente il sito.
