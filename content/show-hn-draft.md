# Show HN: I maxed out Gemini's free tier to run a 4-agent company — 105 daily tasks, $0/month

I'm a solo founder in Taiwan running a tech agency (Ultra Lab). No employees — 4 AI agents handle content, leads, security scanning, and ops while I sleep.

The interesting part: it all runs on Gemini 2.5 Flash **free tier** (1,500 requests/day). Most people burn that on 15 chat sessions. I use ~105 requests to run an entire automated business.

## The Architecture

4 agents on OpenClaw, each with a role:

- **UltraLabTW** — virtual CEO, brand content, strategic decisions
- **MindThreadBot** — social media automation (27 Threads accounts, 12K+ followers)
- **UltraProbeBot** — AI security scanner, generates probe-leads
- **UltraAdvisor** — financial advisory content

They run on WSL2 on a Windows box at home. 25 systemd timers orchestrate everything.

## What 105 Daily Requests Actually Do

**Content Pipeline (24 calls/day)**
- 8 posts/day across Moltbook (2 per agent)
- Each post goes through a quality gate: generate → self-review → rewrite if <7/10
- Posts are informed by real data: RSS feeds, HN trending, competitor analysis, own performance stats

**Engagement (34 calls/day)**
- 4 agents engage with other posts (1x/day each)
- Reply-checker monitors comments on our posts, auto-replies with context-aware responses
- Conversation threading: tracks reply depth, keeps discussions going (max 2 rounds)
- Cross-agent engagement on Tue/Fri

**Intelligence (15 calls/day)**
- Research chain: blogwatcher (RSS) + HN API → summarize (Jina Reader) → agent analyzes relevance
- Competitor watch: tracks trending posts, title patterns, active authors
- Post performance tracker: score, upvotes, comments → feeds back into content strategy

**Operations (5 calls/day)**
- Inquiry tracker: flags stale leads (>24h no reply) → Telegram alert
- Lead follow-up: drafts outreach for probe-scan leads
- Blog-to-social: detects new blog posts, auto-generates social content
- Health monitor: checks 7 endpoints hourly

**Strategy (1 call/week)**
- Weekly strategy session: all 4 agents propose priorities → CEO agent synthesizes into next week's plan

## The Data Flow

```
05:00  Research chain → RESEARCH-NOTES.md
06:00  Customer insights sync + Inquiry tracker
06:30  Competitor watch → COMPETITOR-INTEL.md
07-10  Autopost (all 4 agents, quality-gated)
10:00  Engagement (staggered across agents)
11:00  Reply checker (conversation threading)
14:00  Blog-to-social (if new content)
17:00  Research chain (round 2)
22:00  Post stats → POST-PERFORMANCE.md
23:00  Daily reflect + memory consolidation
Sun    Weekly strategy session
```

Every autopost reads: POST-PERFORMANCE.md + COMPETITOR-INTEL.md + RESEARCH-NOTES.md + HN trending + RSS feeds before generating. The agent knows what worked, what flopped, and what the world is talking about — all before writing a single word.

## Real Numbers

- 25 active timers, 62 scripts, 19 workspace intelligence files
- 27 Threads accounts, 12K+ followers, 3.3M views (all automated)
- Average Moltbook post score: 5.0 (top performer: 14)
- Monthly cost: $0 LLM + ~$5 infra = **$5/month**
- RPD utilization: ~7% (105/1,500) — 93% headroom for interactive chat

## What Went Wrong

- **$127.80 Gemini bill in 7 days.** Created API key from a billing-enabled GCP project. Thinking tokens ($3.50/1M) ate everything with no rate limit cap. Fix: always create keys from AI Studio, never from billing-enabled projects.

- **Same post title 3x in one day.** Pillar rotation used `day_of_year % 5` — same result all day. Fix: `(day * 2 + hour/12) % 5` for per-post variation.

- **Telegram heartbeat restart loop.** Health check called `getUpdates` which conflicted with the gateway's long-polling. 18 duplicate messages in 3 minutes.

- **33 reply-checker replies in one batch** hit the rate limit and starved other tasks. Now I know: backlog clearance should be capped.

## The Key Insight

The expensive part of AI agents isn't the LLM — it's **wasted context**. Long conversations burn tokens on repeated context. Short, focused tasks with pre-computed data are 100x more efficient.

Our agents never have long conversations with the LLM. Every request is:
1. Read pre-computed intelligence files (0 tokens to produce)
2. One focused prompt with all context injected
3. One response, parse it, act on it, done

The research step (RSS + HN + summarize) costs 0 LLM tokens — it's pure HTTP. The intelligence files (performance, competitors, research notes) cost 0 to read — they're local markdown. The LLM only touches the creative/analytical work.

## Stack

- Agent framework: OpenClaw (open source)
- LLM: Gemini 2.5 Flash free tier (1,500 RPD)
- Runtime: WSL2 Ubuntu on Windows, systemd timers
- Frontend: React + TypeScript + Vite
- Hosting: Vercel (sites) + home Windows box (agents)
- Database: Firebase Firestore
- Tools: blogwatcher (RSS), Jina Reader (summarize), HN API, Moltbook API
- Notifications: Telegram Bot + Resend email

## What I'm Building Next

Turning this into a productized service — agent fleet setup + themed visual dashboards (watch them work live: https://ultralab.tw/agent). The optimization playbook alone is worth packaging: most agent operators I've talked to are burning 10-50x more tokens for less output.

Happy to answer questions about architecture, token optimization, or the operational reality of running AI agents 24/7.

---

## Submission Notes

- **Moltbook**: Post as-is to r/tech via UltraLabTW
- **HN**: Post to https://news.ycombinator.com/submit
  - Title: "Show HN: I maxed out Gemini's free tier to run a 4-agent company – 105 daily tasks, $0/month"
  - Best time: Tue-Thu, 6-9 AM US Eastern (= 6-9 PM Taiwan)
- **Blog**: Expand into full article at `content/blog/maxed-free-tier-agent-fleet.md`
  - Add: code snippets, architecture diagram, RPD budget spreadsheet
  - This becomes the long-form lead magnet
