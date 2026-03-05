import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'

interface AIProcessingOverlayProps {
  visible: boolean
  stepLabel: string
  subLabel?: string
  onCancel: () => void
}

export function AIProcessingOverlay({ visible, stepLabel, subLabel, onCancel }: AIProcessingOverlayProps) {
  const [show, setShow] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (visible) {
      setFadeOut(false)
      setShow(true)
    } else if (show) {
      // Fade out then hide
      setFadeOut(true)
      const timer = setTimeout(() => {
        setShow(false)
        setFadeOut(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>
      {/* AI Loading Animation */}
      <div style={{
        position: 'relative', width: 100, height: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.15)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#6366f1',
          borderRightColor: '#8b5cf6',
          animation: 'aiOverlaySpin 1.2s linear infinite',
        }} />

        {/* Middle ring */}
        <div style={{
          position: 'absolute', inset: 12,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderBottomColor: '#a78bfa',
          borderLeftColor: '#6366f1',
          animation: 'aiOverlaySpin 1.8s linear infinite reverse',
        }} />

        {/* Inner glow */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0) 70%)',
          animation: 'aiOverlayPulse 2s ease-in-out infinite',
        }} />

        {/* Center icon */}
        <div style={{
          position: 'absolute',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={22} color="#a78bfa" style={{ animation: 'aiOverlaySpin 2s linear infinite' }} />
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 20, fontWeight: 700,
          background: 'linear-gradient(135deg, #a78bfa, #6366f1, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 10,
        }}>
          AI đang xử lý
        </div>
        {/* Step label */}
        <div style={{
          fontSize: 14, color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.6,
          minHeight: 22,
          transition: 'all 0.3s ease',
        }}>
          {stepLabel}
        </div>
        {/* Sub label for model switch notifications */}
        {subLabel && (
          <div style={{
            marginTop: 8,
            fontSize: 12,
            color: '#fbbf24',
            lineHeight: 1.5,
            padding: '6px 14px',
            borderRadius: 8,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            transition: 'all 0.3s ease',
          }}>
            ⚡ {subLabel}
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#6366f1',
            animation: `aiOverlayBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        style={{
          marginTop: 8,
          padding: '10px 28px',
          borderRadius: 10,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.08)',
          color: '#f87171',
          fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)' }}
      >
        <X size={14} />
        Huỷ tiến trình
      </button>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes aiOverlaySpin {
          to { transform: rotate(360deg); }
        }
        @keyframes aiOverlayPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes aiOverlayBounce {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
