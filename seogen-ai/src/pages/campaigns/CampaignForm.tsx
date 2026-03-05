import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import CampaignDetailsTab from '../../components/campaigns/CampaignDetailsTab'
import CampaignPlanTab from '../../components/campaigns/CampaignPlanTab'

export default function CampaignForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const { setToast } = useAppStore()

  const [activeTab, setActiveTab] = useState<'details' | 'plan'>('details')
  const [exporting, setExporting] = useState(false)

  const handleCancel = () => {
    navigate('/campaign')
  }

  const handleExportReport = async () => {
    if (!id) return
    setExporting(true)
    try {
      const res = await invoke<{ success: boolean; filePath?: string; error?: string }>('campaign:exportReport', +id)
      if (res.success) {
        setToast({ message: `Đã xuất báo cáo: ${res.filePath}`, type: 'success' })
      } else if (res.error === 'cancelled') {
        // User cancelled save dialog — do nothing
      } else {
        setToast({ message: res.error || 'Lỗi khi xuất báo cáo', type: 'error' })
      }
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ padding: '28px 40px', maxWidth: '100%', margin: '0' }}>
      {/* Header Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button className="btn-ghost" onClick={handleCancel} style={{ padding: '6px 10px', fontSize: 13, background: 'var(--surface-1)' }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {isEdit ? 'Chỉnh sửa Chiến dịch' : 'Thêm Chiến dịch mới'}
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {isEdit ? 'Cập nhật thông tin chiến dịch SEO' : 'Điền thông tin để tạo chiến dịch từ khoá mới'}
            </p>
        </div>
        {isEdit && (
          <button
            className="btn-secondary"
            onClick={handleExportReport}
            disabled={exporting}
            style={{ fontSize: 12, gap: 6 }}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            Xuất báo cáo .md
          </button>
        )}
      </div>

      {isEdit && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <button 
            className="btn-ghost"
            style={{ 
              background: activeTab === 'details' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: activeTab === 'details' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'details' ? 600 : 500
            }}
            onClick={() => setActiveTab('details')}
          >
            Thông tin & Từ khoá
          </button>
          <button 
            className="btn-ghost"
            style={{ 
              background: activeTab === 'plan' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: activeTab === 'plan' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'plan' ? 600 : 500
            }}
            onClick={() => setActiveTab('plan')}
          >
            Kế hoạch Nội dung
          </button>
        </div>
      )}

      {activeTab === 'details' && <CampaignDetailsTab campaignId={id} />}
      {activeTab === 'plan' && id && <CampaignPlanTab campaignId={id} />}
      
    </div>
  )
}
