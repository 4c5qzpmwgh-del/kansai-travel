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
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  radius: '16px'
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
    const sub1 = supabase.channel('plans-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => fetchData()).subscribe()
    const sub2 = supabase.channel('budget-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'budget' }, () => fetchData()).subscribe()
    return () => { supabase.removeChannel(sub1); supabase.removeChannel(sub2) }
  }, [])

  async function fetchData() {
    const { data: plansData } = await supabase.from('plans').select('*').order('time', { ascending: true })
    if (plansData) {
      setPlans(plansData)
      const maxDay = Math.max(...plansData.map(p => p.day || 1))
      if (maxDay > totalDays) setTotalDays(maxDay)
    }
    const { data: budgetData } = await supabase.from('budget').select('*').order('created_at', { ascending: true })
    if (budgetData) setBudgetItems(budgetData)
  }

  async function addPlan() {
    if (!planInput) return
    await supabase.from('plans').insert([{ content: planInput, day: currentDay, time: timeInput }])
    setPlanInput('')
  }

  async function deletePlan(id) {
    if (confirm('確定刪除此行程？')) await supabase.from('plans').delete().eq('id', id)
  }

  async function addBudget() {
    if (!budgetItem || !budgetAmount) return
    await supabase.from('budget').insert([{ item: budgetItem, amount: Number(budgetAmount), payer: budgetPayer, unpaid_users: budgetUnpaid }])
    setBudgetItem(''); setBudgetAmount(''); setBudgetPayer(''); setBudgetUnpaid('')
  }

  async function deleteBudget(id) {
    if (confirm('確定刪除此帳目？')) await supabase.from('budget').delete().eq('id', id)
  }

  // 計算總預算
  const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* 手機模擬容器 */}
      <div style={{ width: '100%', maxWidth: '480px', background: theme.white, minHeight: '100vh', boxShadow: '0 0 20px rgba(0,0,0,0.05)', position: 'relative', paddingBottom: '80px' }}>
        
        {/* Header 區域 */}
        <div style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, #3B82F6 100%)`, padding: '30px 20px 60px', borderRadius: '0 0 24px 24px', color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>✈️ BKK 曼谷行</h1>
          <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '14px' }}>2026.04.29 - 05.03</p>
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
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'schedule' ? '🗓 行程表' : '💰 預算'}
              </button>
            ))}
          </div>

          {/* --- 行程表內容 --- */}
          {activeTab === 'schedule' && (
            <>
              {/* 天數選擇器 */}
              <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '10px', marginBottom: '10px', scrollbarWidth: 'none' }}>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    onClick={() => setCurrentDay(day)}
                    style={{
                      border: 'none',
                      background: currentDay === day ? theme.primary : '#E5E7EB',
                      color: currentDay === day ? 'white' : '#4B5563',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      marginRight: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: currentDay === day ? '0 4px 6px rgba(14, 165, 233, 0.3)' : 'none'
                    }}
                  >
                    Day {day}
                  </button>
                ))}
                <button onClick={() => setTotalDays(totalDays + 1)} style={{ border: '2px dashed #CBD5E1', background: 'transparent', color: '#94A3B8', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>+</button>
              </div>

              {/* 行程列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '100px' }}>
                {plans.filter(p => (p.day || 1) === currentDay).map(plan => (
                  <div key={plan.id} style={{ background: 'white', padding: '16px', borderRadius: theme.radius, boxShadow: theme.shadow, display: 'flex', alignItems: 'center', borderLeft: `4px solid ${theme.primary}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16px', minWidth: '45px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.primary }}>{plan.time.split(':')[0]}</span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{plan.time.split(':')[1]}</span>
                    </div>
                    <div style={{ flex: 1, color: theme.text, fontSize: '16px', fontWeight: '500' }}>{plan.content}</div>
                    <button onClick={() => deletePlan(plan.id)} style={{ border: 'none', background: '#FEE2E2', color: theme.danger, width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                
                {plans.filter(p => (p.day || 1) === currentDay).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>😴</div>
                    這天還沒有行程<br/>點擊下方按鈕新增
                  </div>
                )}
              </div>

              {/* 固定底部的輸入框 */}
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '15px 20px 25px', boxShadow: '0 -4px 10px rgba(0,0,0,0.05)', display: 'flex', gap: '10px', maxWidth: '480px', margin: '0 auto', zIndex: 10 }}>
                <select value={timeInput} onChange={e => setTimeInput(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontWeight: 'bold' }}>
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={planInput} onChange={e => setPlanInput(e.target.value)} placeholder="輸入行程..." style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '16px' }} />
                <button onClick={addPlan} style={{ background: theme.primary, color: 'white', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>新增</button>
              </div>
            </>
          )}

          {/* --- 預算表內容 --- */}
          {activeTab === 'budget' && (
            <>
              {/* 總花費卡片 */}
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>目前總支出</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#059669', margin: '5px 0' }}>${totalBudget.toLocaleString()}</div>
              </div>

              {/* 新增預算表單 */}
              <div style={{ background: 'white', padding: '16px', borderRadius: theme.radius, boxShadow: theme.shadow, marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input placeholder="項目" value={budgetItem} onChange={e => setBudgetItem(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB' }} />
                  <input type="number" placeholder="金額" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB' }} />
                  <input placeholder="誰付錢" value={budgetPayer} onChange={e => setBudgetPayer(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB' }} />
                  <input placeholder="誰欠錢" value={budgetUnpaid} onChange={e => setBudgetUnpaid(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB' }} />
                </div>
                <button onClick={addBudget} style={{ width: '100%', marginTop: '10px', background: '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>＋ 新增一筆帳</button>
              </div>

              {/* 帳目列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {budgetItems.map(item => (
                  <div key={item.id} style={{ background: 'white', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.item}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {item.payer ? `${item.payer} 先付` : ''} 
                        {item.unpaid_users ? ` (欠: ${item.unpaid_users})` : ''}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#059669', marginRight: '10px' }}>${item.amount}</div>
                    <button onClick={() => deleteBudget(item.id)} style={{ border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default App
