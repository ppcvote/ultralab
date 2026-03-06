/* ── Pathfinding: door-based movement through corridor ──
   Star-Office-UI insight: agents should spend ~80% of time at their desk
   "working", with short occasional trips. Movement is an EVENT, not the
   default state. This makes the office feel productive, not chaotic.

   Route structure per cycle:
   1. Work at desk (15-25s) ← THIS IS THE MAIN STATE
   2. Walk to server room (3-5s there)
   3. Walk back to desk
   4. Work at desk again (15-25s)
   5. Pace inside room briefly
   6. Back to desk → repeat

   CRITICAL: Each step's `ms` must be >= the CSS transition duration,
   otherwise the agent will be redirected before visually arriving,
   causing teleportation. Transition = 1200 / speed ms. */

import { ROOMS, AGENTS_VISUAL, getHomeRoom } from './agent-data'

export type Pos = { x: number; y: number }
export type Step = { pos: Pos; ms: number; state: 'working' | 'walking' | 'idle' }

/** CSS transition base duration in ms */
const TRANSITION_MS = 1200

/* ── Per-agent work rhythms ── */
const WORK_PATTERNS: Record<string, { deskTime: number; serverTime: number; paceTime: number }> = {
  main:  { deskTime: 18000, serverTime: 4000, paceTime: 3000 },  // Boss: works long, checks server
  mind:  { deskTime: 14000, serverTime: 3500, paceTime: 2500 },  // Content creator: moderate pace
  probe: { deskTime: 20000, serverTime: 5000, paceTime: 2000 },  // Hacker: deep focus, long scans
  adv:   { deskTime: 16000, serverTime: 2500, paceTime: 3500 },  // Advisor: paces more (thinking)
}

/** Ensure timing is at least the CSS transition duration */
function walkStep(pos: Pos, dwell: number, speed: number): Step {
  const transTime = Math.round(TRANSITION_MS / speed)
  return { pos, ms: Math.max(transTime + 100, Math.round(dwell / speed)), state: 'walking' }
}

function workStep(pos: Pos, dwell: number, speed: number): Step {
  return { pos, ms: Math.round(dwell / speed), state: 'working' }
}

function idleStep(pos: Pos, dwell: number, speed: number): Step {
  return { pos, ms: Math.round(dwell / speed), state: 'idle' }
}

/* ── Build a full route for an agent ── */
export function buildRoute(agentId: string): Step[] {
  const visual = AGENTS_VISUAL.find(a => a.id === agentId)
  if (!visual) return []

  const sp = visual.speed
  const cy = visual.corridorY
  const homeRoom = getHomeRoom(agentId)
  const serverRoom = ROOMS.find(r => r.id === 'srv')
  if (!homeRoom || !serverRoom) return []

  const pattern = WORK_PATTERNS[agentId] ?? WORK_PATTERNS.main
  const steps: Step[] = []

  // ── Phase 1: Work at desk (long) ──
  steps.push(workStep(homeRoom.desk, pattern.deskTime, sp))

  // ── Phase 2: Walk to server room ──
  steps.push(walkStep(homeRoom.door, 1400, sp))
  steps.push(walkStep({ x: homeRoom.door.x, y: cy }, 1400, sp))
  const dist1 = Math.abs(homeRoom.door.x - serverRoom.door.x)
  steps.push(walkStep({ x: serverRoom.door.x, y: cy }, 1400 + dist1 * 20, sp))
  steps.push(walkStep(serverRoom.door, 1400, sp))

  // ── Phase 3: Work at server room briefly ──
  steps.push(workStep(serverRoom.desk, pattern.serverTime, sp))

  // ── Phase 4: Walk back to home room ──
  steps.push(walkStep(serverRoom.door, 1400, sp))
  steps.push(walkStep({ x: serverRoom.door.x, y: cy }, 1400, sp))
  steps.push(walkStep({ x: homeRoom.door.x, y: cy }, 1400 + dist1 * 20, sp))
  steps.push(walkStep(homeRoom.door, 1400, sp))

  // ── Phase 5: Work at desk again (long) ──
  steps.push(workStep(homeRoom.desk, pattern.deskTime, sp))

  // ── Phase 6: Pace inside room (stretch legs) ──
  steps.push(walkStep(homeRoom.pace, 1800, sp))
  steps.push(idleStep(homeRoom.pace, pattern.paceTime, sp))
  steps.push(walkStep(homeRoom.desk, 1800, sp))

  // Route loops back to Phase 1 via modulo

  return steps
}

/* ── Staggered initial step indices ──
   Each agent starts at a different phase of their cycle so they don't
   all leave their desks at the same time. */
export const INIT_STEPS: Record<string, number> = {
  main:  0,   // at desk (working)
  mind:  11,  // at desk (second work phase)
  probe: 6,   // at server room (working)
  adv:   13,  // pacing inside room
}
