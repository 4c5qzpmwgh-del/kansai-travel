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

const timeOptions = []
for (let i = 0; i < 24; i++) {
  const hour = i.toString().padStart(2, '0')
  timeOptions.push(`${hour}:00`); timeOptions.push(`${hour}:30`)
}

// --- 樣式設定 (櫻花粉與抹茶綠) ---
const theme = {
  primary: '#F43F5E', // 櫻花粉
  secondary: '#10B981', // 抹茶綠
  danger: '#E11D48',
  bg: '#FFF1F2', // 淡淡的粉底色
  text: '#111111',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  radius: '16px'
}

function App() {
  const [activeTab, setActiveTab] = useState('schedule')
  const [currentDay, setCurrentDay] = useState(1)
  const [totalDays, setTotalDays] = useState(5) // 預設 5 天
  
  const [plans, setPlans] = useState([])
  const [budgetItems, setBudgetItems] = useState([])
  const [flights, setFlights] = useState([])
  const [accommodations, setAccommodations] = useState([])
  const [members, setMembers] = useState([])
  const [todos, setTodos] = useState([])
  
  const [flippedId, setFlippedId] = useState(null)
  const [editDesc, setEditDesc] = useState('')
  const [editUrl, setEditUrl] = useState('')

  const [planInput, setPlanInput] = useState('')
  const [timeInput, setTimeInput] = useState('09:00')
  
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
    utterance.lang = 'ja-JP' // 換成日語發音
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  function copyScheduleToClipboard() {
    const todaysPlans = plans.filter(p => (p.day || 1) === currentDay)
    if (todaysPlans.length === 0) { alert('今天沒有行程可以複製'); return }
    let text = `🌸 Day ${currentDay} 關西行程：\n`
    todaysPlans.forEach(p => text += `${p.time} ${p.content}\n`)
    navigator.clipboard.writeText(text).then(() => alert('✅ 行程已複製！'))
  }

  async function addMember() { if (!newMemberName) return; await supabase.from('members').insert([{ name: newMemberName }]); setNewMemberName(''); fetchData() }
  async function addBudget() { if (!budgetItem || !budgetAmount || !budgetPayer) return; const finalInvolved = budgetInvolved.length > 0 ? budgetInvolved : members.map(m => m.name); await supabase.from('budget').insert([{ item: budgetItem, amount: Number(budgetAmount), payer: budgetPayer, unpaid_users: finalInvolved.join(',') }]); setBudgetItem(''); setBudgetAmount(''); setBudgetInvolved([]); fetchData() }
  function toggleInvolved(name) { if (budgetInvolved.includes(name)) setBudgetInvolved(budgetInvolved.filter(n => n !== name)); else setBudgetInvolved([...budgetInvolved, name]) }
  function calculateSettlement() { const balances = {}; members.forEach(m => balances[m.name] = 0); budgetItems.forEach(item => { const payer = item.payer; const amount = Number(item.amount); let involved = []; if (item.unpaid_users) { try { involved = JSON.parse(item.unpaid_users) } catch { involved = item.unpaid_users.split(',') } if (involved.length === 1 && involved[0] === '') involved = members.map(m => m.name) } else { involved = members.map(m => m.name) } const validInvolved = involved.filter(name => members.find(m => m.name === name)); if (validInvolved.length === 0) return; const splitAmount = amount / validInvolved.length; if (balances[payer] !== undefined) balances[payer] += amount; validInvolved.forEach(name => { if (balances[name] !== undefined) balances[name] -= splitAmount }) }); const debtors = []; const creditors = []; Object.keys(balances).forEach(name => { const val = balances[name]; if (val < -0.1) debtors.push({ name, amount: val }); if (val > 0.1) creditors.push({ name, amount: val }) }); debtors.sort((a, b) => a.amount - b.amount); creditors.sort((a, b) => b.amount - a.amount); const transactions = []; let i = 0, j = 0; while (i < debtors.length && j < creditors.length) { const debtor = debtors[i]; const creditor = creditors[j]; const amount = Math.min(Math.abs(debtor.amount), creditor.amount); transactions.push(`${debtor.name} ➜ ${creditor.name}: $${Math.round(amount)}`); debtor.amount += amount; creditor.amount -= amount; if (Math.abs(debtor.amount) < 0.1) i++; if (creditor.amount < 0.1) j++ } return transactions }
  
  async function addPlan() { if (!planInput) return; await supabase.from('plans').insert([{ content: planInput, day: currentDay, time: timeInput }]); setPlanInput(''); fetchData() }
  async function addFlight() { await supabase.from('flights').insert([{ date: flightDate, time: flightTime, airline: flightAirline, flight_number: flightNumber }]); setFlightDate(''); setFlightTime(''); setFlightAirline(''); setFlightNumber(''); fetchData() }
  async function addAccommodation() { await supabase.from('accommodations').insert([{ name: hotelName, address: hotelAddress, check_in: checkIn, check_out: checkOut }]); setHotelName(''); setHotelAddress(''); setCheckIn(''); setCheckOut(''); fetchData() }
  
  function handleFlip(plan) { if (flippedId === plan.id) setFlippedId(null); else { setFlippedId(plan.id); setEditDesc(plan.description || ''); setEditUrl(plan.url || '') } }
  async function savePlanDetail(id) { await supabase.from('plans').update({ description: editDesc, url: editUrl }).eq('id', id); setFlippedId(null); fetchData() }
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
              
              {/* 日語小卡 */}
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, border: '1px solid #eee', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>🇯P 日語救命小卡 <span>(點擊發音)</span></h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {japanPhrases.map((p, idx) => (
                    <button key={idx} onClick={() => speak(p.speak)} style={{ padding: '15px 10px', borderRadius: '12px', border: `1px solid #fecdd3`, background: '#fff0f2', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(244,63,94,0.05)' }}>
                      <span style={{ fontSize: '24px' }}>{p.icon}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: theme.danger }}>{p.text}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>{p.kana}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 匯率計算機 (日幣) */}
              <div style={{ background: '#F0FDF4', padding: '20px', borderRadius: theme.radius, marginBottom: '20px', border: `1px solid ${theme.secondary}` }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#166534' }}>💱 匯率快速換算 (約 x0.21)</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="number" placeholder="日幣 JPY" value={jpyInput} onChange={e => setJpyInput(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1, border: '1px solid #bbf7d0' }} />
                  <span style={{ fontSize: '20px', color: '#000' }}>≈</span>
                  <div style={{ flex: 1, fontWeight: 'bold', fontSize: '24px', color: '#166534' }}>{jpyInput ? Math.round(jpyInput * 0.21) : 0} TWD</div>
                </div>
              </div>

              {/* 檢查清單 */}
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, border: '1px solid #eee' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>📝 赴日檢查清單</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <input value={todoInput} onChange={e => setTodoInput(e.target.value)} placeholder="新增事項..." style={{ ...inputStyle, marginBottom: 0 }} />
                  <button onClick={addTodo} style={{ background: theme.primary, color: 'white', border: 'none', padding: '0 20px', borderRadius: theme.radius, fontWeight: 'bold' }}>新增</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {todos.map(todo => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', background: todo.is_completed ? '#F3F4F6' : 'white', borderRadius: '10px', border: '1px solid #eee', opacity: todo.is_completed ? 0.5 : 1 }}>
                      <input type="checkbox" checked={todo.is_completed} onChange={() => toggleTodo(todo.id, todo.is_completed)} style={{ width: '22px', height: '22px', marginRight: '12px', accentColor: theme.primary }} />
                      <span style={{ flex: 1, textDecoration: todo.is_completed ? 'line-through' : 'none', fontSize: '16px', color: '#000', fontWeight: '500' }}>{todo.task}</span>
                      <button onClick={() => deleteItem('todos', todo.id)} style={{ border: 'none', background: 'transparent', color: '#ccc', fontSize: '18px' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- 行程表 --- */}
          {activeTab === 'schedule' && (
            <div style={{ paddingBottom: '120px' }}>
              <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '15px', marginBottom: '10px', scrollbarWidth: 'none' }}>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
                  <button key={day} onClick={() => setCurrentDay(day)} style={{ border: 'none', background: currentDay === day ? theme.primary : '#fff', color: currentDay === day ? 'white' : '#4B5563', padding: '10px 20px', borderRadius: '25px', marginRight: '10px', fontWeight: 'bold', flexShrink: 0, boxShadow: currentDay === day ? '0 4px 10px rgba(244,63,94,0.3)' : '0 2px 5px rgba(0,0,0,0.05)', border: currentDay !== day ? '1px solid #eee' : 'none' }}>Day {day}</button>
                ))}
                <button onClick={() => setTotalDays(totalDays + 1)} style={{ border: '1px dashed #ccc', background: 'white', color: '#666', width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }}>+</button>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={openGoogleMapRoute} style={{ flex: 2, padding: '14px', background: '#FFF1F2', color: theme.danger, border: `1px dashed ${theme.danger}`, borderRadius: theme.radius, fontWeight: 'bold', cursor: 'pointer' }}>🗺️ 自動規劃路線</button>
                <button onClick={copyScheduleToClipboard} style={{ flex: 1, padding: '14px', background: '#F3F4F6', color: '#333', border: '1px solid #ddd', borderRadius: theme.radius, fontWeight: 'bold', cursor: 'pointer' }}>📋 複製</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {plans.filter(p => (p.day || 1) === currentDay).map(plan => {
                  const isFlipped = flippedId === plan.id;
                  return (
                    <div key={plan.id} style={{ perspective: '1000px', cursor: 'pointer' }} onClick={() => handleFlip(plan)}>
                      <div style={{ position: 'relative', transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)', transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                        
                        {/* 正面 */}
                        <div style={{ ...cardFaceStyle, position: isFlipped ? 'absolute' : 'relative', top: 0, left: 0, background: 'white', padding: '18px', boxShadow: theme.shadow, display: 'flex', alignItems: 'center', borderLeft: `5px solid ${theme.primary}` }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16px', minWidth: '50px' }}>
                            <span style={{ fontSize: '18px', fontWeight: '900', color: theme.primary }}>{plan.time.split(':')[0]}</span>
                            <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 'bold' }}>{plan.time.split(':')[1]}</span>
                          </div>
                          <div style={{ flex: 1, color: '#000', fontSize: '18px', fontWeight: 'bold' }}>{plan.content}{(plan.url || plan.description) && <span style={{ marginLeft: '8px', fontSize: '14px' }}>📝</span>}</div>
                          <button onClick={(e) => { e.stopPropagation(); deleteItem('plans', plan.id) }} style={{ border: 'none', background: '#fff0f2', color: theme.danger, width: '36px', height: '36px', borderRadius: '10px', fontWeight: 'bold' }}>✕</button>
                        </div>

                        {/* 背面 */}
                        <div onClick={e => e.stopPropagation()} style={{ ...cardFaceStyle, position: isFlipped ? 'relative' : 'absolute', top: 0, left: 0, transform: 'rotateY(180deg)', background: '#fff0f2', padding: '20px', boxShadow: theme.shadow, border: `2px solid ${theme.primary}` }}>
                          <div style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '900', color: theme.danger }}>✏️ 景點筆記與連結</div>
                          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="想吃什麼？要買什麼？" style={{ ...inputStyle, height: '80px', resize: 'none', border: 'none' }} />
                          <input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="Tabelog / Google Map 網址" style={{...inputStyle, border: 'none'}} />
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => savePlanDetail(plan.id)} style={{ flex: 1, padding: '12px', background: theme.primary, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>儲存</button>
                            {editUrl && <button onClick={() => window.open(editUrl, '_blank')} style={{ flex: 1, padding: '12px', background: theme.secondary, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>前往</button>}
                            <button onClick={() => setFlippedId(null)} style={{ padding: '12px 20px', background: '#ddd', color: '#333', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>返回</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* 底部輸入 */}
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '15px 20px 25px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto', zIndex: 10, boxSizing: 'border-box' }}>
                <select value={timeInput} onChange={e => setTimeInput(e.target.value)} style={{ ...inputStyle, width: '100px', marginBottom: 0, fontWeight: 'bold' }}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <input value={planInput} onChange={e => setPlanInput(e.target.value)} placeholder="例如: 清水寺 / 道頓堀" style={{ ...inputStyle, marginBottom: 0, border: `2px solid ${theme.primary}` }} />
                <button onClick={addPlan} style={{ background: theme.primary, color: 'white', border: 'none', padding: '0 24px', borderRadius: theme.radius, fontWeight: 'bold', fontSize: '16px', flexShrink: 0 }}>＋</button>
              </div>
            </div>
          )}

          {/* --- 分帳 (維持原版邏輯，調整顏色) --- */}
          {activeTab === 'budget' && (
             <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: '#FFF1F2', padding: '20px', borderRadius: theme.radius, marginBottom: '20px', border: `1px solid ${theme.primary}` }}>
                 <div style={{ fontSize: '15px', fontWeight: 'bold', color: theme.danger, marginBottom: '12px' }}>👥 設定旅伴</div>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                   {members.map(m => ( <span key={m.id} style={{ background: 'white', padding: '8px 15px', borderRadius: '20px', fontSize: '15px', color: '#000', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>{m.name}<span onClick={() => deleteItem('members', m.id)} style={{ marginLeft: '8px', color: '#ccc', cursor: 'pointer' }}>×</span></span> ))}
                 </div>
                 <div style={{ display: 'flex', gap: '8px' }}><input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="輸入旅伴名字" style={{ ...inputStyle, marginBottom: 0, flex: 1, border: 'none' }} /><button onClick={addMember} style={{ background: theme.danger, color: 'white', border: 'none', borderRadius: theme.radius, padding: '0 20px', fontWeight: 'bold' }}>新增</button></div>
              </div>
              <div style={{ background: 'white', padding: '25px', borderRadius: theme.radius, boxShadow: theme.shadow, textAlign: 'center', marginBottom: '20px' }}><div style={{ fontSize: '15px', color: '#6B7280', marginBottom: '5px', fontWeight: 'bold' }}>公費總支出</div><div style={{ fontSize: '45px', fontWeight: '900', color: theme.secondary }}>${totalBudget.toLocaleString()}</div></div>
              <div style={{ background: 'white', padding: '25px', borderRadius: theme.radius, boxShadow: theme.shadow, marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#111', fontSize: '18px' }}>📝 記一筆</h4>
                <input placeholder="項目 (如: 燒肉、JR車票)" value={budgetItem} onChange={e => setBudgetItem(e.target.value)} style={inputStyle} /><input type="number" placeholder="金額 (台幣或日幣自己統一方面即可)" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} style={inputStyle} />
                <div style={{ marginBottom: '15px', marginTop: '5px' }}><label style={{ fontSize: '14px', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>誰代墊的？</label><select value={budgetPayer} onChange={e => setBudgetPayer(e.target.value)} style={inputStyle}>{members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select></div>
                <div style={{ marginBottom: '20px' }}><label style={{ fontSize: '14px', color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>誰要分攤？(反灰=全部人)</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>{members.map(m => (<button key={m.id} onClick={() => toggleInvolved(m.name)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', background: budgetInvolved.includes(m.name) ? theme.secondary : '#f3f4f6', color: budgetInvolved.includes(m.name) ? 'white' : '#9ca3af' }}>{m.name}</button>))}</div></div>
                <button onClick={addBudget} style={{ width: '100%', background: theme.secondary, color: 'white', border: 'none', padding: '16px', borderRadius: theme.radius, fontWeight: 'bold', fontSize: '18px' }}>送出帳目</button>
              </div>
              <div style={{ marginBottom: '30px' }}>{budgetItems.map(item => (<div key={item.id} style={{ background: 'white', padding: '18px', borderRadius: theme.radius, display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}><div style={{ flex: 1 }}><div style={{ fontWeight: 'bold', fontSize: '18px', color: '#000' }}>{item.item}</div><div style={{ fontSize: '14px', color: '#666', marginTop: '6px' }}><span style={{ color: theme.secondary, fontWeight: '900' }}>{item.payer}</span> 代墊 <span style={{ marginLeft: '5px', color: '#aaa' }}>(給 {item.unpaid_users} 分攤)</span></div></div><div style={{ fontWeight: '900', fontSize: '22px', color: theme.secondary, marginRight: '15px' }}>${item.amount}</div><button onClick={() => deleteItem('budget', item.id)} style={{ border: 'none', background: '#f3f4f6', color: '#999', width: '30px', height: '30px', borderRadius: '50%', fontWeight: 'bold' }}>✕</button></div>))}</div>
              <div style={{ background: '#111', padding: '30px 25px', borderRadius: theme.radius, color: 'white', marginBottom: '50px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}><h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #333', paddingBottom: '15px', fontSize: '20px' }}>🤖 AI 自動結算</h3>{transactions.length > 0 ? (<div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>{transactions.map((t, idx) => (<div key={idx} style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', background: '#222', padding: '15px', borderRadius: '12px' }}><span style={{ marginRight: '15px', fontSize: '24px' }}>💸</span> {t}</div>))}<div style={{ fontSize: '13px', color: '#666', marginTop: '10px', textAlign: 'center' }}>多筆交叉債務已自動相抵完畢</div></div>) : (<div style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>帳目很乾淨，沒人欠錢 🎉</div>)}</div>
            </div>
          )}

          {/* --- 住宿與航班合一 --- */}
          {activeTab === 'flights' && (
             <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: 'white', padding: '25px', borderRadius: theme.radius, boxShadow: theme.shadow, marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#111', fontSize: '18px' }}>🛫 航班資訊</h4>
                <div style={{ display: 'flex', gap: '10px' }}><input placeholder="去程/回程日期" value={flightDate} onChange={e => setFlightDate(e.target.value)} style={inputStyle} /><input placeholder="時間" value={flightTime} onChange={e => setFlightTime(e.target.value)} style={inputStyle} /></div>
                <div style={{ display: 'flex', gap: '10px' }}><input placeholder="航空 (星宇/長榮)" value={flightAirline} onChange={e => setFlightAirline(e.target.value)} style={inputStyle} /><input placeholder="航班代號" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} style={inputStyle} /></div>
                <button onClick={addFlight} style={{ width: '100%', marginTop: '5px', background: '#3B82F6', color: 'white', border: 'none', padding: '14px', borderRadius: theme.radius, fontWeight: 'bold', fontSize: '16px' }}>儲存航班</button>
              </div>
              {flights.map(item => (<div key={item.id} style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, borderLeft: `5px solid #3B82F6`, marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontSize: '15px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>{item.date} {item.time}</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#000' }}>{item.airline} <span style={{color: '#3B82F6', fontSize: '16px'}}>{item.flight_number}</span></div></div><button onClick={() => deleteItem('flights', item.id)} style={{ border: 'none', background: '#f3f4f6', color: '#999', width: '30px', height: '30px', borderRadius: '50%' }}>✕</button></div>))}
              
              <div style={{ background: 'white', padding: '25px', borderRadius: theme.radius, boxShadow: theme.shadow, marginBottom: '25px', marginTop: '40px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#111', fontSize: '18px' }}>🏨 住宿資訊</h4>
                <input placeholder="飯店名稱 (例如：大阪心齋橋相鐵)" value={hotelName} onChange={e => setHotelName(e.target.value)} style={inputStyle} />
                <input placeholder="地址或 Google Maps 連結" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} style={inputStyle} />
                <div style={{ display: 'flex', gap: '10px' }}><input placeholder="Check-in 日期" value={checkIn} onChange={e => setCheckIn(e.target.value)} style={inputStyle} /><input placeholder="Check-out" value={checkOut} onChange={e => setCheckOut(e.target.value)} style={inputStyle} /></div>
                <button onClick={addAccommodation} style={{ width: '100%', marginTop: '5px', background: '#F59E0B', color: 'white', border: 'none', padding: '14px', borderRadius: theme.radius, fontWeight: 'bold', fontSize: '16px' }}>儲存住宿</button>
              </div>
              {accommodations.map(item => (<div key={item.id} style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: theme.shadow, borderLeft: `5px solid #F59E0B`, marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{flex: 1}}><div style={{ fontSize: '20px', fontWeight: '900', color: '#000', marginBottom: '8px' }}>{item.name}</div><div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>📍 {item.address}</div><div style={{ fontSize: '14px', background: '#FFF7ED', color: '#B45309', display: 'inline-block', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold' }}>📅 {item.check_in} ~ {item.check_out}</div></div><button onClick={() => deleteItem('accommodations', item.id)} style={{ border: 'none', background: '#f3f4f6', color: '#999', width: '30px', height: '30px', borderRadius: '50%' }}>✕</button></div>))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App
