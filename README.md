# Toep Samen

Mobile-first multiplayer PWA voor het Nederlandse kaartspel Toepen.

## Starten

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Maak een potje aan en open de QR-link op een tweede apparaat.

## Wat er staat

- Next.js, React, TypeScript en Tailwind
- Mobiele home-, join-, lobby-, tafel- en eindschermen
- Servervalidatie voor beurt, kaartbezit, kleur bekennen, slagen en scores
- Toep/meegaan/passen, vuile was en winnen met een boer
- QR-code, native delen, sessieherstel en PWA service worker
- Afgeschermde handen: de API stuurt alleen de eigen hand terug
- Unit tests voor deck, kleur volgen en kaartvolgorde

## Opslag en realtime

De app gebruikt lokaal een server-side memory store met korte polling, zodat hij direct zonder accounts of sleutels te testen is. Voor productie staat in `supabase/migrations/001_initial.sql` het Supabase-model klaar.

De productie-adapter hoort spelacties via een Supabase Edge Function uit te voeren. Die functie bewaart de volledige spelstatus, verifieert het sessietoken en publiceert alleen de publieke projectie plus de eigen hand via Realtime. Zo blijven serverautoriteit en geheime kaarten intact bij meerdere app-instances.

## Gratis online deployen

De makkelijkste gratis testdeploy voor deze versie is Render, omdat Render een gewone Node web service kan draaien. Vercel kan ook gratis Next.js hosten, maar deze prototypeversie gebruikt servergeheugen voor potjes; dat past minder goed bij serverless functies.

1. Zet deze map in een GitHub repository.
2. Ga naar Render en kies **New > Blueprint**.
3. Koppel de repository.
4. Render leest `render.yaml` en maakt een gratis web service aan.

Let op: op de gratis Render-laag kan de service slapen. Als de service slaapt of opnieuw deployt, verdwijnen lopende potjes zolang de app nog de tijdelijke memory store gebruikt. Voor echte permanente multiplayer is de volgende stap Supabase aansluiten.
