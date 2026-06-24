# Toep Samen online zetten voor morgen

De snelste route voor deze prototypeversie is **Render Free**. Render draait een gewone Node-server, waardoor alle spelers tijdens een potje hetzelfde servergeheugen gebruiken.

Cloudflare Pages/Workers is minder geschikt voor deze versie, omdat de app nu Next.js API-routes en tijdelijke server-memory gebruikt. Dat kan later prima, maar dan moet de spelstatus eerst naar Supabase, Durable Objects of een andere realtime datastore.

## Stap 1: GitHub repository maken

1. Ga naar https://github.com/new
2. Repository name: `toep-samen`
3. Kies **Private** of **Public**.
4. Laat **Add a README**, **.gitignore** en **license** uit.
5. Klik **Create repository**.

GitHub toont daarna commando's. Gebruik de variant voor een bestaande repository:

```bash
git remote add origin https://github.com/JOUW_GEBRUIKERSNAAM/toep-samen.git
git branch -M main
git push -u origin main
```

## Stap 2: Render Blueprint maken

1. Ga naar https://dashboard.render.com
2. Kies **New > Blueprint**.
3. Koppel GitHub als Render daarom vraagt.
4. Selecteer de repo `toep-samen`.
5. Render leest automatisch `render.yaml`.
6. Controleer dat het plan op **Free** staat.
7. Klik **Apply** of **Deploy**.

Na de eerste build krijg je een URL zoals:

```text
https://toep-samen.onrender.com
```

Die link kun je via WhatsApp of Forevery delen.

## Festival-tips

- Open de Render-link 2 minuten voordat je wil spelen. Een gratis Render-service slaapt na 15 minuten zonder verkeer en heeft daarna ongeveer een minuut nodig om wakker te worden.
- Start pas daarna een nieuw potje.
- Deel de link of QR-code vanuit de lobby.
- Laat het potje niet opnieuw deployen tijdens het spelen; lopende potjes zitten nog in servergeheugen.
- Als de app toch opnieuw start, maak je gewoon een nieuw potje aan.

## Later beter maken

Voor echte permanente multiplayer moet de memory store vervangen worden door Supabase of een vergelijkbare datastore. De eerste database-opzet staat al in:

```text
supabase/migrations/001_initial.sql
```
