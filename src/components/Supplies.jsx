import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, Backpack } from 'lucide-react'
import { supabase, FAMILY_MEMBERS, getMember } from '../lib/supabase'
import QuickTemplates from './QuickTemplates'

export default function Supplies({ currentMember }) {
  const [supplies, setSupplies] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [itemName, setItemName] = useState('')
  const [forDate, setForDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMember, setViewMember] = useState(currentMember.id)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const { data } = await supabase
      .from('supplies').select('*')
      .gte('for_date', new Date().toISOString().split('T')[0])
      .order('for_date', { ascending: true })
      .order('is_packed', { ascending: true })
    if (data) setSupplies(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('supplies-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplies' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const handleSubmit = async () => {
    if (!itemName.trim()) return
    await supabase.from('supplies').insert({
      member_id: viewMember,
      item_name: itemName.trim(),
      for_date: forDate,
    })
    setItemName('')
    setShowForm(false)
  }

  const handleTemplateSelect = (template) => {
    setItemName(template.text)
  }

  const togglePacked = async (item) => {
    await supabase.from('supplies').update({ is_packed: !item.is_packed }).eq('id', item.id)
  }

  const handleDelete = async (id) => {
    await supabase.from('supplies').delete().eq('id', id)
  }

  const filtered = supplies.filter(s => s.member_id === viewMember)
  const groupedByDate = filtered.reduce((acc, item) => {
    if (!acc[item.for_date]) acc[item.for_date] = []
    acc[item.for_date].push(item)
    return acc
  }, {})

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    if (dateStr === today) return '🌟 오늘'
    if (dateStr === tomorrow) return '🌙 내일'
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Backpack className="w-7 h-7 text-green-500" />
          <h2 className="text-2xl font-bold font-cute text-green-600">준비물</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="cute-button bg-green-400 text-white">
          <Plus className="w-5 h-5 inline" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {FAMILY_MEMBERS.map(m => (
          <button
            key={m.id}
            onClick={() => setViewMember(m.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl font-bold text-sm tap-effect transition-all ${
              viewMember === m.id
                ? `bg-${m.color}-200 border-2 border-${m.color}-400 scale-105`
                : 'bg-white/60 border-2 border-gray-200'
            }`}
          >
            <span className="mr-1">{m.emoji}</span>{m.name}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="pastel-card p-4 fade-in">
          <p className="text-sm text-gray-500 mb-3">
            {getMember(viewMember)?.emoji} {getMember(viewMember)?.name}의 준비물을 추가해요
          </p>

          <QuickTemplates category="supplies" onSelect={handleTemplateSelect} color="green" />

          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="무엇이 필요한가요? (예: 색종이, 풀)"
            className="cute-input w-full mb-3"
          />
          <input
            type="date"
            value={forDate}
            onChange={(e) => setForDate(e.target.value)}
            className="cute-input w-full mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="cute-button bg-gray-200 text-gray-600">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!itemName.trim()}
              className="cute-button bg-green-500 text-white disabled:opacity-50"
            >
              담기 🎒
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="pastel-card p-8 text-center">
          <div className="text-5xl mb-3">🎒</div>
          <p className="text-gray-500">준비물이 아직 없어요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedByDate).sort().map(date => {
            const items = groupedByDate[date]
            const packed = items.filter(i => i.is_packed).length
            return (
              <div key={date} className="pastel-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-green-600">{formatDate(date)}</h3>
                  <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded-full font-bold">
                    {packed} / {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className={`flex items-center gap-3 ${item.is_packed ? 'opacity-50' : ''}`}>
                      <button
                        onClick={() => togglePacked(item)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 tap-effect transition-all ${
                          item.is_packed ? 'bg-green-400 border-green-400' : 'border-gray-300 hover:border-green-300'
                        }`}
                      >
                        {item.is_packed && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <span className={`flex-1 ${item.is_packed ? 'line-through text-gray-400' : ''}`}>
                        {item.item_name}
                      </span>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
