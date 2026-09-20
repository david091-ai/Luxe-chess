# LUXE CHESS

Premium offline, local two-player chess for one device.

## Guarantees

- Two human players only: White and Black.
- No accounts, login, backend, database, matchmaking, sockets, WebSockets, AI opponent, or cloud storage.
- Chess rules are handled by `chess.js`.
- Settings, themes, piece set, current game, and finished games use browser `localStorage`.
- Sounds are generated locally with Web Audio; there are no external sound files or APIs.
- Next.js is configured for static export.

## Run

```bash
npm install
npm run dev
```

For a production static export:

```bash
npm run build
```

The generated `out/` directory can be served as static files.

## Offline installation

Install/deploy the generated static build once, then the application itself makes no network requests. For a fully disconnected device, package the built `out/` directory with the app's static hosting/container mechanism.

## Notes

The service worker is intentionally lightweight. The core game does not depend on it: all game state and audio are local, and no runtime API calls are required.
