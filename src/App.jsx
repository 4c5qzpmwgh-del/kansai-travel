import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// ⚠️⚠️⚠️ 請將下方這兩行，換回您剛剛備份的網址與 Key ⚠️⚠️⚠️
const supabaseUrl = 'https://wqwazukgsahnbmrjfihj.supabase.co'
const supabaseKey = 'sb_publishable_EHxsxvA9fn8Gq8LMMndhQw_68lr1qXv'

const supabase = createClient(supabaseUrl, supabaseKey)

// 產生時間選項
const timeOptions = []
for (let i = 0; i < 24; i++) {
  const hour = i.toString().padStart(2, '0')
  timeOptions.push(`${hour}:00`)
  timeOptions.push(`${hour}:30`)
}

// --- 樣式設定 (Styles) ---
const theme = {
  primary: '#0EA5E9', // 天空藍
  bg: '#F3F4F6',      // 淺灰背景
  text: '#1F2937',    // 深灰文字
  white: '#FFFFFF',
  danger: '#EF4444',  // 紅色
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  radius: '12px'
}

function App() {
  const [activeTab, setActiveTab] = useState('schedule')
  const [currentDay, setCurrentDay] = useState(1)
  const [totalDays, setTotalDays] = useState(3)
  const [plans, setPlans] = useState([])
  const [budgetItems, setBudgetItems] = useState([])
  
  const [planInput, setPlanInput] = useState('')
  const [timeInput, setTimeInput] = useState('09:00')
  const [budgetItem, setBudgetItem] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetPayer, setBudgetPayer] = useState('')
  const [budgetUnpaid, setBudgetUnpaid] = useState('')

  useEffect(() => {
    fetchData()
    // 雖然有即時監聽，但為了保險，我們等下在功能裡也會強制刷新
    const sub1 = supabase.channel('plans-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => fetchData()).subscribe()
    const sub2 = supabase.channel('budget-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'budget' }, () => fetchData()).subscribe()
    return () => { supabase.removeChannel(sub1); supabase.removeChannel(sub2) }
  }, [])

  async function fetchData() {
    // 抓行程
    const { data: plansData } = await supabase.from('plans').select('*').order('time', { ascending: true })
    if (plansData) {
      setPlans(plansData)
      const maxDay = Math.max(...plansData.map(p => p.day || 1))
      if (maxDay > totalDays) setTotalDays(maxDay)
    }
    // 抓預算 (這裡加入防呆，如果資料庫還是空的也不會報錯)
    const { data: budgetData } = await supabase.from('budget').select('*').order('created_at', { ascending: true })
    if (budgetData) setBudgetItems(budgetData)
  }

  // --- 行程功能 ---
  async function addPlan() {
    if (!planInput) return
    await supabase.from('plans').insert([{ content: planInput, day: currentDay, time: timeInput }])
    setPlanInput('')
    fetchData() // ⚡️ 強制刷新
  }

  async function deletePlan(id) {
    if (confirm('確定刪除此行程？')) {
      await supabase.from('plans').delete().eq('id', id)
      fetchData() // ⚡️ 強制刷新
    }
  }

  // --- 預算功能 ---
  async function addBudget() {
    if (!budgetItem || !budgetAmount) return
    await supabase.from('budget').insert([{ item: budgetItem, amount: Number(budgetAmount), payer: budgetPayer, unpaid_users: budgetUnpaid }])
    // 清空輸入框
    setBudgetItem(''); setBudgetAmount(''); setBudgetPayer(''); setBudgetUnpaid('')
    fetchData() // ⚡️ 強制刷新 (解決您說的無法及時更新問題)
  }

  async function deleteBudget(id) {
    if (confirm('確定刪除此帳目？')) {
      await supabase.from('budget').delete().eq('id', id)
      fetchData() // ⚡️ 強制刷新
    }
  }

  // 計算總預算
  const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  return (
    // 修正1: 外層改用 width: 100% 和 minHeight: 100vh，確保填滿手機畫面
    <div style={{ width: '100%', minHeight: '100vh', background: theme.white, fontFamily: '-apple-system, sans-serif' }}>
      
      {/* 限制內容最大寬度 (讓電腦版看起來不會太寬，但手機版會全滿) */}
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px', position: 'relative', minHeight: '100vh' }}>
        
        {/* Header 區域 */}
        <div style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, #3B82F6 100%)`, padding: '40px 20px 60px', color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>✈️ BKK 曼谷行</h1>
          <p style={{ margin: '5px 0 0', opacity: 0.9 }}>2026.04.29 - 05.03</p>
        </div>

        {/* 主要內容區塊 (往上浮動) */}
        <div style={{ marginTop: '-40px', padding: '0 20px' }}>
          
          {/* 分頁切換 Tabs */}
          <div style={{ background: 'white', padding: '5px', borderRadius: '16px', boxShadow: theme.shadow, display: 'flex', marginBottom: '20px' }}>
            {['schedule', 'budget'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: activeTab === tab ? theme.primary : 'transparent',
                  color: activeTab === tab ? 'white' : '#6B7280',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                {tab === 'schedule' ? '🗓 行程表' : '💰 預算表'}
              </button>
            ))}
          </div>

          {/* --- 行程表內容 --- */}
          {activeTab === 'schedule' && (
            <>
              {/* 天數選擇器 (修正2: 增加刪除天數按鈕) */}
              <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '10px', marginBottom: '10px' }}>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    onClick={() => setCurrentDay(day)}
                    style={{
                      border: 'none',
                      background: currentDay === day ? theme.primary : '#E5E7EB',
                      color: currentDay === day ? 'white' : '#4B5563',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      marginRight: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: currentDay === day ? '0 4px 6px rgba(14, 165, 233, 0.3)' : 'none'
                    }}
                  >
                    Day {day}
                  </button>
                ))}
                
                {/* 增加天數 (+) */}
                <button 
                  onClick={() => setTotalDays(totalDays + 1)} 
                  style={{ border: '1px solid #ddd', background: 'white', color: theme.primary, width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', marginRight: '5px', fontSize: '18px' }}
                >
                  +
                </button>
                
                {/* 減少天數 (-) */}
