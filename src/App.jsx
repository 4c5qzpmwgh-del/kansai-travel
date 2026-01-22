import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// ⚠️⚠️⚠️ 請將下方這兩行，換回您剛剛備份的網址與 Key ⚠️⚠️⚠️
const supabaseUrl = 'https://wqwazukgsahnbmrjfihj.supabase.co'
const supabaseKey = 'sb_publishable_EHxsxvA9fn8Gq8LMMndhQw_68lr1qXv'

const supabase = createClient(supabaseUrl, supabaseKey)

// 產生 00:00 ~ 23:30 的時間選單
const timeOptions = []
for (let i = 0; i < 24; i++) {
  const hour = i.toString().padStart(2, '0')
  timeOptions.push(`${hour}:00`)
  timeOptions.push(`${hour}:30`)
}

function App() {
  // 頁面狀態
  const [activeTab, setActiveTab] = useState('schedule') // 'schedule' (行程) 或 'budget' (預算)
  const [currentDay, setCurrentDay] = useState(1) // 目前在第幾天
  const [totalDays, setTotalDays] = useState(3) // 總天數預設 3 天

  // 資料狀態
  const [plans, setPlans] = useState([])
  const [budgetItems, setBudgetItems] = useState([])

  // 輸入框狀態
  const [planInput, setPlanInput] = useState('')
  const [timeInput, setTimeInput] = useState('09:00')
  
  const [budgetItem, setBudgetItem] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetPayer, setBudgetPayer] = useState('')
  const [budgetUnpaid, setBudgetUnpaid] = useState('')

  useEffect(() => {
    fetchData()

    // 監聽行程表變化
    const sub1 = supabase.channel('plans-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => fetchData())
      .subscribe()
      
    // 監聽預算表變化
    const sub2 = supabase.channel('budget-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget' }, () => fetchData())
      .subscribe()

    return () => { supabase.removeChannel(sub1); supabase.removeChannel(sub2) }
  }, [])

  // 讀取所有資料
  async function fetchData() {
    // 抓行程
    const { data: plansData } = await supabase.from('plans').select('*').order('time', { ascending: true })
    if (plansData) {
      setPlans(plansData)
      // 自動更新總天數
      const maxDay = Math.max(...plansData.map(p => p.day || 1))
      if (maxDay > totalDays) setTotalDays(maxDay)
    }

    // 抓預算
    const { data: budgetData } = await supabase.from('budget').select('*').order('created_at', { ascending: true })
    if (budgetData) setBudgetItems(budgetData)
  }

  // --- 行程相關功能 ---
  async function addPlan() {
    if (!planInput) return
    await supabase.from('plans').insert([{ 
      content: planInput, 
      day: currentDay, 
      time: timeInput 
    }])
    setPlanInput('')
  }

  async function deletePlan(id) {
    if (confirm('確定要刪除這個行程嗎？')) {
      await supabase.from('plans').delete().eq('id', id)
    }
  }

  // --- 預算相關功能 ---
  async function addBudget() {
    if (!budgetItem || !budgetAmount) return
    await supabase.from('budget').insert([{ 
      item: budgetItem, 
      amount: Number(budgetAmount), 
      payer: budgetPayer,
      unpaid_users: budgetUnpaid
    }])
    setBudgetItem(''); setBudgetAmount(''); setBudgetPayer(''); setBudgetUnpaid('')
  }

  async function deleteBudget(id) {
    if (confirm('確定要刪除這筆帳目嗎？')) {
      await supabase.from('budget').delete().eq('id', id)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
      
      {/* 大標題與主分頁切換 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>✈️ 旅遊行程 & 記帳</h1>
        <div>
          <button 
            onClick={() => setActiveTab('schedule')}
            style={{ padding: '10px 20px', background: activeTab === 'schedule' ? '#007bff' : '#eee', color: activeTab === 'schedule' ? '#fff' : '#333', border: 'none', borderRadius: '5px 0 0 5px', cursor: 'pointer' }}
          >
            🗓 行程
          </button>
          <button 
            onClick={() => setActiveTab('budget')}
            style={{ padding: '10px 20px', background: activeTab === 'budget' ? '#007bff' : '#eee', color: activeTab === 'budget' ? '#fff' : '#333', border: 'none', borderRadius: '0 5px 5px 0', cursor: 'pointer' }}
          >
            💰 預算
          </button>
        </div>
      </div>

      {/* ------------ 介面 A: 行程表 ------------ */}
      {activeTab === 'schedule' && (
        <div>
          {/* 天數分頁 (Tabs) */}
          <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
            {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => setCurrentDay(day)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid #ddd',
                  background: currentDay === day ? '#FF9800' : '#fff',
                  color: currentDay === day ? '#fff' : '#555',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}
              >
                Day {day}
              </button>
            ))}
            <button onClick={() => setTotalDays(totalDays + 1)} style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', background: '#eee', cursor: 'pointer', flexShrink: 0 }}>➕</button>
          </div>

          <h3 style={{ borderBottom: '2px solid #FF9800', paddingBottom: '10px', marginTop: 0 }}>
            Day {currentDay} 行程
          </h3>

          {/* 新增行程輸入區 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f5f5f5', padding: '15px', borderRadius: '10px' }}>
            <select 
              value={timeInput} 
              onChange={e => setTimeInput(e.target.value)}
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input 
              value={planInput} 
              onChange={e => setPlanInput(e.target.value)} 
              placeholder="輸入行程..."
              style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <button onClick={addPlan} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>新增</button>
          </div>

          {/* 行程列表 */}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {plans.filter(p => (p.day || 1) === currentDay).map(plan => (
              <li key={plan.id} style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', background: '#fff' }}>
                <span style={{ fontWeight: 'bold', color: '#007bff', marginRight: '15px', minWidth: '50px' }}>
                  {plan.time || '全天'}
                </span>
                <span style={{ flex: 1, fontSize: '16px' }}>{plan.content}</span>
                <button 
                  onClick={() => deletePlan(plan.id)}
                  style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                >
                  刪除
                </button>
              </li>
            ))}
            {plans.filter(p => (p.day || 1) === currentDay).length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>本日還沒有行程喔</div>
            )}
          </ul>
        </div>
      )}

      {/* ------------ 介面 B: 預算表 ------------ */}
      {activeTab === 'budget' && (
        <div>
          <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px', marginTop: 0 }}>
            💰 預算與支出
          </h3>

          {/* 新增預算輸入區 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px', background: '#f5f5f5', padding: '15px', borderRadius: '10px' }}>
            <input placeholder="項目 (如: 晚餐)" value={budgetItem} onChange={e => setBudgetItem(e.target.value)} style={{ padding: '8px' }} />
            <input type="number" placeholder="金額" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} style={{ padding: '8px' }} />
            <input placeholder="付款人" value={budgetPayer} onChange={e => setBudgetPayer(e.target.value)} style={{ padding: '8px' }} />
            <input placeholder="尚未付款人員" value={budgetUnpaid} onChange={e => setBudgetUnpaid(e.target.value)} style={{ padding: '8px' }} />
            <button onClick={addBudget} style={{ gridColumn: 'span 2', background: '#28a745', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>新增帳目</button>
          </div>

          {/* 預算表格 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#eee', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>項目</th>
                <th style={{ padding: '10px' }}>金額</th>
                <th style={{ padding: '10px' }}>付款人</th>
                <th style={{ padding: '10px' }}>欠款</th>
                <th style={{ padding: '10px' }}></th>
              </tr>
            </thead>
            <tbody>
              {budgetItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{item.item}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#d32f2f' }}>${item.amount}</td>
                  <td style={{ padding: '10px' }}>{item.payer}</td>
                  <td style={{ padding: '10px', color: '#666' }}>{item.unpaid_users}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => deleteBudget(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

export default App
