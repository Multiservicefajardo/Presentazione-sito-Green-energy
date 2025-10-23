# Green Energy — Sito v1 (presentazione)
Struttura base del sito statico (HTML/CSS/JS) pronta per pubblicazione su GitHub Pages o Vercel.

## Struttura
- `index.html` — markup principale
- `style.css` — stile elegante + animazioni (Ken Burns hero, pulsanti con ombre & ripple)
- `script.js` — logica UI (menu mobile, lightbox galleria, form preventivo con bozza/rimbalzo, feedback clienti)

## Deploy rapido su GitHub Pages
1. Crea repo, push dei file (root).
2. Settings → Pages → Deploy from a branch → `main` / root.
3. URL: `https://<tuo-username>.github.io/<repo>/`

## Dove cambiare l'immagine hero
- `index.html` (nel tag `<img class="hero__img" ...>`) oppure
- `script.js` (blocco "Hero image override") → modifica `HERO_SRC`.

## Webhook automazioni (Make/n8n)
Nel submit del form preventivo c'è un commento con la `fetch` verso un webhook.
Decommenta e incolla il tuo endpoint.

© MultiserviceFajardo
