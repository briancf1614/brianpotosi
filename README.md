# brianpotosi — CV / Portfolio

Sito curriculum statico a pagina singola di **Brian Potosi**. Zero build, zero framework: HTML, CSS e JavaScript vanilla, pronto da pubblicare su qualsiasi web server.

## Anteprima locale

- Semplice: apri `index.html` nel browser.
- Consigliata (percorsi e font più fedeli alla pubblicazione):
  - `python -m http.server 8000` → <http://localhost:8000>
  - oppure `npx serve .`

## Dove modificare i tuoi dati

Tutto il contenuto da personalizzare è marcato nel codice con commenti `<!-- EDIT: ... -->` dentro `index.html`:

- nome, ruoli animati (attributo `data-roles`), tagline e bio
- foto (sostituisci il segnaposto in "Chi sono" con una `<img>`, es. `assets/foto.jpg`)
- competenze, esperienze, progetti, formazione e lingue
- email e link social (GitHub, LinkedIn)
- `href` del pulsante **Scarica CV** (es. `assets/cv-brian-potosi.pdf`)
- dominio nei tag SEO/Open Graph (`<head>`)

I colori, i font e le variabili di design sono in cima a `assets/css/style.css` (blocco `:root`).

## Deploy A — Server Oracle con nginx esistente (consigliato)

1. Clona/aggiorna il repo sul server:
   ```bash
   git clone <url-repo> /opt/brianpotosi     # oppure: cd /opt/brianpotosi && git pull
   ```
2. Copia solo i file del sito nella web root:
   ```bash
   sudo mkdir -p /var/www/cv
   sudo rsync -av --delete \
     --exclude 'deploy' --exclude 'README.md' --exclude 'odd' --exclude '.git*' \
     /opt/brianpotosi/ /var/www/cv/
   ```
3. Abilita il config fornito:
   ```bash
   sudo cp /opt/brianpotosi/deploy/nginx-cv.conf /etc/nginx/sites-available/cv.conf
   sudo ln -s /etc/nginx/sites-available/cv.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. HTTPS con certbot (dopo aver puntato il DNS sul server):
   ```bash
   sudo certbot --nginx -d cv.example.com
   ```

## Deploy B — N100 con Docker (alternativa)

Dalla root del repo:

```bash
docker compose -f deploy/docker-compose.yml up -d
```

Il sito risponde su `http://<ip-del-server>:8080`. Il container monta la repository in sola lettura e si riavvia da solo (`unless-stopped`). Vedi i commenti dentro `deploy/docker-compose.yml` per dettagli e limiti.

## Struttura

```
index.html                  pagina unica (tutte le sezioni + marker EDIT)
assets/css/style.css        design system, layout, animazioni, stile di stampa
assets/js/main.js           canvas hero, typewriter, menu, scroll-reveal
assets/favicon.svg          monogramma "BP"
deploy/nginx-cv.conf        server block nginx commentato
deploy/docker-compose.yml   variante Docker (nginx:alpine)
```

Note: l'unico asset esterno è il link ai Google Fonts (Space Grotesk + Inter); senza connessione il sito usa i font di sistema. L'animazione rispetta `prefers-reduced-motion`, e `Ctrl+P` produce un CV pulito in PDF.
