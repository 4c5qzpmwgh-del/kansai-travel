import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 👇 這裡非常重要！請把您的網址和 Key 貼在單引號 ' ' 中間
const supabaseUrl = 'https://wqwazukgsahnbmrjfihj.supabase.co'
const supabaseKey = 'sb_publishable_EHxsxvA9fn8Gq8LMMndhQw_68lr1qXv'

const supabase = createClient(supabaseUrl, supabaseKey)

function App() {
  const [plans, setPlans] = useState([])
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    fetchPlans()
    // 開啟即時監聽 (Realtime)
    const channel = supabase
      .channel('realtime plans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, (payload) => {
        console.log('有人修改行程了！', payload)
        fetchPlans()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchPlans() {
    let { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: true })
      
    if (error) console.error('讀取失敗:', error)
    else setPlans(data || [])
  }

  async function addPlan() {
    if (!inputValue) return
    const { error } = await supabase.from('plans').insert([{ content: inputValue }])
    if (error) alert('新增失敗！請檢查 URL/Key 或 RLS 設定')
    else setInputValue('')
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>✈️ 旅遊行程表 (多人協作版)</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          placeholder="輸入行程 (例如: 14:00 淺草寺)"
          style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={addPlan} 
          style={{ padding: '10px 20px', fontSize: '16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          新增
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {plans.map(plan => (
          <li key={plan.id} style={{ padding: '15px', borderBottom: '1px solid #eee', background: '#f9f9f9', marginBottom: '5px', borderRadius: '5px' }}>
            {plan.content}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App