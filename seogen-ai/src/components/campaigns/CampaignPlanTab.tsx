import { useState, useEffect } from 'react'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { Loader2, Sparkles, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface PlannedArticle {
  id: number
  title: string
  article_type: 'pillar' | 'satellite'
  week_number: number
  meta_title?: string
  meta_description?: string
  keyword?: string
  status: string
  content_html?: string
}

interface Persona {
  id: number
  name: string
}

interface Props {
  campaignId: string
}

export default function CampaignPlanTab({ campaignId }: Props) {
  const navigate = useNavigate()
  const { setToast } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<PlannedArticle[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | ''>('')
  
  const [campData, setCampData] = useState<any>(null)
  
  const [planLoading, setPlanLoading] = useState(false)
  const [showWriteModal, setShowWriteModal] = useState<PlannedArticle | null>(null)
  const [writingContent, setWritingContent] = useState(false)
  const [viewArticle, setViewArticle] = useState<{ html: string; title: string } | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [articles, pers, camp] = await Promise.all([
        invoke<PlannedArticle[]>('article:list', { campaign_id: +campaignId }),
        invoke<Persona[]>('persona:list'),
        invoke<any>('campaign:get', +campaignId)
      ])
      
      setPlan(articles || [])
      setCampData(camp || null)
      
      if (pers) {
        setPersonas(pers)
        if (pers.length > 0) setSelectedPersonaId(pers[0].id)
      }
    } catch (e: any) {
      setToast({ message: e.message || 'Lỗi khi tải dữ liệu Kế hoạch', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (campaignId) {
      fetchData()
    }
  }, [campaignId])

  const handleGenerateContentPlan = async () => {
    if (!campData || !campData.name) return
    setPlanLoading(true)
    try {
      const res = await invoke<{ success: boolean; count?: number; error?: string }>('campaign:generateContentPlan', {
        id: +campaignId,
        name: campData.name,
        description: campData.description,
        duration_type: campData.duration_type,
        duration_value: campData.duration_value,
        articles_per_week: campData.articles_per_week
      })
      if (res.success) {
        setToast({ message: `Đã tạo kế hoạch gồm ${res.count} bài viết`, type: 'success' })
        await fetchData()
      } else {
        setToast({ message: res.error || 'Lỗi khi lập kế hoạch', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setPlanLoading(false)
    }
  }

  const handleWriteArticle = async () => {
    if (!showWriteModal || !selectedPersonaId) return
    setWritingContent(true)
    try {
      const res = await invoke<{ success: boolean; content?: string; error?: string }>('article:generateFullContent', {
        articleId: showWriteModal.id,
        personaId: +selectedPersonaId
      })
      if (res.success) {
        setToast({ message: 'Đã viết xong bài viết!', type: 'success' })
        await fetchData()
        setShowWriteModal(null)
      } else {
        setToast({ message: res.error || 'Lỗi khi viết bài', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setWritingContent(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" color="var(--brand-primary)" />
      </div>
    )
  }

  const durationType = campData?.duration_type || 'weeks'

  // Calculate Pagination
  const totalItems = plan.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPlan = plan.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  return (
    <>
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>KẾ HOẠCH NỘI DUNG ({plan.length})</h3>
          <button 
            className="btn-secondary" 
            style={{ height: 32, fontSize: 12, borderRadius: 6, background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', color: 'white', border: 'none' }}
            onClick={handleGenerateContentPlan}
            disabled={planLoading}
          >
            {planLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            Lập kế hoạch AI
          </button>
        </div>
        
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60, background: 'rgba(255,255,255,0.02)' }}>ID</th>
                  <th style={{ background: 'rgba(255,255,255,0.02)' }}>Tiêu đề bài viết</th>
                  <th style={{ width: 200, background: 'rgba(255,255,255,0.02)' }}>Từ khoá</th>
                  <th style={{ width: 80, background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>Tuần</th>
                  <th style={{ width: 100, background: 'rgba(255,255,255,0.02)' }}>Loại</th>
                  <th style={{ width: 140, background: 'rgba(255,255,255,0.02)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlan.map(art => (
                  <tr key={art.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{art.id}</td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={art.title}>
                        {art.title}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {art.keyword?.split(',').map((kw: string, i: number) => (
                          <span key={i} style={{ fontSize: 11, background: 'var(--surface-1)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{art.week_number}</td>
                    <td>
                      <span className={`badge ${art.article_type === 'pillar' ? 'badge-purple' : 'badge-muted'}`}>
                        {art.article_type === 'pillar' ? 'Pillar' : 'Satellite'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {art.content_html ? (
                        <button className="badge badge-success" onClick={() => setViewArticle({ html: art.content_html || '', title: art.title })}>
                          Xem bài
                        </button>
                      ) : (
                        <div style={{display: 'flex', gap: 6, justifyContent: 'flex-end'}}>
                           <button 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: 11, background: '#a855f7' }}
                            onClick={() => setShowWriteModal(art)}
                          >
                            AI Viết
                          </button>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: 11, background: 'var(--brand-primary)' }}
                            onClick={() => navigate(`/article/create?plannedId=${art.id}`)}
                          >
                            Viết tay
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {plan.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <div>Bấm "Lập kế hoạch AI" để tạo danh sách bài viết theo thời gian</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <span>Hiển thị</span>
                <select 
                  className="select" 
                  style={{ height: 32, padding: '0 10px', fontSize: 13, minWidth: 70 }}
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(+e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>bài viết / trang</span>
                <span style={{ marginLeft: 16 }}>
                  (Tổng cộng: <b style={{ color: 'var(--text-primary)' }}>{totalItems}</b> bài viết)
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: 13 }}
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Trang trước
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40, fontSize: 13, fontWeight: 600 }}>
                  {currentPage} / {totalPages || 1}
                </div>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: 13 }}
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Article viewer modal */}
      {viewArticle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '85vw', maxWidth: 860, height: '85vh', display: 'flex', flexDirection: 'column' }} className="glass-card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{viewArticle.title}</span>
              <button className="btn-ghost" onClick={() => setViewArticle(null)} style={{ fontSize: 20 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 32, background: '#fff', borderRadius: '0 0 10px 10px' }}>
              <div style={{ color: '#1a1a1a', lineHeight: 1.8, fontFamily: 'Georgia, serif', fontSize: 16 }} dangerouslySetInnerHTML={{ __html: viewArticle.html }} />
            </div>
          </div>
        </div>
      )}

      {/* Write Article Modal */}
      {showWriteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Viết bài với AI</h3>
            </div>
            
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Bài viết chuẩn bị viết:</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{showWriteModal.title}</div>
                <div style={{ fontSize: 12, color: 'var(--brand-primary)', marginTop: 4 }}>Từ khoá: {showWriteModal.keyword}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label className="label">Chọn Nhân vật / Giọng văn</label>
                <select 
                  className="select" 
                  value={selectedPersonaId}
                  onChange={e => setSelectedPersonaId(+e.target.value)}
                >
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  {personas.length === 0 && <option value="">Chưa có nhân vật nào</option>}
                </select>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--surface-1)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                AI sẽ tạo nội dung bài viết theo tiêu chuẩn HTML (H2-H6, P, A, STRONG), dài 1000-2000 từ.
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn-secondary" onClick={() => setShowWriteModal(null)} disabled={writingContent}>Hủy</button>
              <button 
                className="btn-primary" 
                style={{ background: 'var(--brand-primary)', color: 'white' }} 
                onClick={handleWriteArticle} 
                disabled={writingContent || !selectedPersonaId}
              >
                {writingContent ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Bắt đầu viết bài
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
