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

// --- 樣式設定 ---
const theme = {
  primary: '#0EA5E9', // 天空藍
  white: '#FFFFFF',
  danger: '#EF4444',  // 紅色
  success: '#10B981', // 綠色
  text: '#111111',    // 極深黑
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
  const [members, setMembers] = useState([]) // 👥 成員名單
  
  // 翻卡狀態
  const [flippedId, setFlippedId] = useState(null)
  
  // 編輯輸入框
  const [editDesc, setEditDesc] = useState('')
  const [editUrl, setEditUrl] = useState('')

  // 輸入框狀態
  const [planInput, setPlanInput] = useState('')
  const [timeInput, setTimeInput] = useState('09:00')
  
  // 預算輸入
  const [budgetItem, setBudgetItem] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetPayer, setBudgetPayer] = useState('') // 付款人 (現在是下拉選單)
  const [budgetInvolved, setBudgetInvolved] = useState([]) // 分擔人 (陣列)
  const [newMemberName, setNewMemberName] = useState('') // 新增成員輸入框

  // 航班/住宿 輸入框
  const [flightDate, setFlightDate] = useState('')
  const [flightTime, setFlightTime] = useState('')
  const [flightAirline, setFlightAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [hotelName, setHotelName] = useState('')
  const [hotelAddress, setHotelAddress] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')

  useEffect(() => {
    fetchData()
    // 訂閱所有變更
    const subs = [
      supabase.channel('plans').on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => fetchData()).subscribe(),
      supabase.channel('budget').on('postgres_changes', { event: '*', schema: 'public', table: 'budget' }, () => fetchData()).subscribe(),
      supabase.channel('flights').on('postgres_changes', { event: '*', schema: 'public', table: 'flights' }, () => fetchData()).subscribe(),
      supabase.channel('acco').on('postgres_changes', { event: '*', schema: 'public', table: 'accommodations' }, () => fetchData()).subscribe(),
      supabase.channel('members').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => fetchData()).subscribe()
    ]
    return () => subs.forEach(sub => supabase.removeChannel(sub))
  }, [])

  async function fetchData() {
    // 抓取各個表格資料
    const { data: p } = await supabase.from('plans').select('*').order('time', { ascending: true })
    if (p) {
      setPlans(p)
      const maxDay = Math.max(...p.map(x => x.day || 1))
      if (maxDay > totalDays) setTotalDays(maxDay)
    }
    const { data: b } = await supabase.from('budget').select('*').order('created_at', { ascending: true })
    if (b) setBudgetItems(b)
    const { data: f } = await supabase.from('flights').select('*').order('created_at', { ascending: true })
    if (f) setFlights(f)
    const { data: a } = await supabase.from('accommodations').select('*').order('created_at', { ascending: true })
    if (a) setAccommodations(a)
    const { data: m } = await supabase.from('members').select('*').order('created_at', { ascending: true })
    if (m) {
      setMembers(m)
      // 如果還沒有預設付款人，預設選第一個成員
      if (m.length > 0 && !budgetPayer) setBudgetPayer(m[0].name)
    }
  }

  // --- 通用刪除 ---
  async function deleteItem(table, id) {
    if (confirm('確定要刪除嗎？')) {
      await supabase.from(table).delete().eq('id', id)
      fetchData()
    }
  }

  // --- 成員功能 ---
  async function addMember() {
    if (!newMemberName) return
    const { error } = await supabase.from('members').insert([{ name: newMemberName }])
    if (error) alert('新增失敗，名字可能重複了')
    else { setNewMemberName(''); fetchData() }
  }

  // --- 預算功能 (改版) ---
  async function addBudget() {
    if (!budgetItem || !budgetAmount || !budgetPayer) return
    
    // 如果沒有勾選分擔人，預設是「全部成員」平均分攤
    const finalInvolved = budgetInvolved.length > 0 ? budgetInvolved : members.map(m => m.name)
    
    // 將分擔人陣列轉成字串存入 (JSON 格式比較好處理，但為了相容舊資料我們用逗號分隔)
    const involvedString = finalInvolved.join(',')

    await supabase.from('budget').insert([{ 
      item: budgetItem, 
      amount: Number(budgetAmount), 
      payer: budgetPayer, 
      unpaid_users: involvedString 
    }])
    
    setBudgetItem(''); setBudgetAmount(''); setBudgetInvolved([])
    fetchData()
  }

  // 切換分擔人勾選
  function toggleInvolved(name) {
    if (budgetInvolved.includes(name)) {
      setBudgetInvolved(budgetInvolved.filter(n => n !== name))
    } else {
      setBudgetInvolved([...budgetInvolved, name])
    }
  }

  // --- 結算演算法 (核心黑科技) ---
  function calculateSettlement() {
    const balances = {}
    members.forEach(m => balances[m.name] = 0)

    budgetItems.forEach(item => {
      const payer = item.payer
      const amount = Number(item.amount)
      // 處理分擔人 (相容舊資料的文字格式)
      let involved = []
      if (item.unpaid_users) {
         // 嘗試解析 JSON，如果失敗就當作逗號分隔字串
         try { involved = JSON.parse(item.unpaid_users) } catch { involved = item.unpaid_users.split(',') }
         // 如果分出來是空字串 (舊資料可能格式不對)，就當作所有人分
         if (involved.length === 1 && involved[0] === '') involved = members.map(m => m.name)
      } else {
         involved = members.map(m => m.name)
      }
      
      // 過濾掉可能已經被刪除的成員
      const validInvolved = involved.filter(name => members.find(m => m.name === name))
      if (validInvolved.length === 0) return

      const splitAmount = amount / validInvolved.length
      
      // 付款人 +
      if (balances[payer] !== undefined) balances[payer] += amount
      
      // 分擔人 -
      validInvolved.forEach(name => {
        if (balances[name] !== undefined) balances[name] -= splitAmount
      })
    })

    // 產生建議轉帳路徑
    const debtors = []
    const creditors = []
    Object.keys(balances).forEach(name => {
      const val = balances[name]
      if (val < -0.1) debtors.push({ name, amount: val }) // 欠錢的人 (負數)
      if (val > 0.1) creditors.push({ name, amount: val }) // 收錢的人 (正數)
    })
    
    debtors.sort((a, b) => a.amount - b.amount) // 欠最多的排前面
    creditors.sort((a, b) => b.amount - a.amount) // 收最多的排前面

    const transactions = []
    let i = 0, j = 0
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]
      const creditor = creditors[j]
      
      // 取絕對值比較，看是能還完還是只能還一部分
      const amount = Math.min(Math.abs(debtor.amount), creditor.amount)
      
      transactions.push(`${debtor.name} ➜ ${creditor.name}: $${Math.round(amount)}`)
      
      debtor.amount += amount
      creditor.amount -= amount
      
      if (Math.abs(debtor.amount) < 0.1) i++
      if (creditor.amount < 0.1) j++
    }
    
    return transactions
  }

  // --- 其他新增功能 ---
  async function addPlan() {
    if (!planInput) return
    await supabase.from('plans').insert([{ content: planInput, day: currentDay, time: timeInput }])
    setPlanInput(''); fetchData()
  }
  async function addFlight() {
    await supabase.from('flights').insert([{ date: flightDate, time: flightTime, airline: flightAirline, flight_number: flightNumber }])
    setFlightDate(''); setFlightTime(''); setFlightAirline(''); setFlightNumber(''); fetchData()
  }
  async function addAccommodation() {
    await supabase.from('accommodations').insert([{ name: hotelName, address: hotelAddress, check_in: checkIn, check_out: checkOut }])
    setHotelName(''); setHotelAddress(''); setCheckIn(''); setCheckOut(''); fetchData()
  }
  
  // 翻卡與地圖
  function handleFlip(plan) {
    if (flippedId === plan.id) setFlippedId(null)
    else { setFlippedId(plan.id); setEditDesc(plan.description || ''); setEditUrl(plan.url || '') }
  }
  async function savePlanDetail(id) {
    await supabase.from('plans').update({ description: editDesc, url: editUrl }).eq('id', id)
    setFlippedId(null); fetchData()
  }
  function openGoogleMapRoute() {
    const todaysPlans = plans.filter(p => (p.day || 1) === currentDay)
    if (todaysPlans.length === 0) { alert('無行程'); return }
    const destinations = todaysPlans.map(p => p.content.trim()).join('/')
    window.open(`https://www.google.com/maps/dir/${destinations}`, '_blank')
  }

  const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const transactions = calculateSettlement()

  // 樣式
  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '16px', color: '#000000', marginBottom: '10px' }
  const tabStyle = (isActive) => ({ flex: '0 0 auto', padding: '10px 20px', borderRadius: '20px', border: 'none', background: isActive ? theme.primary : '#F3F4F6', color: isActive ? 'white' : '#6B7280', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginRight: '8px' })
  const cardFaceStyle = { width: '100%', backfaceVisibility: 'hidden', borderRadius: theme.radius, boxSizing: 'border-box', border: '1px solid #eee' }

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#ffffff', fontFamily: '-apple-system, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', minHeight: '100vh', background: '#ffffff' }}>
        
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, #3B82F6 100%)`, padding: '40px 20px 60px', color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>✈️ BKK 曼谷行</h1>
          <p style={{ margin: '5px 0 0', opacity: 0.9 }}>2026.04.29 - 05.03</p>
        </div>

        <div style={{ marginTop: '-40px', padding: '0 20px' }}>
          <div style={{ background: 'white', padding: '10px', borderRadius: '16px', boxShadow: theme.shadow, marginBottom: '20px', display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
            <button onClick={() => setActiveTab('schedule')} style={tabStyle(activeTab === 'schedule')}>🗓 行程</button>
            <button onClick={() => setActiveTab('budget')} style={tabStyle(activeTab === 'budget')}>💰 分帳</button>
            <button onClick={() => setActiveTab('flights')} style={tabStyle(activeTab === 'flights')}>🛫 航班</button>
            <button onClick={() => setActiveTab('accommodations')} style={tabStyle(activeTab === 'accommodations')}>🏨 住宿</button>
          </div>

          {/* --- 預算與分帳 (大改版) --- */}
          {activeTab === 'budget' && (
             <div style={{ paddingBottom: '40px' }}>
              
              {/* 1. 成員管理區塊 */}
              <div style={{ background: '#F0F9FF', padding: '15px', borderRadius: theme.radius, marginBottom: '20px', border: `1px solid ${theme.primary}` }}>
                 <div style={{ fontSize: '14px', fontWeight: 'bold', color: theme.primary, marginBottom: '10px' }}>👥 旅遊成員 (先在這裡加人)</div>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                   {members.map(m => (
                     <span key={m.id} style={{ background: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '14px', color: '#111', border: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
                       {m.name}
                       <span onClick={() => deleteItem('members', m.id)} style={{ marginLeft: '5px', color: '#999', cursor: 'pointer', fontWeight: 'bold' }}>×</span>
                     </span>
                   ))}
                   {members.length === 0 && <span style={{ fontSize: '13px', color: '#666' }}>還沒有成員，請先新增</span>}
                 </div>
                 <div style={{ display: 'flex', gap: '5px' }}>
                   <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="輸入名字 (如: Alvin)" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                   <button onClick={addMember} style={{ background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', padding: '0 15px', fontWeight: 'bold' }}>新增</button>
                 </div>
              </div>

              {/* 總支出 */}
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '5px' }}>目前總支出</div>
                <div style={{ fontSize: '40px', fontWeight: '800', color: theme.success }}>${totalBudget.toLocaleString()}</div>
              </div>

              {/* 2. 新增帳目區塊 (勾選式) */}
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>📝 新增一筆消費</h4>
                <input placeholder="項目 (如: 晚餐)" value={budgetItem} onChange={e => setBudgetItem(e.target.value)} style={inputStyle} />
                <input type="number" placeholder="金額" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} style={inputStyle} />
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '5px' }}>誰先付錢？</label>
                  <select value={budgetPayer} onChange={e => setBudgetPayer(e.target.value)} style={inputStyle}>
                    {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    {members.length === 0 && <option>請先新增成員</option>}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                   <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '5px' }}>誰要分擔？(未勾選代表全員分擔)</label>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                     {members.map(m => (
                       <button 
                         key={m.id} 
                         onClick={() => toggleInvolved(m.name)}
                         style={{ 
                           padding: '6px 12px', borderRadius: '20px', border: '1px solid', fontSize: '14px', cursor: 'pointer',
                           background: budgetInvolved.includes(m.name) ? theme.primary : 'white',
                           color: budgetInvolved.includes(m.name) ? 'white' : '#666',
                           borderColor: budgetInvolved.includes(m.name) ? theme.primary : '#ddd'
                         }}
                       >
                         {m.name}
                       </button>
                     ))}
                   </div>
                </div>

                <button onClick={addBudget} style={{ width: '100%', background: theme.success, color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>＋ 新增帳目</button>
              </div>

              {/* 帳目列表 */}
              <div style={{ marginBottom: '30px' }}>
                {budgetItems.map(item => (
                  <div key={item.id} style={{ background: 'white', padding: '15px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #F3F4F6', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.item}</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                        <span style={{ color: theme.primary, fontWeight: 'bold' }}>{item.payer}</span> 先付
                        <span style={{ marginLeft: '5px', color: '#999' }}>
                          (分擔: {item.unpaid_users && item.unpaid_users.length > 20 ? item.unpaid_users.substring(0,20)+'...' : item.unpaid_users})
                        </span>
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: theme.success, marginRight: '15px' }}>${item.amount}</div>
                    <button onClick={() => deleteItem('budget', item.id)} style={{ border: 'none', background: 'transparent', color: '#9CA3AF', padding: '5px' }}>✕</button>
                  </div>
                ))}
              </div>

              {/* 3. 結算中心 */}
              <div style={{ background: '#111', padding: '25px', borderRadius: theme.radius, color: 'white', marginBottom: '50px' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>📊 結算中心</h3>
                {transactions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {transactions.map((t, idx) => (
                      <div key={idx} style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '10px', color: theme.success }}>💸</span> {t}
                      </div>
                    ))}
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>* 系統已自動計算最佳轉帳路徑</div>
                  </div>
                ) : (
                  <div style={{ color: '#666' }}>目前沒有債務需要結清 👍</div>
                )}
              </div>
            </div>
          )}

          {/* 行程表 (維持翻卡修正版) */}
          {activeTab === 'schedule' && (
            <div style={{ paddingBottom: '120px' }}>
              <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
                  <button key={day} onClick={() => setCurrentDay(day)} style={{ border: 'none', background: currentDay === day ? theme.primary : '#E5E7EB', color: currentDay === day ? 'white' : '#4B5563', padding: '8px 18px', borderRadius: '20px', marginRight: '8px', fontWeight: 'bold', flexShrink: 0 }}>Day {day}</button>
                ))}
                <button onClick={() => setTotalDays(totalDays + 1)} style={{ border: '1px solid #ddd', background: 'white', color: theme.primary, width: '35px', height: '35px', borderRadius: '50%', flexShrink: 0 }}>+</button>
              </div>
              <button onClick={openGoogleMapRoute} style={{ width: '100%', padding: '12px', background: '#E0F2FE', color: '#0284C7', border: '1px dashed #0284C7', borderRadius: '12px', fontWeight: 'bold', marginBottom: '15px', cursor: 'pointer' }}>🗺️ 自動規劃當日路線</button>
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
                          <div style={{ flex: 1, color: '#111', fontSize: '16px', fontWeight: '500' }}>{plan.content}{(plan.url || plan.description) && <span style={{ marginLeft: '5px', fontSize: '12px' }}>📝</span>}</div>
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

          {/* 航班與住宿 (簡化版，功能不變) */}
          {activeTab === 'flights' && (
             <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>🛫 新增航班</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="日期 (4/29)" value={flightDate} onChange={e => setFlightDate(e.target.value)} style={inputStyle} />
                  <input placeholder="時間 (10:30)" value={flightTime} onChange={e => setFlightTime(e.target.value)} style={inputStyle} />
                </div>
                <input placeholder="航空公司" value={flightAirline} onChange={e => setFlightAirline(e.target.value)} style={inputStyle} />
                <input placeholder="航班代號" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} style={inputStyle} />
                <button onClick={addFlight} style={{ width: '100%', marginTop: '10px', background: theme.primary, color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold' }}>＋ 新增航班</button>
              </div>
              {flights.map(item => (
                <div key={item.id} style={{ background: 'white', padding: '16px', borderRadius: theme.radius, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid ${theme.primary}`, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <div><div style={{ fontSize: '14px', color: '#6B7280' }}>{item.date} {item.time}</div><div style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.airline}</div><div style={{ color: theme.primary }}>{item.flight_number}</div></div>
                    <button onClick={() => deleteItem('flights', item.id)} style={{ border: 'none', background: '#FEF2F2', color: theme.danger, borderRadius: '8px', padding: '5px 10px' }}>刪除</button>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'accommodations' && (
             <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>🏨 新增住宿</h4>
                <input placeholder="飯店名稱" value={hotelName} onChange={e => setHotelName(e.target.value)} style={inputStyle} />
                <input placeholder="地址" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} style={inputStyle} />
                <div style={{ display: 'flex', gap: '10px' }}><input placeholder="入住" value={checkIn} onChange={e => setCheckIn(e.target.value)} style={inputStyle} /><input placeholder="退房" value={checkOut} onChange={e => setCheckOut(e.target.value)} style={inputStyle} /></div>
                <button onClick={addAccommodation} style={{ width: '100%', marginTop: '10px', background: '#F59E0B', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold' }}>＋ 新增住宿</button>
              </div>
              {accommodations.map(item => (
                <div key={item.id} style={{ background: 'white', padding: '16px', borderRadius: theme.radius, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid #F59E0B`, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <div><div style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.name}</div><div style={{ fontSize: '14px', color: '#6B7280' }}>{item.address}</div><div style={{ fontSize: '14px', color: '#B45309' }}>📅 {item.check_in} - {item.check_out}</div></div>
                    <button onClick={() => deleteItem('accommodations', item.id)} style={{ border: 'none', background: '#FEF2F2', color: theme.danger, borderRadius: '8px', padding: '5px 10px' }}>刪除</button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App
