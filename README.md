# 🏓 PeerPong — Serverless Multiplayer Pong in Your Browser

Welcome to **PeerPong** — a blazing-fast, Peer-to-peer multiplayer Pong game built for the web. Play head-to-head with friends in real time, chat as you play, and host or join games with a simple 4-character code. No sign-ups, no servers, no database — just pure peer-to-peer fun!

---

## 🚀 Features

- **Peer-to-peer Multiplayer**  
  Challenge friends directly via WebRTC DataChannels — no central game server!

- **Instant Hosting & Joining**  
  - **Host Game**: Get a unique 4-character code.
  - **Join Game**: Enter your friend’s code and connect instantly.

- **Smooth Gameplay**  
  - Written in **Rust** for performance, compiled to WebAssembly.
  - Fast, synchronized paddle & ball physics.

- **In-game Chat**  
  - Reliable, real-time messaging over a separate DataChannel.
  - Ephemeral: no chat history, no storage, zero server costs.

- **Truly Serverless**  
  - **Signaling** handled by Cloudflare Workers + Durable Objects (free tier).
  - **Static Hosting**: Deploy anywhere (GitHub Pages, Netlify, Vercel…).

---

## 🏗️ How It Works

### 1. Core Stack

- **Rust + WASM**: Game logic & rendering.
- **JavaScript Glue**: Loads WASM, hooks browser animation, manages WebRTC.
- **WebRTC DataChannels**:  
  - *Game Channel*: Unreliable/Unordered (UDP-like) for paddle/ball sync.
  - *Chat Channel*: Reliable/Ordered for text chat.

### 2. Serverless Signaling

- **Cloudflare Workers + Durable Objects**:  
  - Distributes game codes.
  - Brokers WebRTC handshake (SDP/ICE).
  - Tears down automatically after game ends.

### 3. P2P Data Flow

1. **Host**: Requests a new game code; Worker spins up a room object.
2. **Joiner**: Enters code; Worker brokers WebRTC handshake.
3. **STUN**: Finds best path; direct P2P connection (TURN fallback optional).
4. **Gameplay & Chat**: All data flows directly between browsers.
5. **Cleanup**: On disconnect, room object self-destructs.

---

## ✨ Getting Started

**No downloads, no installations, no setup required!**  
Just open your browser and start playing.

- Visit the game’s URL in any modern browser (Chrome, Firefox, Safari, Edge).
- Click **Host Game** to get a unique code, or **Join Game** to enter a friend’s code.
- Play Pong and chat in real time — all directly in your browser.

> **Tip:** P2P Pong works on desktop and most mobile browsers — nothing to install, ever.

---

## 🕹️ Gameplay

1. Click **Host Game** to generate a code.
2. Share the code with a friend.
3. Friend clicks **Join Game** and enters the code.
4. Play Pong and chat in real time!  
   _(Game ends or page closes? Connection cleans up automatically.)_

---

## 🧩 Project Structure

```
pong-game/           # Rust game logic (compiled to WASM)
frontend/            # HTML, JS glue code, WASM loader, UI
workers/             # Cloudflare Worker & Durable Object (signaling)
```

---

## 💡 Tech Highlights

- **Pure WebRTC**: All gameplay and chat data is peer-to-peer.
- **No Database**: Signaling is ephemeral; no persistent storage.
- **Free Hosting**: Runs entirely on free Cloudflare and static hosts.
- **Easy Extensibility**: Add features like TURN, lobbies, or leaderboards later.

---

## 🗺️ Roadmap

- [x] Basic host/join lobby
- [x] Real-time gameplay sync (UDP-style channel)
- [x] In-game chat (reliable channel)
- [x] Serverless, ephemeral signaling
- [ ] TURN fallback for restrictive NATs
- [ ] Mobile-friendly UI
- [ ] Spectator mode, scoreboards, and more!

---

## 📄 License

MIT

---

## 🙏 Credits

- Built with 🦀 Rust, ❤️ WebRTC, and ☁️ Cloudflare Workers.

---

Enjoy the game! Want to contribute, report bugs, or suggest features? Open an issue or PR.  
Let’s keep Pong alive — peer-to-peer! 🎉
