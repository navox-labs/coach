# Navox Coach

**Your AI-powered network strategist. Research-backed coaching for the referral economy.**

> *"Weak ties — people you barely know — are more likely to get you a job than your close friends."*
> — Granovetter, 1973. Confirmed causally on 20 million LinkedIn users in 2022.

---

## The problem

You mapped your network with [Navox Network](https://github.com/navox-labs/network). You can see your weak ties, your bridges, your gaps. Now what?

Knowing *who* to reach out to is only half the problem. You still need to know *what to say*, *how to position yourself*, and *which opportunities to pursue first*. A graph without a strategy is just a picture.

Navox Coach turns your network map into a job search plan.

---

## What it does

Coach reads your network data (stored locally by the Network tool) and provides strategic guidance powered by GPT-4o with real-time web search.

| Capability | What it answers |
|---|---|
| **Network Debrief** | What does my network health actually mean? |
| **Opportunity Mapping** | Which roles can I reach through my bridges? |
| **Outreach Drafting** | What do I say to a weak tie vs. a strong tie? |
| **Gap Fill** | How do I build connections I'm missing? |
| **Web Research** | What skills does this company need? What's their culture like? |

Coach is embedded directly in the Network tool UI — select a node, search a company, or open the coach dialog to ask anything.

---

## How it works

```
Navox Network (browser)
    │
    ├── User uploads LinkedIn CSV
    ├── Parses connections, computes tie strength, gaps, bridges
    └── Stores network data in localStorage
                │
                ▼
Navox Coach (API)
    │
    ├── Reads network data from localStorage via the Network UI
    ├── Builds context: health score, top bridges, gaps, selected node
    ├── Injects context into system prompt
    └── Streams response from GPT-4o (with web search)
                │
                ▼
User gets personalized, research-backed advice
```

All data stays in the browser. Coach never stores conversations, connections, or any user data.

---

## Run locally

### 1. Clone and install

```bash
git clone https://github.com/navox-labs/coach.git
cd coach
npm install
```

### 2. Set up environment

Create `.env.local`:

```
OPENAI_API_KEY=sk-...
COACH_ACCESS_KEY=your-secret-here   # optional for local dev, required in production
```

### 3. Start the coach API

```bash
npm run dev
```

Coach runs on [http://localhost:3002](http://localhost:3002).

### 4. Run with the Network tool

Coach is designed to pair with [Navox Network](https://github.com/navox-labs/network). To run both locally with shared localStorage:

```bash
# Terminal 1 — Network tool
cd network && npm run dev -- -p 3001

# Terminal 2 — Coach API
cd coach && npm run dev -- -p 3002

# Terminal 3 — Dev proxy (serves both on localhost:3000)
cd coach && npm run proxy
```

Open [http://localhost:3000/network](http://localhost:3000/network). Upload your CSV, then use the coach from within the Network UI.

**Requirements:** Node.js 18+, OpenAI API key

---

## Access control

The Coach API is protected by a shared passphrase to prevent unauthorized usage (OpenAI API calls cost money).

- Set `COACH_ACCESS_KEY` in your environment variables (Vercel, `.env.local`, etc.)
- When a user first opens Coach, they'll be prompted to enter the access key
- The key is saved in their browser's localStorage — they only enter it once
- If `COACH_ACCESS_KEY` is not set, the API is open (convenient for local development)

**For testers:** DM for the access key.

---

## The science

Coach applies findings from three bodies of research to generate personalized advice:

**Granovetter (1973, 1983) — The Strength of Weak Ties**
Weak ties provide non-redundant information about job opportunities because they exist in different professional clusters. Coach calibrates outreach messages based on tie strength — weak ties get brief, context-referencing messages; strong ties get direct referral asks.

**Rajkumar et al. (2022, Science) — Causal validation at scale**
A randomized experiment on 20 million LinkedIn users confirmed that moderate-strength weak ties causally increase job mobility. Coach prioritizes these connections in its outreach recommendations.

**Putnam (2000) — Bridging vs. bonding capital**
Coach identifies bridging gaps in your network — missing role categories that limit your access to certain industries — and recommends specific connection types to pursue.

---

## Outreach calibration

Coach drafts messages calibrated to tie strength:

| Tie type | Approach |
|---|---|
| **Weak tie** | Reference shared context, acknowledge the distance, be brief and specific |
| **Moderate tie** | Warmer tone, reference last interaction, ask for 15 minutes |
| **Strong tie** | Direct ask for referral or introduction |

The user always sends. Coach never acts on their behalf.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI | OpenAI GPT-4o (Responses API + web search) |
| Streaming | ReadableStream with text deltas |
| Language | TypeScript throughout |
| Styling | Tailwind CSS 4 |
| Backend storage | None — reads from browser localStorage |
| Database | None |
| Auth | None |

---

## Project structure

```
coach/
├── app/
│   ├── api/chat/route.ts      # Streaming OpenAI endpoint with web search
│   ├── page.tsx                # API info page
│   └── layout.tsx              # Root layout + metadata
├── components/
│   ├── CoachBubble.tsx         # Floating trigger bubble with pulse animation
│   ├── CoachPanel.tsx          # Chat interface with step tracker
│   ├── NoDataScreen.tsx        # Empty state when no network data loaded
│   └── StepReward.tsx          # Confetti celebration on step completion
├── lib/
│   ├── agentContext.ts         # Builds lean context from raw network data
│   ├── systemPrompt.ts         # Research-backed coaching system prompt
│   ├── storage.ts              # localStorage bridge (reads navox-network-data)
│   ├── todoState.ts            # 4-step coaching progress tracker
│   └── types.ts                # Connection, GapAnalysis, RoleCategory types
└── scripts/
    └── dev-proxy.js            # Zero-dependency proxy for local multi-app dev
```

---

## Privacy

- No data leaves your browser — Coach reads from localStorage, not a server
- No conversations are stored — streaming responses are not persisted
- No database, no auth, no tracking
- OpenAI API calls include your network context for that request only (`store: false`)

---

## Research

This tool implements findings from:

- Granovetter, M. (1973). The strength of weak ties. *American Journal of Sociology*, 78(6), 1360–1380.
- Granovetter, M. (1983). The strength of weak ties: A network theory revisited. *Sociological Theory*, 1, 201–233.
- Rajkumar, K., et al. (2022). A causal test of the strength of weak ties. *Science*, 377(6612), 1304–1310.
- Putnam, R. D. (2000). *Bowling Alone*. Simon & Schuster.

Full citation list in the companion research paper: [The Invisible Network (Yousif, 2026)](https://navox.tech)

---

## Related

- [Navox Network](https://github.com/navox-labs/network) — Map your professional network and find your side door
- [navox.tech](https://navox.tech) — Your AI-powered profileCard that recruiters can chat with

---

## License

MIT — see [LICENSE](LICENSE).

Built by [Navox Labs](https://navox.tech) · Research by Nahrin Yousif
