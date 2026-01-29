import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// ⚠️⚠️⚠️ 請將下方這兩行，換回您剛剛備份的網址與 Key ⚠️⚠️⚠️
const supabaseUrl = 'https://wqwazukgsahnbmrjfihj.supabase.co'
const supabaseKey = 'sb_publishable_EHxsxvA9fn8Gq8LMMndhQw_68lr1qXv'

const supabase = createClient(supabaseUrl, supabaseKey)

// --- 靜態資料 ---
const thaiPhrases = [
  { text: '你好', thai: 'Sawasdee Krub', speak: 'Sawasdee Krub', icon: '🙏' },
  { text: '謝謝', thai: 'Khop Khun Krub', speak: 'Khop Khun Krub', icon: '😊' },
  { text: '多少錢?', thai: 'Tao Rai?', speak: 'Tao Rai', icon: '💰' },
  { text: '太貴了', thai: 'Paeng Mak', speak: 'Paeng Mak', icon: '💸' },
  { text: '不要香菜', thai: 'Mai Sai Pak Chi', speak: 'Mai Sai Pak Chi', icon: '🌿' },
  { text: '不辣', thai: 'Mai Phet', speak: 'Mai Phet', icon: '🌶️' },
  { text: '廁所在哪?', thai: 'Hong Nam Yu Nai?', speak: 'Hong Nam Yu Nai', icon: '🚽' },
  { text: '請開跳錶', thai: 'Meter Plz', speak: 'Meter Please', icon: '🚖' },
]

const emergencyContacts = [
  { name: '觀光警察 (英文可)', phone: '1155', icon: '👮', desc: '遇到詐騙、糾紛時撥打' },
  { name: '旅遊服務中心', phone: '1672', icon: 'ℹ️', desc: '一般旅遊諮詢' },
  { name: '急救/救護車', phone: '1669', icon: '🚑', desc: '發生意外受傷時' },
  { name: '台灣駐泰辦事處', phone: '081-666-4006', icon: '🇹🇼', desc: '護照遺失、急難救助' }, 
]

// 產生時間選項
const timeOptions = []
for (let i = 0; i < 24; i++) {
  const hour = i.toString().padStart(2, '0')
  timeOptions.push(`${hour}:00`)
  timeOptions.push(`${hour}:30`)
}

// --- 樣式設定 ---
const theme = {
  primary: '#0EA5E9', // 天空藍
  white: '#FFFFFF',
  danger: '#EF4444',  // 紅色
  success: '#10B981', // 綠色
  text: '#000000',    // 🔥 強制純黑
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  radius: '12px'
}

function App() {
  const [activeTab, setActiveTab] = useState('schedule')
  const [currentDay, setCurrentDay] = useState(1)
  const [totalDays, setTotalDays] = useState(3)
  
  // 資料狀態
  const [plans, setPlans] = useState([])
  const [budgetItems, setBudgetItems] = useState([])
  const [flights, setFlights] = useState([])
  const [accommodations, setAccommodations] = useState([])
  const [members, setMembers] = useState([])
  const [todos, setTodos] = useState([])
  
  // 翻卡狀態
  const [flippedId, setFlippedId] = useState(null)
  const [editDesc, setEditDesc] = useState('')
  const [editUrl, setEditUrl] = useState('')

  // 輸入框狀態
  const [planInput, setPlanInput] = useState('')
  const [timeInput, setTimeInput] = useState('09:00')
  
  // 預算輸入
  const [budgetItem, setBudgetItem] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetPayer, setBudgetPayer] = useState('')
  const [budgetInvolved, setBudgetInvolved] = useState([])
  const [newMemberName, setNewMemberName] = useState('')

  // 航班/住宿/清單 輸入框
  const [flightDate, setFlightDate] = useState('')
  const [flightTime, setFlightTime] = useState('')
  const [flightAirline, setFlightAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [hotelName, setHotelName] = useState('')
  const [hotelAddress, setHotelAddress] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [todoInput, setTodoInput] = useState('')

  // 匯率計算機
  const [thbInput, setThbInput] = useState('')

  useEffect(() => {
    fetchData()
    const subs = [
      supabase.channel('plans').on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => fetchData()).subscribe(),
      supabase.channel('budget').on('postgres_changes', { event: '*', schema: 'public', table: 'budget' }, () => fetchData()).subscribe(),
      supabase.channel('flights').on('postgres_changes', { event: '*', schema: 'public', table: 'flights' }, () => fetchData()).subscribe(),
      supabase.channel('acco').on('postgres_changes', { event: '*', schema: 'public', table: 'accommodations' }, () => fetchData()).subscribe(),
      supabase.channel('members').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => fetchData()).subscribe(),
      supabase.channel('todos').on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => fetchData()).subscribe()
    ]
    return () => subs.forEach(sub => supabase.removeChannel(sub))
  }, [])

  async function fetchData() {
    const { data: p } = await supabase.from('plans').select('*').order('time', { ascending: true })
    if (p) { setPlans(p); const maxDay = Math.max(...p.map(x => x.day || 1)); if (maxDay > totalDays) setTotalDays(maxDay) }
    const { data: b } = await supabase.from('budget').select('*').order('created_at', { ascending: true })
    if (b) setBudgetItems(b)
    const { data: f } = await supabase.from('flights').select('*').order('created_at', { ascending: true })
    if (f) setFlights(f)
    const { data: a } = await supabase.from('accommodations').select('*').order('created_at', { ascending: true })
    if (a) setAccommodations(a)
    const { data: m } = await supabase.from('members').select('*').order('created_at', { ascending: true })
    if (m) { setMembers(m); if (m.length > 0 && !budgetPayer) setBudgetPayer(m[0].name) }
    const { data: t } = await supabase.from('todos').select('*').order('id', { ascending: true })
    if (t) setTodos(t)
  }

  async function deleteItem(table, id) {
    if (confirm('確定要刪除嗎？')) { await supabase.from(table).delete().eq('id', id); fetchData() }
  }

  function getDaysUntilTrip() {
    const today = new Date()
    const tripDate = new Date('2026-04-29')
    const diffTime = tripDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'th-TH' 
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  function copyScheduleToClipboard() {
    const todaysPlans = plans.filter(p => (p.day || 1) === currentDay)
    if (todaysPlans.length === 0) { alert('今天沒有行程可以複製'); return }
    
    let text = `📅 Day ${currentDay} 曼谷行程：\n`
    todaysPlans.forEach(p => {
      text += `${p.time} ${p.content}\n`
    })
    text += '\n(來自 BKK Travel App)'
    
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ 行程已複製！可以貼到 Line 群組囉')
    }).catch(err => {
      console.error('複製失敗', err)
    })
  }

  async function addMember() { if (!newMemberName) return; const { error } = await supabase.from('members').insert([{ name: newMemberName }]); if (error) alert('新增失敗'); else { setNewMemberName(''); fetchData() } }
  async function addBudget() { if (!budgetItem || !budgetAmount || !budgetPayer) return; const finalInvolved = budgetInvolved.length > 0 ? budgetInvolved : members.map(m => m.name); await supabase.from('budget').insert([{ item: budgetItem, amount: Number(budgetAmount), payer: budgetPayer, unpaid_users: finalInvolved.join(',') }]); setBudgetItem(''); setBudgetAmount(''); setBudgetInvolved([]); fetchData() }
  function toggleInvolved(name) { if (budgetInvolved.includes(name)) setBudgetInvolved(budgetInvolved.filter(n => n !== name)); else setBudgetInvolved([...budgetInvolved, name]) }
  function calculateSettlement() { const balances = {}; members.forEach(m => balances[m.name] = 0); budgetItems.forEach(item => { const payer = item.payer; const amount = Number(item.amount); let involved = []; if (item.unpaid_users) { try { involved = JSON.parse(item.unpaid_users) } catch { involved = item.unpaid_users.split(',') } if (involved.length === 1 && involved[0] === '') involved = members.map(m => m.name) } else { involved = members.map(m => m.name) } const validInvolved = involved.filter(name => members.find(m => m.name === name)); if (validInvolved.length === 0) return; const splitAmount = amount / validInvolved.length; if (balances[payer] !== undefined) balances[payer] += amount; validInvolved.forEach(name => { if (balances[name] !== undefined) balances[name] -= splitAmount }) }); const debtors = []; const creditors = []; Object.keys(balances).forEach(name => { const val = balances[name]; if (val < -0.1) debtors.push({ name, amount: val }); if (val > 0.1) creditors.push({ name, amount: val }) }); debtors.sort((a, b) => a.amount - b.amount); creditors.sort((a, b) => b.amount - a.amount); const transactions = []; let i = 0, j = 0; while (i < debtors.length && j < creditors.length) { const debtor = debtors[i]; const creditor = creditors[j]; const amount = Math.min(Math.abs(debtor.amount), creditor.amount); transactions.push(`${debtor.name} ➜ ${creditor.name}: $${Math.round(amount)}`); debtor.amount += amount; creditor.amount -= amount; if (Math.abs(debtor.amount) < 0.1) i++; if (creditor.amount < 0.1) j++ } return transactions }
  async function addPlan() { if (!planInput) return; await supabase.from('plans').insert([{ content: planInput, day: currentDay, time: timeInput }]); setPlanInput(''); fetchData() }
  async function addFlight() { await supabase.from('flights').insert([{ date: flightDate, time: flightTime, airline: flightAirline, flight_number: flightNumber }]); setFlightDate(''); setFlightTime(''); setFlightAirline(''); setFlightNumber(''); fetchData() }
  async function addAccommodation() { await supabase.from('accommodations').insert([{ name: hotelName, address: hotelAddress, check_in: checkIn, check_out: checkOut }]); setHotelName(''); setHotelAddress(''); setCheckIn(''); setCheckOut(''); fetchData() }
  function handleFlip(plan) { if (flippedId === plan.id) setFlippedId(null); else { setFlippedId(plan.id); setEditDesc(plan.description || ''); setEditUrl(plan.url || '') } }
  async function savePlanDetail(id) { await supabase.from('plans').update({ description: editDesc, url: editUrl }).eq('id', id); setFlippedId(null); fetchData() }
  function openGoogleMapRoute() { const todaysPlans = plans.filter(p => (p.day || 1) === currentDay); if (todaysPlans.length === 0) { alert('無行程'); return } const destinations = todaysPlans.map(p => p.content.trim()).join('/'); window.open(`https://www.google.com/maps/dir/${destinations}`, '_blank') }
  
  async function addTodo() { if (!todoInput) return; await supabase.from('todos').insert([{ task: todoInput }]); setTodoInput(''); fetchData() }
  async function toggleTodo(id, currentStatus) { await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id); fetchData() }

  const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const transactions = calculateSettlement()
  const daysUntil = getDaysUntilTrip()

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '16px', color: '#000000', WebkitTextFillColor: '#000000', opacity: 1, marginBottom: '10px' }
  const tabStyle = (isActive) => ({ flex: '0 0 auto', padding: '10px 20px', borderRadius: '20px', border: 'none', background: isActive ? theme.primary : '#F3F4F6', color: isActive ? 'white' : '#6B7280', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginRight: '8px' })
  const cardFaceStyle = { width: '100%', backfaceVisibility: 'hidden', borderRadius: theme.radius, boxSizing: 'border-box', border: '1px solid #eee' }

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#ffffff', fontFamily: '-apple-system, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', minHeight: '100vh', background: '#ffffff' }}>
        
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, #3B82F6 100%)`, padding: '40px 20px 60px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>✈️ BKK 曼谷行</h1>
            <p style={{ margin: '5px 0 0', opacity: 0.9 }}>2026.04.29 - 05.03</p>
            <div style={{ marginTop: '15px', display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              ⏳ 距離出發還有 {daysUntil} 天
            </div>
          </div>
          <div style={{ position: 'absolute', top: -20, right: -20, width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        </div>

        <div style={{ marginTop: '-40px', padding: '0 20px' }}>
          {/* 🔥 分頁選單 (新增了 🆘 急救 按鈕) */}
          <div style={{ background: 'white', padding: '10px', borderRadius: '16px', boxShadow: theme.shadow, marginBottom: '20px', display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
            <button onClick={() => setActiveTab('schedule')} style={tabStyle(activeTab === 'schedule')}>🗓 行程</button>
            <button onClick={() => setActiveTab('budget')} style={tabStyle(activeTab === 'budget')}>💰 分帳</button>
            <button onClick={() => setActiveTab('todos')} style={tabStyle(activeTab === 'todos')}>✅ 準備</button>
            <button onClick={() => setActiveTab('emergency')} style={{ ...tabStyle(activeTab === 'emergency'), color: activeTab === 'emergency' ? 'white' : theme.danger, background: activeTab === 'emergency' ? theme.danger : '#FEF2F2' }}>🆘 急救</button>
            <button onClick={() => setActiveTab('flights')} style={tabStyle(activeTab === 'flights')}>🛫 航班</button>
            <button onClick={() => setActiveTab('accommodations')} style={tabStyle(activeTab === 'accommodations')}>🏨 住宿</button>
          </div>

          {/* --- 🆘 緊急聯絡 (獨立分頁) --- */}
          {activeTab === 'emergency' && (
            <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: '#FEF2F2', padding: '25px', borderRadius: theme.radius, border: `1px solid ${theme.danger}`, textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>🆘</div>
                <h2 style={{ margin: 0, color: '#991B1B' }}>緊急救援中心</h2>
                <p style={{ margin: '10px 0 0', color: '#B91C1C', fontSize: '14px' }}>遇到危急情況請保持冷靜，點擊按鈕即可撥打。</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {emergencyContacts.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '30px', marginRight: '15px' }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#111' }}>{c.name}</div>
                      <div style={{ fontSize: '16px', color: theme.danger, fontWeight: 'bold' }}>{c.phone}</div>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{c.desc}</div>
                    </div>
                    <a 
                      href={`tel:${c.phone}`} 
                      style={{ 
                        padding: '12px 20px', background: theme.danger, color: 'white', 
                        borderRadius: '10px', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      撥打
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- ✅ 準備 (移除聯絡人，保留清單與泰語卡) --- */}
          {activeTab === 'todos' && (
            <div style={{ paddingBottom: '40px' }}>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>🇹🇭 泰語救命小卡 (點擊發音)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {thaiPhrases.map((p, idx) => (
                    <button key={idx} onClick={() => speak(p.speak)} style={{ padding: '15px 10px', borderRadius: '12px', border: `1px solid #E5E7EB`, background: '#F9FAFB', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '24px' }}>{p.icon}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#111' }}>{p.text}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>{p.thai}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#F0FDF4', padding: '20px', borderRadius: theme.radius, marginBottom: '20px', border: `1px solid ${theme.success}` }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#166534' }}>💱 匯率換算 (約 1.02)</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="number" placeholder="泰銖 THB" value={thbInput} onChange={e => setThbInput(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                  <span style={{ fontSize: '20px', color: '#000000' }}>≈</span>
                  <div style={{ flex: 1, fontWeight: 'bold', fontSize: '20px', color: '#166534' }}>{thbInput ? Math.round(thbInput * 1.02 * 10) / 10 : 0} TWD</div>
                </div>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>📝 行前檢查清單</h4>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}><input value={todoInput} onChange={e => setTodoInput(e.target.value)} placeholder="還需要帶什麼？" style={{ ...inputStyle, marginBottom: 0 }} /><button onClick={addTodo} style={{ background: theme.primary, color: 'white', border: 'none', padding: '0 15px', borderRadius: '12px', fontWeight: 'bold' }}>新增</button></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {todos.map(todo => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', background: todo.is_completed ? '#F3F4F6' : 'white', borderRadius: '8px', border: '1px solid #eee', opacity: todo.is_completed ? 0.6 : 1 }}>
                      <input type="checkbox" checked={todo.is_completed} onChange={() => toggleTodo(todo.id, todo.is_completed)} style={{ width: '20px', height: '20px', marginRight: '10px', cursor: 'pointer' }} />
                      <span style={{ flex: 1, textDecoration: todo.is_completed ? 'line-through' : 'none', fontSize: '16px', color: '#000000' }}>{todo.task}</span>
                      <button onClick={() => deleteItem('todos', todo.id)} style={{ border: 'none', background: 'transparent', color: '#ccc', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                  {todos.length === 0 && <div style={{ textAlign: 'center', color: '#999' }}>清單是空的 🎉</div>}
                </div>
              </div>
            </div>
          )}

          {/* --- 行程表 --- */}
          {activeTab === 'schedule' && (
            <div style={{ paddingBottom: '120px' }}>
              <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
                  <button key={day} onClick={() => setCurrentDay(day)} style={{ border: 'none', background: currentDay === day ? theme.primary : '#E5E7EB', color: currentDay === day ? 'white' : '#4B5563', padding: '8px 18px', borderRadius: '20px', marginRight: '8px', fontWeight: 'bold', flexShrink: 0 }}>Day {day}</button>
                ))}
                <button onClick={() => setTotalDays(totalDays + 1)} style={{ border: '1px solid #ddd', background: 'white', color: theme.primary, width: '35px', height: '35px', borderRadius: '50%', flexShrink: 0 }}>+</button>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button onClick={openGoogleMapRoute} style={{ flex: 2, padding: '12px', background: '#E0F2FE', color: '#0284C7', border: '1px dashed #0284C7', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🗺️ 自動規劃路線</button>
                <button onClick={copyScheduleToClipboard} style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#333', border: '1px solid #ddd', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>📋 複製</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {plans.filter(p => (p.day || 1) === currentDay).map(plan => {
                  const isFlipped = flippedId === plan.id;
                  return (
                    <div key={plan.id} style={{ perspective: '1000px', cursor: 'pointer' }} onClick={() => handleFlip(plan)}>
                      <div style={{ position: 'relative', transition: 'transform 0.6s', transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                        <div style={{ ...cardFaceStyle, position: isFlipped ? 'absolute' : 'relative', top: 0, left: 0, background: 'white', padding: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', borderLeft: `4px solid ${theme.primary}` }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16px', minWidth: '45px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: theme.primary }}>{plan.time.split(':')[0]}</span>
                            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{plan.time.split(':')[1]}</span>
                          </div>
                          <div style={{ flex: 1, color: '#000000', fontSize: '16px', fontWeight: '500' }}>{plan.content}{(plan.url || plan.description) && <span style={{ marginLeft: '5px', fontSize: '12px' }}>📝</span>}</div>
                          <button onClick={(e) => { e.stopPropagation(); deleteItem('plans', plan.id) }} style={{ border: 'none', background: '#FEF2F2', color: theme.danger, width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                        <div onClick={e => e.stopPropagation()} style={{ ...cardFaceStyle, position: isFlipped ? 'relative' : 'absolute', top: 0, left: 0, transform: 'rotateY(180deg)', background: '#F0F9FF', padding: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: `2px solid ${theme.primary}` }}>
                          <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: theme.primary }}>✏️ 編輯詳細資料</div>
                          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="輸入筆記..." style={{ ...inputStyle, height: '70px', resize: 'none' }} />
                          <input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="相關網址..." style={inputStyle} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => savePlanDetail(plan.id)} style={{ flex: 1, padding: '10px', background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>儲存</button>
                            {editUrl && <button onClick={() => window.open(editUrl, '_blank')} style={{ flex: 1, padding: '10px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>前往</button>}
                            <button onClick={() => setFlippedId(null)} style={{ padding: '10px 15px', background: '#ddd', color: '#666', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>↩</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '15px 20px 25px', boxShadow: '0 -4px 15px rgba(0,0,0,0.08)', display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto', zIndex: 10, boxSizing: 'border-box' }}>
                <select value={timeInput} onChange={e => setTimeInput(e.target.value)} style={{ ...inputStyle, width: '90px', marginBottom: 0 }}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <input value={planInput} onChange={e => setPlanInput(e.target.value)} placeholder="輸入地點..." style={{ ...inputStyle, marginBottom: 0 }} />
                <button onClick={addPlan} style={{ background: theme.primary, color: 'white', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', flexShrink: 0 }}>新增</button>
              </div>
            </div>
          )}
          {activeTab === 'budget' && (
             <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: '#F0F9FF', padding: '15px', borderRadius: theme.radius, marginBottom: '20px', border: `1px solid ${theme.primary}` }}>
                 <div style={{ fontSize: '14px', fontWeight: 'bold', color: theme.primary, marginBottom: '10px' }}>👥 旅遊成員</div>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                   {members.map(m => ( <span key={m.id} style={{ background: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '14px', color: '#111', border: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>{m.name}<span onClick={() => deleteItem('members', m.id)} style={{ marginLeft: '5px', color: '#999', cursor: 'pointer', fontWeight: 'bold' }}>×</span></span> ))}
                 </div>
                 <div style={{ display: 'flex', gap: '5px' }}><input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="輸入名字" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} /><button onClick={addMember} style={{ background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', padding: '0 15px', fontWeight: 'bold' }}>新增</button></div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', textAlign: 'center', marginBottom: '20px' }}><div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '5px' }}>目前總支出</div><div style={{ fontSize: '40px', fontWeight: '800', color: theme.success }}>${totalBudget.toLocaleString()}</div></div>
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>📝 新增消費</h4>
                <input placeholder="項目" value={budgetItem} onChange={e => setBudgetItem(e.target.value)} style={inputStyle} /><input type="number" placeholder="金額" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} style={inputStyle} />
                <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '14px', color: '#666' }}>誰先付錢？</label><select value={budgetPayer} onChange={e => setBudgetPayer(e.target.value)} style={inputStyle}>{members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select></div>
                <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '14px', color: '#666' }}>誰要分擔？</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{members.map(m => (<button key={m.id} onClick={() => toggleInvolved(m.name)} style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid', fontSize: '14px', cursor: 'pointer', background: budgetInvolved.includes(m.name) ? theme.primary : 'white', color: budgetInvolved.includes(m.name) ? 'white' : '#666', borderColor: budgetInvolved.includes(m.name) ? theme.primary : '#ddd' }}>{m.name}</button>))}</div></div>
                <button onClick={addBudget} style={{ width: '100%', background: theme.success, color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>＋ 新增帳目</button>
              </div>
              <div style={{ marginBottom: '30px' }}>{budgetItems.map(item => (<div key={item.id} style={{ background: 'white', padding: '15px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #F3F4F6', marginBottom: '10px' }}><div style={{ flex: 1 }}><div style={{ fontWeight: 'bold', fontSize: '16px', color: '#000000' }}>{item.item}</div><div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}><span style={{ color: theme.primary, fontWeight: 'bold' }}>{item.payer}</span> 先付 <span style={{ marginLeft: '5px', color: '#999' }}>(分擔: {item.unpaid_users})</span></div></div><div style={{ fontWeight: 'bold', fontSize: '18px', color: theme.success, marginRight: '15px' }}>${item.amount}</div><button onClick={() => deleteItem('budget', item.id)} style={{ border: 'none', background: 'transparent', color: '#9CA3AF', padding: '5px' }}>✕</button></div>))}</div>
              <div style={{ background: '#111', padding: '25px', borderRadius: theme.radius, color: 'white', marginBottom: '50px' }}><h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>📊 結算中心</h3>{transactions.length > 0 ? (<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{transactions.map((t, idx) => (<div key={idx} style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '10px', color: theme.success }}>💸</span> {t}</div>))}<div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>* 系統已自動計算最佳轉帳路徑</div></div>) : (<div style={{ color: '#666' }}>目前沒有債務需要結清 👍</div>)}</div>
            </div>
          )}
          {activeTab === 'flights' && (
             <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>🛫 新增航班</h4>
                <div style={{ display: 'flex', gap: '10px' }}><input placeholder="日期" value={flightDate} onChange={e => setFlightDate(e.target.value)} style={inputStyle} /><input placeholder="時間" value={flightTime} onChange={e => setFlightTime(e.target.value)} style={inputStyle} /></div>
                <input placeholder="航空公司" value={flightAirline} onChange={e => setFlightAirline(e.target.value)} style={inputStyle} /><input placeholder="航班代號" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} style={inputStyle} />
                <button onClick={addFlight} style={{ width: '100%', marginTop: '10px', background: theme.primary, color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold' }}>＋ 新增航班</button>
              </div>
              {flights.map(item => (<div key={item.id} style={{ background: 'white', padding: '16px', borderRadius: theme.radius, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid ${theme.primary}`, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}><div><div style={{ fontSize: '14px', color: '#6B7280' }}>{item.date} {item.time}</div><div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000000' }}>{item.airline}</div><div style={{ color: theme.primary }}>{item.flight_number}</div></div><button onClick={() => deleteItem('flights', item.id)} style={{ border: 'none', background: '#FEF2F2', color: theme.danger, borderRadius: '8px', padding: '5px 10px' }}>刪除</button></div>))}
            </div>
          )}
          {activeTab === 'accommodations' && (
             <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>🏨 新增住宿</h4>
                <input placeholder="飯店名稱" value={hotelName} onChange={e => setHotelName(e.target.value)} style={inputStyle} /><input placeholder="地址" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} style={inputStyle} />
                <div style={{ display: 'flex', gap: '10px' }}><input placeholder="入住" value={checkIn} onChange={e => setCheckIn(e.target.value)} style={inputStyle} /><input placeholder="退房" value={checkOut} onChange={e => setCheckOut(e.target.value)} style={inputStyle} /></div>
                <button onClick={addAccommodation} style={{ width: '100%', marginTop: '10px', background: '#F59E0B', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold' }}>＋ 新增住宿</button>
              </div>
              {accommodations.map(item => (<div key={item.id} style={{ background: 'white', padding: '16px', borderRadius: theme.radius, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid #F59E0B`, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}><div><div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000000' }}>{item.name}</div><div style={{ fontSize: '14px', color: '#6B7280' }}>{item.address}</div><div style={{ fontSize: '14px', color: '#B45309' }}>📅 {item.check_in} - {item.check_out}</div></div><button onClick={() => deleteItem('accommodations', item.id)} style={{ border: 'none', background: '#FEF2F2', color: theme.danger, borderRadius: '8px', padding: '5px 10px' }}>刪除</button></div>))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App
