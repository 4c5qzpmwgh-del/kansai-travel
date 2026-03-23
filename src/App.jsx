import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// ⚠️⚠️⚠️ 請換成您「全新 Kansai 專案」的網址與 Key ⚠️⚠️⚠️
const supabaseUrl = 'https://jzodbtfwhpxstxkgophz.supabase.co'
const supabaseKey = 'sb_publishable_9vKP8CFIjlf5bX2jbDtKpw_s7V4lACX'

const supabase = createClient(supabaseUrl, supabaseKey)

// --- 日本專屬資料 ---
const japanPhrases = [
  { text: '你好', kana: 'Konnichiwa', speak: 'こんにちは', icon: '🙏' },
  { text: '謝謝', kana: 'Arigatou', speak: 'ありがとうございます', icon: '😊' },
  { text: '多少錢?', kana: 'Ikura desu ka', speak: 'いくらですか', icon: '💰' },
  { text: '太貴了', kana: 'Takai desu', speak: '高いです', icon: '💸' },
  { text: '請給我這個', kana: 'Kore o kudasai', speak: 'これをください', icon: '👈' },
  { text: '結帳', kana: 'Okaikei onegaishimasu', speak: 'お会計お願いします', icon: '🧾' },
  { text: '廁所在哪?', kana: 'Toire wa doko desu ka', speak: 'トイレはどこですか', icon: '🚽' },
  { text: '好吃', kana: 'Oishii', speak: '美味しいです', icon: '🍣' },
]

const emergencyContacts = [
  { name: '報警 (警察局)', phone: '110', icon: '🚓', desc: '遇到犯罪、交通事故或遺失物品' },
  { name: '急救/消防車', phone: '119', icon: '🚑', desc: '突發疾病或火災' },
  { name: '日本旅遊服務中心', phone: '050-3816-2787', icon: 'ℹ️', desc: '提供中英日語言旅遊協助' },
  { name: '台灣駐日代表處(大阪)', phone: '06-6227-8623', icon: '🇹🇼', desc: '護照遺失、急難救助專線' }, 
]

// 🔥 新增「待安排」選項
const timeOptions = ['待安排']
for (let i = 0; i < 24; i++) {
  const hour = i.toString().padStart(2, '0')
  timeOptions.push(`${hour}:00`)
  timeOptions.push(`${hour}:30`)
}

// --- 樣式設定 (櫻花粉與抹茶綠) ---
const theme = {
  primary: '#F43F5E',
  secondary: '#10B981',
  danger: '#E11D48',
  bg: '#FFF1F2',
  text: '#111111',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  radius: '16px'
}

function App() {
  const [activeTab, setActiveTab] = useState('schedule')
  const [currentDay, setCurrentDay] = useState(1)
  const [totalDays, setTotalDays] = useState(5)
  
  const [plans, setPlans] = useState([])
  const [budgetItems, setBudgetItems] = useState([])
  const [flights, setFlights] = useState([])
  const [accommodations, setAccommodations] = useState([])
  const [members, setMembers] = useState([])
  const [todos, setTodos] = useState([])
  
  const [flippedId, setFlippedId] = useState(null)
  const [editDesc, setEditDesc] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editTime, setEditTime] = useState('')

  const [planInput, setPlanInput] = useState('')
  const [timeInput, setTimeInput] = useState('待安排')
  
  const [budgetItem, setBudgetItem] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetPayer, setBudgetPayer] = useState('')
  const [budgetInvolved, setBudgetInvolved] = useState([])
  const [newMemberName, setNewMemberName] = useState('')

  const [flightDate, setFlightDate] = useState('')
  const [flightTime, setFlightTime] = useState('')
  const [flightAirline, setFlightAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [hotelName, setHotelName] = useState('')
  const [hotelAddress, setHotelAddress] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [todoInput, setTodoInput] = useState('')

  const [jpyInput, setJpyInput] = useState('')

  useEffect(() => {
    fetchData()
    const subs = ['plans', 'budget', 'flights', 'accommodations', 'members', 'todos'].map(table => 
      supabase.channel(table).on('postgres_changes', { event: '*', schema: 'public', table: table }, () => fetchData()).subscribe()
    )
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

  async function deleteItem(table, id) { if (confirm('確定要刪除嗎？')) { await supabase.from(table).delete().eq('id', id); fetchData() } }

  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  function copyScheduleToClipboard() {
    const todaysPlans = plans.filter(p => (p.day || 1) === currentDay)
    if (todaysPlans.length === 0) { alert('今天沒有行程可以複製'); return }
    let text = `🌸 Day ${currentDay} 關西行程：\n`
    todaysPlans.forEach(p => text += `[${p.time}] ${p.content}\n`)
    navigator.clipboard.writeText(text).then(() => alert('✅ 行程已複製！'))
  }

  async function addMember() { if (!newMemberName) return; await supabase.from('members').insert([{ name: newMemberName }]); setNewMemberName(''); fetchData() }
  async function addBudget() { if (!budgetItem || !budgetAmount || !budgetPayer) return; const finalInvolved = budgetInvolved.length > 0 ? budgetInvolved : members.map(m => m.name); await supabase.from('budget').insert([{ item: budgetItem, amount: Number(budgetAmount), payer: budgetPayer, unpaid_users: finalInvolved.join(',') }]); setBudgetItem(''); setBudgetAmount(''); setBudgetInvolved([]); fetchData() }
  function toggleInvolved(name) { if (budgetInvolved.includes(name)) setBudgetInvolved(budgetInvolved.filter(n => n !== name)); else setBudgetInvolved([...budgetInvolved, name]) }
  function calculateSettlement() { const balances = {}; members.forEach(m => balances[m.name] = 0); budgetItems.forEach(item => { const payer = item.payer; const amount = Number(item.amount); let involved = []; if (item.unpaid_users) { try { involved = JSON.parse(item.unpaid_users) } catch { involved = item.unpaid_users.split(',') } if (involved.length === 1 && involved[0] === '') involved = members.map(m => m.name) } else { involved = members.map(m => m.name) } const validInvolved = involved.filter(name => members.find(m => m.name === name)); if (validInvolved.length === 0) return; const splitAmount = amount / validInvolved.length; if (balances[payer] !== undefined) balances[payer] += amount; validInvolved.forEach(name => { if (balances[name] !== undefined) balances[name] -= splitAmount }) }); const debtors = []; const creditors = []; Object.keys(balances).forEach(name => { const val = balances[name]; if (val < -0.1) debtors.push({ name, amount: val }); if (val > 0.1) creditors.push({ name, amount: val }) }); debtors.sort((a, b) => a.amount - b.amount); creditors.sort((a, b) => b.amount - a.amount); const transactions = []; let i = 0, j = 0; while (i < debtors.length && j < creditors.length) { const debtor = debtors[i]; const creditor = creditors[j]; const amount = Math.min(Math.abs(debtor.amount), creditor.amount); transactions.push(`${debtor.name} ➜ ${creditor.name}: $${Math.round(amount)}`); debtor.amount += amount; creditor.amount -= amount; if (Math.abs(debtor.amount) < 0.1) i++; if (creditor.amount < 0.1) j++ } return transactions }
  
  async function addPlan() { if (!planInput) return; await supabase.from('plans').insert([{ content: planInput, day: currentDay, time: timeInput }]); setPlanInput(''); setTimeInput('待安排'); fetchData() }
  async function addFlight() { await supabase.from('flights').insert([{ date: flightDate, time: flightTime, airline: flightAirline, flight_number: flightNumber }]); setFlightDate(''); setFlightTime(''); setFlightAirline(''); setFlightNumber(''); fetchData() }
  async function addAccommodation() { await supabase.from('accommodations').insert([{ name: hotelName, address: hotelAddress, check_in: checkIn, check_out: checkOut }]); setHotelName(''); setHotelAddress(''); setCheckIn(''); setCheckOut(''); fetchData() }
  
  function handleFlip(plan) { 
    if (flippedId === plan.id) setFlippedId(null); 
    else { 
      setFlippedId(plan.id); 
      setEditDesc(plan.description || ''); 
      setEditUrl(plan.url || '');
      setEditTime(plan.time || '待安排'); 
    } 
  }
  async function savePlanDetail(id) { await supabase.from('plans').update({ description: editDesc, url: editUrl, time: editTime }).eq('id', id); setFlippedId(null); fetchData() }
  function openGoogleMapRoute() { const todaysPlans = plans.filter(p => (p.day || 1) === currentDay); if (todaysPlans.length === 0) return; const destinations = todaysPlans.map(p => p.content.trim()).join('/'); window.open(`https://www.google.com/maps/dir/${destinations}`, '_blank') }
  
  async function addTodo() { if (!todoInput) return; await supabase.from('todos').insert([{ task: todoInput }]); setTodoInput(''); fetchData() }
  async function toggleTodo(id, currentStatus) { await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id); fetchData() }

  const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const transactions = calculateSettlement()

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: theme.radius, border: '1px solid #f9a8d4', background: '#FFF', fontSize: '16px', color: '#000', WebkitTextFillColor: '#000', opacity: 1, marginBottom: '10px' }
  const tabStyle = (isActive) => ({ flex: '0 0 auto', padding: '12px 24px', borderRadius: '30px', border: 'none', background: isActive ? theme.primary : '#FFF', color: isActive ? 'white' : '#888', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginRight: '10px', boxShadow: isActive ? '0 4px 10px rgba(244, 63, 94, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)' })
  const cardFaceStyle = { width: '100%', backfaceVisibility: 'hidden', borderRadius: theme.radius, boxSizing: 'border-box', border: '1px solid #fecdd3' }

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: theme.bg, fontFamily: '-apple-system, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', minHeight: '100vh', background: '#ffffff', boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
        
        {/* Header - 櫻花漸層 */}
        <div style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, #BE185D 100%)`, padding: '50px 20px 70px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '1px' }}>🌸 關西之旅</h1>
            <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '16px' }}>大阪 ✕ 京都 ✕ 奈良</p>
          </div>
          <div style={{ position: 'absolute', top: -30, right: -20, fontSize: '120px', opacity: 0.1 }}>🗻</div>
        </div>

        <div style={{ marginTop: '-40px', padding: '0 20px' }}>
          {/* 選單 */}
          <div style={{ padding: '5px 0', marginBottom: '20px', display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            <button onClick={() => setActiveTab('schedule')} style={tabStyle(activeTab === 'schedule')}>🗓 行程</button>
            <button onClick={() => setActiveTab('budget')} style={tabStyle(activeTab === 'budget')}>💰 記帳</button>
            <button onClick={() => setActiveTab('todos')} style={tabStyle(activeTab === 'todos')}>✅ 準備</button>
            <button onClick={() => setActiveTab('emergency')} style={{ ...tabStyle(activeTab === 'emergency'), color: activeTab === 'emergency' ? 'white' : theme.danger }}>🆘 急救</button>
            <button onClick={() => setActiveTab('flights')} style={tabStyle(activeTab === 'flights')}>🛫 住宿航班</button>
          </div>

          {/* --- 🆘 緊急聯絡 --- */}
          {activeTab === 'emergency' && (
            <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: '#FFF1F2', padding: '25px', borderRadius: theme.radius, border: `1px solid ${theme.danger}`, textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>🆘</div>
                <h2 style={{ margin: 0, color: '#BE185D' }}>日本救援中心</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {emergencyContacts.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '16px', borderRadius: theme.radius, border: '1px solid #eee', boxShadow: theme.shadow }}>
                    <span style={{ fontSize: '30px', marginRight: '15px' }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#111' }}>{c.name}</div>
                      <div style={{ fontSize: '18px', color: theme.danger, fontWeight: '900' }}>{c.phone}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{c.desc}</div>
                    </div>
                    <a href={`tel:${c.phone}`} style={{ padding: '12px 20px', background: theme.danger, color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }}>撥打</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- ✅ 準備 (日本版) --- */}
          {activeTab === 'todos' && (
            <div style={{ paddingBottom: '40px' }}>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, border: '1px solid #eee', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>🇯P 日語救命小卡 <span>(點擊發音
