import { useState, useEffect } from 'react'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { Loader2, Sparkles } from 'lucide-react'
import { AIProcessingOverlay } from '../../components/ui/AIProcessingOverlay'
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

interface Props {
  campaignId: string
}

export default function CampaignPlanTab({ campaignId }: Props) {
  const navigate = useNavigate()
  const { setToast } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<PlannedArticle[]>([])
  
  const [campData, setCampData] = useState<any>(null)
  
  const [planLoading, setPlanLoading] = useState(false)
  const [aiOverlayVisible, setAiOverlayVisible] = useState(false)
  const [aiOverlayStep, setAiOverlayStep] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [articles, camp] = await Promise.all([
        invoke<PlannedArticle[]>('article:list', { campaign_id: +campaignId }),
        invoke<any>('campaign:get', +campaignId)
      ])
      
      setPlan(articles || [])
      setCampData(camp || null)
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
    setAiOverlayVisible(true)
    setAiOverlayStep('Đang lập kế hoạch nội dung SEO...')
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
      setAiOverlayVisible(false)
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
                      <button 
                        className={`badge ${art.content_html ? 'badge-success' : 'badge-purple'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        onClick={() => navigate(`/article/edit/${art.id}`)}
                      >
                        {art.content_html ? 'Xem bài' : 'Xem bài'}
                      </button>
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



      <AIProcessingOverlay
        visible={aiOverlayVisible}
        stepLabel={aiOverlayStep}
        onCancel={() => { setAiOverlayVisible(false); setPlanLoading(false); }}
      />
    </>
  )
}
