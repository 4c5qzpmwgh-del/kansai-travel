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
  
  // 輸入框狀態
  const [planInput, setPlanInput] = useState('')
  const [timeInput, setTimeInput] = useState('09:00')
  
  // 預算輸入
  const [budgetItem, setBudgetItem] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetPayer, setBudgetPayer] = useState('')
  const [budgetUnpaid, setBudgetUnpaid] = useState('')

  // 航班輸入
  const [flightDate, setFlightDate] = useState('')
  const [flightTime, setFlightTime] = useState('')
  const [flightAirline, setFlightAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  
  // 住宿輸入
  const [hotelName, setHotelName] = useState('')
  const [hotelAddress, setHotelAddress] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')

  useEffect(() => {
    fetchData()
    const sub1 = supabase.channel('plans-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => fetchData()).subscribe()
    const sub2 = supabase.channel('budget-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'budget' }, () => fetchData()).subscribe()
    const sub3 = supabase.channel('flights-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'flights' }, () => fetchData()).subscribe()
    const sub4 = supabase.channel('acco-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'accommodations' }, () => fetchData()).subscribe()
    
    return () => { 
      supabase.removeChannel(sub1); supabase.removeChannel(sub2); 
      supabase.removeChannel(sub3); supabase.removeChannel(sub4);
    }
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

    const { data: flightData } = await supabase.from('flights').select('*').order('created_at', { ascending: true })
    if (flightData) setFlights(flightData)

    const { data: hotelData } = await supabase.from('accommodations').select('*').order('created_at', { ascending: true })
    if (hotelData) setAccommodations(hotelData)
  }

  // --- 通用刪除 ---
  async function deleteItem(table, id) {
    if (confirm('確定要刪除嗎？')) {
      await supabase.from(table).delete().eq('id', id)
      fetchData()
    }
  }

  // --- 新增功能 ---
  async function addPlan() {
    if (!planInput) return
    await supabase.from('plans').insert([{ content: planInput, day: currentDay, time: timeInput }])
    setPlanInput(''); fetchData()
  }

  async function addBudget() {
    if (!budgetItem || !budgetAmount) return
    await supabase.from('budget').insert([{ item: budgetItem, amount: Number(budgetAmount), payer: budgetPayer, unpaid_users: budgetUnpaid }])
    setBudgetItem(''); setBudgetAmount(''); setBudgetPayer(''); setBudgetUnpaid(''); fetchData()
  }

  async function addFlight() {
    if (!flightAirline) return
    await supabase.from('flights').insert([{ date: flightDate, time: flightTime, airline: flightAirline, flight_number: flightNumber }])
    setFlightDate(''); setFlightTime(''); setFlightAirline(''); setFlightNumber(''); fetchData()
  }

  async function addAccommodation() {
    if (!hotelName) return
    await supabase.from('accommodations').insert([{ name: hotelName, address: hotelAddress, check_in: checkIn, check_out: checkOut }])
    setHotelName(''); setHotelAddress(''); setCheckIn(''); setCheckOut(''); fetchData()
  }

  const totalBudget = budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  // 樣式
  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px',
    border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '16px',
    color: '#000000', WebkitTextFillColor: '#000000', opacity: 1, marginBottom: '10px'
  }

  // 分頁按鈕樣式
  const tabStyle = (isActive) => ({
    flex: '0 0 auto', // 關鍵：防止縮小，允許滑動
    padding: '10px 20px',
    borderRadius: '20px',
    border: 'none',
    background: isActive ? theme.primary : '#F3F4F6',
    color: isActive ? 'white' : '#6B7280',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '15px',
    marginRight: '8px'
  })

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#ffffff', fontFamily: '-apple-system, sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', minHeight: '100vh', background: '#ffffff' }}>
        
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, #3B82F6 100%)`, padding: '40px 20px 60px', color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>✈️ BKK 曼谷行</h1>
          <p style={{ margin: '5px 0 0', opacity: 0.9 }}>2026.04.29 - 05.03</p>
        </div>

        {/* 主內容區 */}
        <div style={{ marginTop: '-40px', padding: '0 20px' }}>
          
          {/* 🔥 滑動式分頁選單 */}
          <div style={{ 
            background: 'white', padding: '10px', borderRadius: '16px', boxShadow: theme.shadow, marginBottom: '20px',
            display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch'
          }}>
            <button onClick={() => setActiveTab('schedule')} style={tabStyle(activeTab === 'schedule')}>🗓 行程</button>
            <button onClick={() => setActiveTab('budget')} style={tabStyle(activeTab === 'budget')}>💰 預算</button>
            <button onClick={() => setActiveTab('flights')} style={tabStyle(activeTab === 'flights')}>🛫 航班</button>
            <button onClick={() => setActiveTab('accommodations')} style={tabStyle(activeTab === 'accommodations')}>🏨 住宿</button>
          </div>

          {/* --- 1. 行程表 --- */}
          {activeTab === 'schedule' && (
            <div style={{ paddingBottom: '120px' }}>
              <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
                  <button key={day} onClick={() => setCurrentDay(day)} style={{ border: 'none', background: currentDay === day ? theme.primary : '#E5E7EB', color: currentDay === day ? 'white' : '#4B5563', padding: '8px 18px', borderRadius: '20px', marginRight: '8px', fontWeight: 'bold', flexShrink: 0 }}>
                    Day {day}
                  </button>
                ))}
                <button onClick={() => setTotalDays(totalDays + 1)} style={{ border: '1px solid #ddd', background: 'white', color: theme.primary, width: '35px', height: '35px', borderRadius: '50%', flexShrink: 0 }}>+</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plans.filter(p => (p.day || 1) === currentDay).map(plan => (
                  <div key={plan.id} style={{ background: 'white', padding: '16px', borderRadius: theme.radius, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', alignItems: 'center', borderLeft: `4px solid ${theme.primary}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '16px', minWidth: '45px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: theme.primary }}>{plan.time.split(':')[0]}</span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{plan.time.split(':')[1]}</span>
                    </div>
                    <div style={{ flex: 1, color: '#111', fontSize: '16px', fontWeight: '500' }}>{plan.content}</div>
                    <button onClick={() => deleteItem('plans', plan.id)} style={{ border: 'none', background: '#FEF2F2', color: theme.danger, width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>

              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '15px 20px 25px', boxShadow: '0 -4px 15px rgba(0,0,0,0.08)', display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto', zIndex: 10, boxSizing: 'border-box' }}>
                <select value={timeInput} onChange={e => setTimeInput(e.target.value)} style={{ ...inputStyle, width: '90px', marginBottom: 0 }}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <input value={planInput} onChange={e => setPlanInput(e.target.value)} placeholder="輸入行程..." style={{ ...inputStyle, marginBottom: 0 }} />
                <button onClick={addPlan} style={{ background: theme.primary, color: 'white', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', flexShrink: 0 }}>新增</button>
              </div>
            </div>
          )}

          {/* --- 2. 預算表 --- */}
          {activeTab === 'budget' && (
            <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: 'white', padding: '25px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '5px' }}>目前總支出</div>
                <div style={{ fontSize: '40px', fontWeight: '800', color: '#059669' }}>${totalBudget.toLocaleString()}</div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>📝 新增帳目</h4>
                <input placeholder="項目 (如: 晚餐)" value={budgetItem} onChange={e => setBudgetItem(e.target.value)} style={inputStyle} />
                <input type="number" placeholder="金額" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} style={inputStyle} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="先付的人" value={budgetPayer} onChange={e => setBudgetPayer(e.target.value)} style={inputStyle} />
                  <input placeholder="欠款的人" value={budgetUnpaid} onChange={e => setBudgetUnpaid(e.target.value)} style={inputStyle} />
                </div>
                <button onClick={addBudget} style={{ width: '100%', marginTop: '10px', background: '#059669', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold' }}>＋ 新增</button>
              </div>
              {budgetItems.map(item => (
                <div key={item.id} style={{ background: 'white', padding: '15px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #F3F4F6', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.item}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{item.payer ? `${item.payer} 付` : ''} {item.unpaid_users ? ` (欠: ${item.unpaid_users})` : ''}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#059669', marginRight: '15px' }}>${item.amount}</div>
                  <button onClick={() => deleteItem('budget', item.id)} style={{ border: 'none', background: 'transparent', color: '#9CA3AF' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* --- 3. 航班頁面 (新功能) --- */}
          {activeTab === 'flights' && (
            <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>🛫 新增航班</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="日期 (4/29)" value={flightDate} onChange={e => setFlightDate(e.target.value)} style={inputStyle} />
                  <input placeholder="時間 (10:30)" value={flightTime} onChange={e => setFlightTime(e.target.value)} style={inputStyle} />
                </div>
                <input placeholder="航空公司 (星宇/長榮)" value={flightAirline} onChange={e => setFlightAirline(e.target.value)} style={inputStyle} />
                <input placeholder="航班代號 (JX800)" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} style={inputStyle} />
                <button onClick={addFlight} style={{ width: '100%', marginTop: '10px', background: theme.primary, color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold' }}>＋ 新增航班</button>
              </div>

              {flights.map(item => (
                <div key={item.id} style={{ background: 'white', padding: '16px', borderRadius: theme.radius, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid ${theme.primary}`, marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>{item.date} {item.time}</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111' }}>{item.airline}</div>
                      <div style={{ fontSize: '16px', color: theme.primary, fontWeight: '500' }}>{item.flight_number}</div>
                    </div>
                    <button onClick={() => deleteItem('flights', item.id)} style={{ border: 'none', background: '#FEF2F2', color: theme.danger, borderRadius: '8px', padding: '5px 10px' }}>刪除</button>
                  </div>
                </div>
              ))}
              {flights.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>尚未新增航班資料</div>}
            </div>
          )}

          {/* --- 4. 住宿頁面 (新功能) --- */}
          {activeTab === 'accommodations' && (
            <div style={{ paddingBottom: '40px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: theme.radius, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>🏨 新增住宿</h4>
                <input placeholder="飯店名稱" value={hotelName} onChange={e => setHotelName(e.target.value)} style={inputStyle} />
                <input placeholder="地址 / Google Map連結" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} style={inputStyle} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="入住 (4/29)" value={checkIn} onChange={e => setCheckIn(e.target.value)} style={inputStyle} />
                  <input placeholder="退房 (5/1)" value={checkOut} onChange={e => setCheckOut(e.target.value)} style={inputStyle} />
                </div>
                <button onClick={addAccommodation} style={{ width: '100%', marginTop: '10px', background: '#F59E0B', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold' }}>＋ 新增住宿</button>
              </div>

              {accommodations.map(item => (
                <div key={item.id} style={{ background: 'white', padding: '16px', borderRadius: theme.radius, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid #F59E0B`, marginBottom: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '5px' }}>{item.name}</div>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '5px' }}>📍 {item.address}</div>
                      <div style={{ fontSize: '14px', background: '#FFF7ED', color: '#B45309', display: 'inline-block', padding: '4px 8px', borderRadius: '6px' }}>
                        📅 {item.check_in} - {item.check_out}
                      </div>
                    </div>
                    <button onClick={() => deleteItem('accommodations', item.id)} style={{ border: 'none', background: '#FEF2F2', color: theme.danger, borderRadius: '8px', padding: '5px 10px', marginLeft: '10px' }}>刪除</button>
                  </div>
                </div>
              ))}
              {accommodations.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>尚未新增住宿資料</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App
