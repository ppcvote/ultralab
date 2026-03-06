/* ── Corridor Decorations ──
   Vending machine, bulletin board, fire extinguisher,
   wall clock (real time), floor mats at doors, extra plants.
   All positioned absolute within the floorplan container. */

import { useState, useEffect } from 'react'

const h2a = (h: string, a: number) => {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ── Wall Clock — shows real time ── */
function WallClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const hh = now.getHours().toString().padStart(2, '0')
  const mm = now.getMinutes().toString().padStart(2, '0')
  const blink = now.getSeconds() % 2 === 0

  return (
    <div style={{
      position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
      width: 32, height: 18, background: 'rgba(12,8,24,0.95)',
      border: '1px solid rgba(138,92,255,0.25)', borderRadius: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3, boxShadow: '0 0 8px rgba(138,92,255,0.08)',
    }}>
      <span style={{
        fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
        color: '#8A5CFF', letterSpacing: 1,
      }}>
        {hh}<span style={{ opacity: blink ? 1 : 0.2 }}>:</span>{mm}
      </span>
    </div>
  )
}

/* ── Vending Machine — right corridor edge ── */
function VendingMachine() {
  return (
    <div style={{
      position: 'absolute', top: '43%', right: '1.5%',
      width: 20, height: 38, background: 'rgba(18,12,32,0.95)',
      border: '1px solid rgba(77,163,255,0.2)', borderRadius: 2, zIndex: 3,
    }}>
      {/* Display screen */}
      <div className="nc-screen" style={{
        position: 'absolute', top: 3, left: 3, width: 14, height: 9,
        background: 'rgba(77,163,255,0.5)', borderRadius: 1,
        boxShadow: '0 0 6px rgba(77,163,255,0.3)',
      }} />
      {/* Item rows */}
      {[15, 21, 27].map((t, i) => (
        <div key={i} style={{
          position: 'absolute', top: t, left: 3, width: 14, height: 4,
          background: `rgba(77,163,255,${0.06 + i * 0.02})`, borderRadius: 1,
        }} />
      ))}
      {/* Coin slot */}
      <div style={{
        position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
        width: 6, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1,
      }} />
    </div>
  )
}

/* ── Bulletin Board — between top rooms ── */
function BulletinBoard() {
  return (
    <div style={{
      position: 'absolute', top: '18%', left: '42%',
      width: 30, height: 22, background: 'rgba(60,42,24,0.8)',
      border: '1px solid rgba(120,80,40,0.3)', borderRadius: 2, zIndex: 3,
    }}>
      {/* Cork texture */}
      <div style={{ position: 'absolute', inset: 2, background: 'rgba(180,140,80,0.08)', borderRadius: 1 }} />
      {/* Pinned notes — each agent's color */}
      <div style={{ position: 'absolute', top: 3, left: 3, width: 10, height: 7, background: 'rgba(138,92,255,0.45)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', top: 3, left: 15, width: 10, height: 7, background: 'rgba(20,184,166,0.45)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', top: 12, left: 5, width: 10, height: 7, background: 'rgba(239,68,68,0.4)', borderRadius: 1 }} />
      <div style={{ position: 'absolute', top: 12, left: 17, width: 10, height: 7, background: 'rgba(245,158,11,0.4)', borderRadius: 1 }} />
      {/* Push pins */}
      <div style={{ position: 'absolute', top: 1, left: 7, width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
      <div style={{ position: 'absolute', top: 1, left: 19, width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
    </div>
  )
}

/* ── Fire Extinguisher — left wall ── */
function FireExtinguisher() {
  return (
    <div style={{ position: 'absolute', top: '47%', left: '0.8%', zIndex: 3 }}>
      <div style={{
        width: 8, height: 18, background: 'rgba(220,50,50,0.6)',
        borderRadius: '2px 2px 1px 1px', border: '1px solid rgba(220,50,50,0.4)',
      }} />
      <div style={{
        position: 'absolute', top: -4, left: 1, width: 6, height: 5,
        background: 'rgba(160,160,160,0.4)', borderRadius: '2px 2px 0 0',
      }} />
    </div>
  )
}

/* ── Floor Mat — colored strip at door ── */
function FloorMat({ top, left, color }: { top: string; left: string; color: string }) {
  return (
    <div style={{
      position: 'absolute', top, left,
      width: 26, height: 6, borderRadius: 2,
      background: h2a(color, 0.07),
      border: `1px solid ${h2a(color, 0.05)}`,
      transform: 'translateX(-50%)',
      zIndex: 0,
    }} />
  )
}

/* ── Small Potted Plant ── */
function MiniPlant({ top, left }: { top: string; left: string }) {
  return (
    <div style={{ position: 'absolute', top, left, zIndex: 3 }}>
      <div style={{
        width: 10, height: 5, background: 'rgba(80,56,36,0.7)',
        borderRadius: '0 0 2px 2px',
      }} />
      <div style={{
        position: 'absolute', top: -7, left: -2,
        width: 14, height: 10, background: 'rgba(34,197,94,0.4)',
        borderRadius: '50%',
      }} />
    </div>
  )
}

/* ── Wall Pipe (decorative) ── */
function WallPipe({ top, left, width }: { top: string; left: string; width: number }) {
  return (
    <div style={{
      position: 'absolute', top, left,
      width, height: 3,
      background: 'rgba(100,100,120,0.15)',
      borderRadius: 1, zIndex: 0,
    }} />
  )
}

export default function CorridorDecor() {
  return <>
    {/* Wall features (between top rooms) */}
    <WallClock />
    <BulletinBoard />

    {/* Corridor furniture */}
    <VendingMachine />
    <FireExtinguisher />

    {/* Extra plants scattered along corridor */}
    <MiniPlant top="52%" left="34%" />
    <MiniPlant top="44%" left="68%" />

    {/* Wall pipes (industrial detail) */}
    <WallPipe top="40.5%" left="38%" width={24} />
    <WallPipe top="59%" left="62%" width={18} />

    {/* Floor mats at all 5 doors */}
    <FloorMat top="44%" left="19%" color="#8A5CFF" />   {/* COMMAND */}
    <FloorMat top="44%" left="80%" color="#4DA3FF" />   {/* SERVER */}
    <FloorMat top="56%" left="16%" color="#14B8A6" />   {/* SOCIAL */}
    <FloorMat top="56%" left="49%" color="#EF4444" />   {/* SEC-LAB */}
    <FloorMat top="56%" left="82%" color="#F59E0B" />   {/* ADVISORY */}
  </>
}
