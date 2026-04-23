import React, { useEffect, useState } from 'react'
import { PageHeader, Section, Button, DataTable } from '../components/ui'
import { History, Trash2, ChevronRight, ChevronDown, Clock, Cpu, MessageSquare } from 'lucide-react'
import { invoke } from '../lib/api'
import { useAppStore } from '../stores/app.store'

interface AiLog {
  id: number
  provider: string
  model: string
  messages: string
  response: string
  duration_ms: number
  status: 'success' | 'error'
  error_message: string
  created_at: string
}

export default function AiHistory() {
  const { setToast } = useAppStore()
  const [logs, setLogs] = useState<AiLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    const res = await invoke<{ success: boolean; logs: AiLog[]; total: number; error?: string }>('ai:listLogs', { page, limit: 20 })
    if (res.success) {
      setLogs(res.logs)
      setTotal(res.total)
    } else {
      setToast({ message: res.error || 'Lỗi tải lịch sử', type: 'error' })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa log này?')) return
    const res = await invoke<{ success: boolean }>('ai:deleteLog', id)
    if (res.success) {
      setToast({ message: 'Đã xóa log', type: 'success' })
      fetchLogs()
    }
  }

  const handleClear = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử?')) return
    const res = await invoke<{ success: boolean }>('ai:clearLogs')
    if (res.success) {
      setToast({ message: 'Đã xóa toàn bộ lịch sử', type: 'success' })
      fetchLogs()
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN')
  }

  const columns = [
    {
      key: 'expand',
      title: '',
      width: 40,
      render: (row: AiLog) => (
        <button 
          className="btn-ghost" 
          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
          style={{ padding: 4 }}
        >
          {expandedId === row.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      )
    },
    {
      key: 'created_at',
      title: 'Thời gian',
      width: 160,
      render: (row: AiLog) => (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {formatDate(row.created_at)}
        </div>
      )
    },
    {
      key: 'provider',
      title: 'Provider / Model',
      render: (row: AiLog) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
            background: 'var(--surface-2)', color: 'var(--text-primary)',
            textTransform: 'uppercase'
          }}>
            {row.provider}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.model}</span>
        </div>
      )
    },
    {
      key: 'duration',
      title: 'Thời gian phản hồi',
      width: 140,
      render: (row: AiLog) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Clock size={14} color="var(--text-muted)" />
          <span>{(row.duration_ms / 1000).toFixed(2)}s</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: 120,
      render: (row: AiLog) => (
        <div style={{ 
          display: 'inline-flex', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
          background: row.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: row.status === 'success' ? '#10b981' : '#ef4444'
        }}>
          {row.status === 'success' ? 'Thành công' : 'Lỗi'}
        </div>
      )
    }
  ]

  const renderExpanded = (row: AiLog) => {
    let messages: any[] = []
    try {
      messages = JSON.parse(row.messages)
    } catch (e) {}

    return (
      <div key={`expanded-${row.id}`} style={{ 
        padding: '20px', background: 'var(--surface-1)', borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 20
      }}>
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={14} /> Request (Messages)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ 
                padding: '12px', borderRadius: 8, 
                background: m.role === 'user' ? 'var(--surface-2)' : 'var(--surface-0)',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', color: 'var(--brand-primary)' }}>
                  {m.role}
                </div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.content}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={14} /> AI Response
          </h4>
          <div style={{ 
            padding: '16px', borderRadius: 8, background: 'var(--surface-0)', border: '1px solid var(--border)',
            maxHeight: 400, overflowY: 'auto'
          }}>
            {row.status === 'success' ? (
              <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{row.response}</div>
            ) : (
              <div style={{ color: '#ef4444', fontSize: 13 }}>{row.error_message}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageHeader 
        title="Lịch sử AI API" 
        subtitle="Theo dõi và quản lý các lượt gọi API tới AI provider."
        actions={
          <Button variant="secondary" icon={<Trash2 size={16} />} onClick={handleClear}>
            Xóa trắng lịch sử
          </Button>
        }
      />

      <div style={{ margin: 24, flex: 1 }}>
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          rowKey={(r) => r.id}
          rowActions={(row) => (
            <button className="btn-ghost text-red-500" onClick={() => handleDelete(row.id)}>
              <Trash2 size={16} />
            </button>
          )}
          pagination={{
            page,
            total,
            pageSize: 20,
          }}
          onPageChange={setPage}
        />
        {expandedId !== null && (
          <div style={{ marginTop: -12, marginBottom: 24 }}>
            {logs.find(l => l.id === expandedId) && renderExpanded(logs.find(l => l.id === expandedId)!)}
          </div>
        )}
      </div>
    </div>
  )
}
