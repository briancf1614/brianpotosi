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

Dalla root del repo (sul N100):

```bash
docker compose -f deploy/docker-compose.yml up -d
```

Il sito risponde su `http://<ip-del-server>:8080`. Il container monta la repository in sola lettura e si riavvia da solo (`unless-stopped`). Vedi i commenti dentro `deploy/docker-compose.yml` per dettagli e limiti.

## Deploy B2 — Pattern Tailscale: container sul N100, Oracle come front door

La variante che rispecchia l'architettura già in uso: nginx su Oracle riceve le richieste pubbliche (dominio **brianpotosi.com**, www ridirige sull'apex) e le inoltra **via Tailscale** al container sul N100.

1. Sul N100 avvia il container (Deploy B qui sopra) e recupera l'IP Tailscale:
   ```bash
   tailscale ip -4    # es. 100.x.y.z
   ```
2. Su **Oracle** clona il repo e installa il config (il percorso `conf.d` funziona con qualsiasi layout nginx):
   ```bash
   sudo cp /opt/brianpotosi/deploy/nginx-cv-reverseproxy.conf /etc/nginx/conf.d/cv.conf
   sudo sed -i 's|100.x.y.z|IL_TUO_IP_TAILSCALE|' /etc/nginx/conf.d/cv.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. DNS: record A per `brianpotosi.com` (e `www`) → IP pubblico di Oracle.
4. HTTPS:
   ```bash
   sudo certbot --nginx -d brianpotosi.com -d www.brianpotosi.com
   ```

> **Nota**: con questa variante il CV non è raggiungibile quando la linea di casa o il N100 sono giù. Il Deploy A (file statici su Oracle) non ha questa dipendenza e dà ad Oracle un ruolo attivo. Se `brianpotosi.com` è già usato da un altro servizio sul nginx di Oracle, passa a un subdominio (es. `cv.brianpotosi.com`).

## Struttura

```
index.html                  pagina unica (tutte le sezioni + marker EDIT)
assets/css/style.css        design system, layout, animazioni, stile di stampa
assets/js/main.js           canvas hero, typewriter, menu, scroll-reveal
assets/favicon.svg          monogramma "BP"
deploy/nginx-cv.conf        server block nginx commentato (file statici su Oracle)
deploy/nginx-cv-reverseproxy.conf  reverse proxy Oracle -> N100 via Tailscale
deploy/docker-compose.yml   variante Docker (nginx:alpine)
```

Note: l'unico asset esterno è il link ai Google Fonts (Space Grotesk + Inter); senza connessione il sito usa i font di sistema. L'animazione rispetta `prefers-reduced-motion`, e `Ctrl+P` produce un CV pulito in PDF.
