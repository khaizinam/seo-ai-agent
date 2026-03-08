import React from 'react'
import { ButtonGenAI, Section } from '../ui'

interface Props {
  navKws: string[]
  infoKws: string[]
  setNavKws: React.Dispatch<React.SetStateAction<string[]>>
  setInfoKws: React.Dispatch<React.SetStateAction<string[]>>
  navInput: string
  setNavInput: React.Dispatch<React.SetStateAction<string>>
  infoInput: string
  setInfoInput: React.Dispatch<React.SetStateAction<string>>
  kwDirty: boolean
  setKwDirty: React.Dispatch<React.SetStateAction<boolean>>
  handleAiSuggest: () => void
  aiLoading: boolean
}

export default function KeywordManager({
  navKws, infoKws, setNavKws, setInfoKws,
  navInput, setNavInput, infoInput, setInfoInput,
  kwDirty, setKwDirty, handleAiSuggest, aiLoading
}: Props) {

  const handleTagInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    intent: 'navigational' | 'informational',
    inputValue: string,
    setInputValue: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTags(intent, inputValue)
      setInputValue('')
    }
  }

  const handleTagPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    intent: 'navigational' | 'informational'
  ) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    addTags(intent, text)
  }

  const addTags = (intent: 'navigational' | 'informational', text: string) => {
    const newTags = text.split(/\n|,/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
    if (newTags.length === 0) return
    setKwDirty(true)
    if (intent === 'navigational') {
      setNavKws(prev => Array.from(new Set([...prev, ...newTags])))
    } else {
      setInfoKws(prev => Array.from(new Set([...prev, ...newTags])))
    }
  }

  const removeTag = (intent: 'navigational' | 'informational', tagToRemove: string) => {
    setKwDirty(true)
    if (intent === 'navigational') {
      setNavKws(prev => prev.filter(t => t !== tagToRemove))
    } else {
      setInfoKws(prev => prev.filter(t => t !== tagToRemove))
    }
  }

  return (
    <Section
      title={`DANH SÁCH TỪ KHOÁ (${navKws.length + infoKws.length})`}
      action={
        <ButtonGenAI size="sm" loading={aiLoading} onClick={handleAiSuggest}>
          AI Trợ giúp
        </ButtonGenAI>
      }
      noPadding
    >
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Navigational Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} />
            Navigational Keywords
          </label>
          <div className="tag-input-box" onClick={() => document.getElementById('nav-kw-in')?.focus()}>
            {navKws.map(kw => (
              <span key={kw} className="kw-tag" style={{ borderLeft: '2px solid #8b5cf6' }}>
                {kw} <button onClick={e => { e.stopPropagation(); removeTag('navigational', kw) }}>✕</button>
              </span>
            ))}
            <input
              id="nav-kw-in"
              type="text"
              className="kw-tag-input"
              placeholder={navKws.length === 0 ? 'Nhập từ khoá và bấm Enter...' : 'Thêm từ khoá...'}
              value={navInput}
              onChange={e => setNavInput(e.target.value)}
              onKeyDown={e => handleTagInputKeyDown(e, 'navigational', navInput, setNavInput)}
              onPaste={e => handleTagPaste(e, 'navigational')}
            />
          </div>
        </div>

        {/* Informational Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
            Informational Keywords
          </label>
          <div className="tag-input-box" onClick={() => document.getElementById('info-kw-in')?.focus()}>
            {infoKws.map(kw => (
              <span key={kw} className="kw-tag" style={{ borderLeft: '2px solid #06b6d4' }}>
                {kw} <button onClick={e => { e.stopPropagation(); removeTag('informational', kw) }}>✕</button>
              </span>
            ))}
            <input
              id="info-kw-in"
              type="text"
              className="kw-tag-input"
              placeholder={infoKws.length === 0 ? 'Nhập từ khoá và bấm Enter...' : 'Thêm từ khoá...'}
              value={infoInput}
              onChange={e => setInfoInput(e.target.value)}
              onKeyDown={e => handleTagInputKeyDown(e, 'informational', infoInput, setInfoInput)}
              onPaste={e => handleTagPaste(e, 'informational')}
            />
          </div>
        </div>

        {kwDirty && (
          <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: -8 }}>
            * Có thay đổi chưa được lưu. Hãy bấm "Lưu thay đổi" để hệ thống cập nhật bộ từ khoá.
          </div>
        )}
      </div>
    </Section>
  )
}
