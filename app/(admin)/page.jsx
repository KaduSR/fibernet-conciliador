"use client";

import dynamic from 'next/dynamic'

const ConciliadorApp = dynamic(() => import('../../components/ConciliadorApp'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 12,
      background: '#F4F6FB', fontFamily: 'DM Sans, sans-serif'
    }}>
      <div style={{
        width: 40, height: 40, background: 'linear-gradient(135deg,#3B82F6,#1B5FAA)',
        borderRadius: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 20
      }}>💠</div>
      <p style={{ color: '#6B7A96', fontSize: 14 }}>Carregando FiberNet Conciliador...</p>
    </div>
  )
})

export default function Home() {
  return <ConciliadorApp />;
}
