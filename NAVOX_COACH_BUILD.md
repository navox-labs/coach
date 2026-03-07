# Navox Coach — Claude Code Build Prompt
> Hand this file to Claude Code. Work through each section in order.
> Do not skip sections. Each builds on the previous.

---

## CONTEXT & PHILOSOPHY

You are building **Navox Coach** — a strategic job search coaching agent that lives on top of the existing Navox Network graph tool at `navox.tech/network`.

**Core philosophy:**
- This is NOT an AI that does the work for the user
- This is a strategic coach that guides the user step by step
- The user still has to do the work — send the messages, make the connections
- Privacy is the #1 trust asset — no database, no backend, no data leaves the device
- Everything runs in the browser using localStorage and direct OpenAI API calls

**Research foundation:**
- Granovetter (1973, 1983) — Strength of Weak Ties theory
- Rajkumar et al. (2022, Science) — Causal test on 20M LinkedIn users
- Weak ties (low interaction, few mutual connections) = highest job mobility
- Bridge connections (Recruiters, Leadership, Founders, Advisors) = most valuable
- Moderately weak ties in bridge roles = highest activation priority

---

## REPO SETUP

```bash
# Create new Next.js repo
npx create-next-app@latest navox-coach --typescript --tailwind --app --no-src-dir
cd navox-coach
npm install openai
```

**Repo name:** `navox-labs/coach`
**Deployed at:** `navox.tech/coach` (Vercel, same domain as navox.tech/network)
**Stack:** Next.js 14, TypeScript, Tailwind CSS, OpenAI API

**next.config.js:**
```js
const nextConfig = {
  basePath: '/coach',
  output: 'standalone',
}
module.exports = nextConfig
```

---

## LOCALSTORAGE BRIDGE

The coach reads data saved by `navox.tech/network`. Both apps are on the same domain so they share localStorage automatically.

**Key used by the network app:**
```
navox-network-data
```

**Shape of the data in localStorage:**
```typescript
interface StoredNetworkData {
  connections: Connection[];      // full parsed Connection[] array
  gapAnalysis: GapAnalysis;       // full gap analysis result
  uploadedAt: string;             // ISO timestamp
}
```

**At app load, check localStorage:**
```typescript
// lib/storage.ts
export function loadNetworkData(): StoredNetworkData | null {
  try {
    const raw = localStorage.getItem('navox-network-data');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
```

**If no data found:** Show a friendly screen explaining the user needs to upload their CSV at `navox.tech/network` first, with a direct link.

---

## AGENT CONTEXT BUILDER

Never pass the full raw CSV to the AI. Build a clean, summarized context object:

```typescript
// lib/agentContext.ts
import { Connection, GapAnalysis } from './types';

export interface AgentContext {
  networkSummary: {
    totalConnections: number;
    networkHealthScore: number;
    bridgingCapitalScore: number;
    interpretation: string;
  };
  criticalGaps: {
    category: string;
    currentPct: number;
    idealPct: number;
    severity: string;
    suggestion: string;
  }[];
  topBridges: {
    name: string;
    company: string;
    position: string;
    tieCategory: string;
    roleCategory: string;
    activationPriority: number;
  }[];
  roleDistribution: Record<string, number>;
}

export function buildAgentContext(
  connections: Connection[],
  gapAnalysis: GapAnalysis
): AgentContext {
  return {
    networkSummary: {
      totalConnections: gapAnalysis.totalConnections,
      networkHealthScore: gapAnalysis.networkHealthScore,
      bridgingCapitalScore: gapAnalysis.bridgingCapitalScore,
      interpretation: gapAnalysis.interpretation,
    },
    criticalGaps: gapAnalysis.gaps
      .filter(g => g.severity === 'critical' || g.severity === 'moderate')
      .map(g => ({
        category: g.category,
        currentPct: g.currentPct,
        idealPct: g.idealPct,
        severity: g.severity,
        suggestion: g.suggestion,
      })),
    topBridges: gapAnalysis.topActivationTargets
      .slice(0, 10)
      .map(c => ({
        name: c.name,
        company: c.company,
        position: c.position,
        tieCategory: c.tieCategory,
        roleCategory: c.roleCategory,
        activationPriority: c.activationPriority,
      })),
    roleDistribution: gapAnalysis.rolePercentages,
  };
}
```

---

## SYSTEM PROMPT

```typescript
// lib/systemPrompt.ts
export function buildSystemPrompt(context: AgentContext): string {
  return `You are Navox Coach — a strategic job search coach powered by network graph theory.

You have analyzed the user's LinkedIn connections using Granovetter's weak-ties theory and Rajkumar et al.'s 2022 causal study on 20 million LinkedIn users. The science is clear: weak ties — people you barely know — are more likely to get you a job than your close friends. They inhabit different professional clusters and carry non-redundant information.

Here is the user's network data:
${JSON.stringify(context, null, 2)}

YOUR ROLE:
You are a coach, not a doer. You guide the user step by step. They do the work. You show them the path.

COACHING FLOW — guide the user through these 4 steps in order:

STEP 1 — NETWORK DEBRIEF
Explain their network data in plain, warm, human language. Tell them:
- Their network health score and what it means
- How many bridge connections they have and why that matters
- Their biggest gaps and what's at stake
- End with: "Ready to see which roles your network can already get you into?"

STEP 2 — OPPORTUNITY MAPPING  
Based on their top bridge connections and role distribution, identify:
- The top 3-5 job roles they are already well-positioned to reach via their network
- Which specific connections (by name, company, role) are the bridge to each opportunity
- End with: "Do any of these feel right for you? Or tell me what role you're actually targeting."

STEP 3 — OUTREACH DRAFTING
When the user identifies a target role or company:
- Find the best 2-3 connections to activate from their topBridges list
- Draft a personalized outreach message for each, calibrated to tie strength:
  - Weak tie: reference shared context, acknowledge the distance, be brief and specific
  - Moderate tie: warmer, reference last interaction, ask for 15 minutes
  - Strong tie: direct ask for referral or intro
- Remind them: send one message at a time, wait for a response before the next

STEP 4 — GAP FILL
If the user has no obvious path to their target role:
- Tell them honestly: "Your network doesn't have a direct bridge to [role] yet — but let's fix that."
- Ask: "What are the 5 most important skills for this role?"
- Based on their answer, recommend specific connection types to pursue on LinkedIn
- Give them concrete search strategies from the gap suggestions in the data

RULES:
- Always be warm, specific, and honest
- Never make up connections or companies — only reference what is in the network data
- Never send messages on behalf of the user — draft them, but the user sends
- Keep responses focused — one step at a time
- When referencing a connection, always include their name, company, and role
- Celebrate completions — when a user says they sent a message, acknowledge it genuinely
- Do not mention the OpenAI API, Claude, or any underlying technology
- You are Navox Coach. That is your only identity.

TONE: Warm, direct, research-backed. Like a brilliant friend who happens to know network science.`;
}
```

---

## OPENAI API ROUTE

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    stream: true,
    max_tokens: 1000,
    temperature: 0.7,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

---

## TODO LIST STATE

Track coaching progress in localStorage:

```typescript
// lib/todoState.ts
export interface CoachingStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export const COACHING_STEPS: CoachingStep[] = [
  {
    id: 'debrief',
    label: '🗺 Understand your network',
    description: 'Learn what your graph is telling you',
    completed: false,
  },
  {
    id: 'opportunities',
    label: '🎯 Map your opportunities',
    description: 'See which roles your network unlocks',
    completed: false,
  },
  {
    id: 'outreach',
    label: '✉️ Draft your first outreach',
    description: 'Send a message to your top bridge connection',
    completed: false,
  },
  {
    id: 'gaps',
    label: '🔧 Fill your network gaps',
    description: 'Build bridges to new professional clusters',
    completed: false,
  },
];

export function saveStepProgress(steps: CoachingStep[]) {
  localStorage.setItem('navox-coach-progress', JSON.stringify(steps));
}

export function loadStepProgress(): CoachingStep[] {
  try {
    const raw = localStorage.getItem('navox-coach-progress');
    if (!raw) return COACHING_STEPS;
    return JSON.parse(raw);
  } catch {
    return COACHING_STEPS;
  }
}
```

---

## UI COMPONENTS

### Component 1: Floating Coach Bubble

```
File: components/CoachBubble.tsx
```

Behavior:
- Fixed position: bottom-right corner `bottom-6 right-6`
- Default state: pulsing circle with brain/chat emoji `🧠`
- On first visit (no localStorage key `navox-coach-seen`): show label "Meet your Network Coach" next to bubble with a gentle pulse animation
- After 60 seconds on page without clicking: show tooltip above bubble: "Ready to turn this graph into a job search strategy? 👆"
- On click: opens CoachPanel, saves `navox-coach-seen` to localStorage
- Show notification dot when coach has sent a new message and panel is closed

### Component 2: Coach Panel

```
File: components/CoachPanel.tsx
```

Layout (overlay, does not replace current view):
```
┌─────────────────────────────┐
│ 🧠 Navox Coach          [×] │  ← header with close button
├─────────────────────────────┤
│ ☐ Understand your network   │  ← TODO steps, checkable
│ ☐ Map your opportunities    │
│ ☐ Draft your first outreach │
│ ☐ Fill your network gaps    │
├─────────────────────────────┤
│                             │
│   [chat messages here]      │  ← scrollable message area
│                             │
│   Coach: Your network       │
│   health score is 58%...    │
│                             │
│   You: Tell me more         │
│                             │
├─────────────────────────────┤
│ [Type a message...     ] [→]│  ← input + send
└─────────────────────────────┘
```

Width: `w-96` (384px)
Height: `h-[600px]`
Position: fixed, bottom-right, above the bubble
Shadow: `shadow-2xl`
Border radius: `rounded-2xl`
Background: white

### Component 3: No Data Screen

```
File: components/NoDataScreen.tsx
```

Shown when localStorage has no network data:

```
Your network map isn't loaded yet.

To start coaching, first upload your LinkedIn 
connections at navox.tech/network

[Go to Network Tool →]
```

### Component 4: Reward Animation

```
File: components/StepReward.tsx
```

When user completes a step (marks TODO as done):
- Confetti burst for 2 seconds
- Message from coach: "Step complete! 🎉 [specific encouragement based on which step]"
- Step checks off with a satisfying animation
- Network health meter increments visually

Use `canvas-confetti` package:
```bash
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

---

## MAIN PAGE

```typescript
// app/page.tsx
```

On load:
1. Check localStorage for `navox-network-data`
2. If not found → render `<NoDataScreen />`
3. If found → parse connections + gapAnalysis
4. Build `agentContext` using `buildAgentContext()`
5. Build `systemPrompt` using `buildSystemPrompt()`
6. Load `coachingSteps` from localStorage or defaults
7. Render main layout:
   - Simple header: "Navox Coach" with link back to `navox.tech/network`
   - Network stats bar: totalConnections, networkHealthScore, bridgingCapitalScore
   - `<CoachBubble />` (floating, always visible)
   - `<CoachPanel />` (hidden until bubble clicked)

---

## ENVIRONMENT VARIABLES

```bash
# .env.local
OPENAI_API_KEY=your_key_here
```

---

## OUTREACH MESSAGE TEMPLATES

The AI will generate these dynamically, but give it this structure as guidance in the system prompt:

**Weak tie template:**
```
Hi [Name], we connected on LinkedIn a while back — you're doing impressive 
work at [Company]. I'm currently exploring [Role] opportunities and your 
path caught my attention. Would you be open to a 15-minute conversation? 
No agenda — genuinely curious about your experience there.
```

**Moderate tie template:**
```
Hi [Name], hope you're doing well! It's been a while since we last connected. 
I've been building in [space] and am now exploring [Role] opportunities at 
companies like [Company]. Would love to reconnect and hear about your work 
— and if there's ever a fit, a referral from you would mean a lot.
```

**Strong tie template:**
```
Hey [Name], I'm actively exploring [Role] opportunities and [Company] is at 
the top of my list. Would you be comfortable putting in a referral or 
connecting me with the right person on your team? Happy to send over 
my profile and a note you could forward.
```

---

## VERCEL DEPLOYMENT

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable in Vercel dashboard
# OPENAI_API_KEY = your key
```

Configure in Vercel:
- Project name: `navox-coach`
- Domain: add `navox.tech/coach` as custom path
- Framework: Next.js

---

## BUILD ORDER FOR HACKATHON

Work in this exact order:

**Friday night (foundation):**
1. Repo setup + Next.js install
2. `lib/storage.ts` — localStorage bridge
3. `lib/types.ts` — copy Connection + GapAnalysis types from tieStrength.ts
4. `lib/agentContext.ts` — context builder
5. `lib/systemPrompt.ts` — system prompt
6. `app/api/chat/route.ts` — OpenAI streaming route
7. Basic `app/page.tsx` — loads data, shows stats
8. `components/NoDataScreen.tsx`
9. Test: does the API call work with real localStorage data?

**Saturday (core agent):**
1. `components/CoachPanel.tsx` — full chat UI with streaming
2. `components/CoachBubble.tsx` — floating bubble with pulse + tooltip
3. `lib/todoState.ts` — step tracking
4. Wire TODO steps into CoachPanel header
5. Test full Step 1 → Step 2 → Step 3 flow with real CSV data

**Sunday (polish + submit):**
1. `components/StepReward.tsx` — confetti + celebration
2. Step 4 gap fill flow
3. Mobile responsive check
4. Deploy to Vercel
5. Update navox.tech/network to add "Get Coaching →" button linking to navox.tech/coach
6. Submit to hackathon

---

## CONNECTION TO EXISTING NETWORK TOOL

In the existing `navox.tech/network` repo, add one change:

In `components/TopBar.tsx` (or equivalent), add a button:

```tsx
<a
  href="https://navox.tech/coach"
  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
>
  🧠 Get Coaching →
</a>
```

This is the only change needed to the existing repo.

---

## SUCCESS CRITERIA

The submission is complete when:

- [ ] User visits `navox.tech/coach` after uploading CSV at `navox.tech/network`
- [ ] Coach reads their network data automatically from localStorage
- [ ] Step 1: Coach explains their network in plain English
- [ ] Step 2: Coach identifies 3-5 reachable roles based on their actual connections
- [ ] Step 3: User picks a target → coach drafts a personalized outreach message
- [ ] Step 4: If no path exists → coach asks for target role + skills → recommends connection types
- [ ] Each completed step shows a reward animation
- [ ] All data stays in the browser — nothing uploaded anywhere
- [ ] "Clear my data" button wipes localStorage completely
- [ ] Mobile responsive
- [ ] Deployed and live at navox.tech/coach

---

## WHAT THIS IS

This is not a job board. This is not a resume tool. This is not a scraper.

This is a **strategic job search coaching tool** built on 50 years of network science. It takes the invisible referral economy — the one that new graduates, immigrants, career changers, and laid-off engineers can't see — and makes it visible, actionable, and human.

The user does the work. The coach shows them the path.
