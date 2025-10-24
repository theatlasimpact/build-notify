# build-notify (Cloudflare Worker)
Free alerts to iPhone + Apple Watch via Telegram for:
- Codex/Replit task completion (/notify)
- Vercel deployment events (/vercel-webhook)

## Setup (once)
1) Telegram: create a bot in @BotFather → get BOT_TOKEN.
2) DM your bot once, then open:
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   Copy `message.chat.id` as CHAT_ID.
3) Add secrets:
   npx wrangler secret put BOT_TOKEN
   npx wrangler secret put CHAT_ID
4) Deploy:
   npm run deploy

## Endpoints
- GET  /                    → "OK"
- POST /notify              → { ok: boolean, label: "npm run build" }
- POST /vercel-webhook      → Vercel JSON payload

## Vercel (per project)
Settings → Webhooks → Add:
URL: https://<your-worker>.workers.dev/vercel-webhook
Events: Deployment Created, Ready/Succeeded, Error, Canceled

## Codex/Replit helper
run_and_ping(){ "$@"; c=$?; curl -s -X POST https://<your-worker>/notify \
 -H 'Content-Type: application/json' \
 -d "{\"ok\":$([ $c -eq 0 ]&&echo true||echo false),\"label\":\"$*\"}" >/dev/null; return $c; }
# usage:
run_and_ping npm run build
run_and_ping npx prisma migrate deploy
