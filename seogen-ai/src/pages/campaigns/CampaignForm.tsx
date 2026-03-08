import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileDown } from 'lucide-react'
import { invoke } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import CampaignDetailsTab from '../../components/campaigns/CampaignDetailsTab'
import CampaignPlanTab from '../../components/campaigns/CampaignPlanTab'
import { PageHeader, TabBar, Button } from '../../components/ui'

const CAMPAIGN_TABS = [
  { key: 'details', label: 'Thông tin & Từ khoá' },
  { key: 'plan', label: 'Kế hoạch Nội dung' },
]

export default function CampaignForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const { setToast } = useAppStore()

  const [activeTab, setActiveTab] = useState<'details' | 'plan'>('details')
  const [exporting, setExporting] = useState(false)

  const handleCancel = () => navigate('/campaign')

  const handleExportReport = async () => {
    if (!id) return
    setExporting(true)
    try {
      const res = await invoke<{ success: boolean; filePath?: string; error?: string }>('campaign:exportReport', +id)
      if (res.success) {
        setToast({ message: `Đã xuất báo cáo: ${res.filePath}`, type: 'success' })
      } else if (res.error === 'cancelled') {
        // User cancelled save dialog
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
    <div style={{ padding: '28px 40px', maxWidth: '100%' }}>
      <PageHeader
        title={isEdit ? 'Chỉnh sửa Chiến dịch' : 'Thêm Chiến dịch mới'}
        subtitle={isEdit ? 'Cập nhật thông tin chiến dịch SEO' : 'Điền thông tin để tạo chiến dịch từ khoá mới'}
        onBack={handleCancel}
        actions={isEdit
          ? (
            <Button
              variant="secondary"
              size="sm"
              loading={exporting}
              icon={<FileDown size={14} />}
              onClick={handleExportReport}
            >
              Xuất báo cáo .md
            </Button>
          )
          : undefined
        }
      />

      {isEdit && (
        <TabBar
          tabs={CAMPAIGN_TABS}
          active={activeTab}
          onChange={v => setActiveTab(v as 'details' | 'plan')}
        />
      )}

      {activeTab === 'details' && <CampaignDetailsTab campaignId={id} />}
      {activeTab === 'plan' && id && <CampaignPlanTab campaignId={id} />}
    </div>
  )
}
