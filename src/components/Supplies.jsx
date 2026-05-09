import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, Backpack, History, Pencil, X } from 'lucide-react'
import { supabase, FAMILY_MEMBERS, getMember } from '../lib/supabase'
import QuickTemplates from './QuickTemplates'
import HistoryView from './HistoryView'
import Comments from './Comments'

export default function Supplies({ currentMember }) {
  const [supplies, setSupplies] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [itemName, setItemName] = useState('')
  const [forDate, setForDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMember, setViewMember] = useState(currentMember.id)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)

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

  const resetForm = () => {
    setItemName('')
    setForDate(new Date().toISOString().split('T')[0])
    setShowForm(false)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!itemName.trim()) return

    if (editingId) {
      await supabase.from('supplies').update({
        item_name: itemName.trim(),
        for_date: forDate,
      }).eq('id', editingId)
    } else {
      await supabase.from('supplies').insert({
        member_id: viewMember,
        item_name: itemName.trim(),
        for_date: forDate,
        confirmed_by: [],
      })
    }
    resetForm()
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setItemName(item.item_name)
    setForDate(item.for_date)
    setShowForm(true)
  }

  const handleTemplateSelect = (template) => {
    setItemName(template.text)
  }

  const togglePacked = async (item) => {
    await supabase.from('supplies').update({ is_packed: !item.is_packed }).eq('id', item.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 지울까요?')) return
    await supabase.from('supplies').delete().eq('id', id)
  }

  const handleToggleConfirm = async (item) => {
    const confirmedBy = Array.isArray(item.confirmed_by) ? item.confirmed_by : []
    const alreadyConfirmed = confirmedBy.some(c => c.member_id === currentMember.id)

    let newConfirmedBy
    if (alreadyConfirmed) {
      newConfirmedBy = confirmedBy.filter(c => c.member_id !== currentMember.id)
    } else {
      newConfirmedBy = [
        ...confirmedBy,
        { member_id: currentMember.id, confirmed_at: new Date().toISOString() }
      ]
    }

    await supabase
      .from('supplies')
      .update({ confirmed_by: newConfirmedBy })
      .eq('id', item.id)
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="cute-button bg-green-100 text-green-700 text-sm flex items-center gap-1"
          >
            <History className="w-4 h-4" /> 기록
          </button>
          <button
            onClick={() => {
              if (showForm) resetForm()
              else setShowForm(true)
            }}
            className="cute-button bg-green-400 text-white"
          >
            <Plus className="w-5 h-5 inline" />
          </button>
        </div>
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-green-600 font-bold">
              {editingId ? '✏️ 준비물 수정하기' : `${getMember(viewMember)?.emoji} ${getMember(viewMember)?.name}의 준비물 추가`}
            </p>
            {editingId && (
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {!editingId && <QuickTemplates category="supplies" onSelect={handleTemplateSelect} color="green" />}
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
            <button onClick={resetForm} className="cute-button bg-gray-200 text-gray-600">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!itemName.trim()}
              className="cute-button bg-green-500 text-white disabled:opacity-50"
            >
              {editingId ? '저장하기 💾' : '담기 🎒'}
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
          <button
            onClick={() => setShowHistory(true)}
            className="mt-3 text-sm text-green-500 underline"
          >
            지난 기록 보기
          </button>
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
                <div className="space-y-3">
                  {items.map(item => {
                    const confirmedBy = Array.isArray(item.confirmed_by) ? item.confirmed_by : []
                    const isConfirmedByMe = confirmedBy.some(c => c.member_id === currentMember.id)
                    return (
                      <div key={item.id} className={`bg-white/60 rounded-2xl p-3 border border-green-100 ${item.is_packed ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-3">
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
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-gray-400 hover:text-green-500 p-1"
                            title="수정"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-400 p-1" title="삭제">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 확인 영역 */}
                        <div className="mt-2 pt-2 border-t border-green-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {confirmedBy.length === 0 ? (
                              <span className="text-[10px] text-gray-400">아직 확인 안 함</span>
                            ) : (
                              <>
                                <span className="text-[10px] text-gray-500 mr-1">확인:</span>
                                {confirmedBy.map(c => {
                                  const m = getMember(c.member_id)
                                  if (!m) return null
                                  return (
                                    <span
                                      key={c.member_id}
                                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-${m.color}-100 text-${m.color}-700 border border-${m.color}-200`}
                                      title={new Date(c.confirmed_at).toLocaleString('ko-KR')}
                                    >
                                      <span>{m.emoji}</span>
                                      <span>{m.name}</span>
                                      <Check className="w-2.5 h-2.5" />
                                    </span>
                                  )
                                })}
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => handleToggleConfirm(item)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full tap-effect flex items-center gap-1 ${
                              isConfirmedByMe
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-green-400 text-white'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            {isConfirmedByMe ? '확인 취소' : '확인했어요'}
                          </button>
                        </div>

                        {/* 댓글 영역 */}
                        <Comments
                          parentTable="supplies"
                          parentId={item.id}
                          currentMember={currentMember}
                          themeColor="green"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showHistory && <HistoryView category="supplies" onClose={() => setShowHistory(false)} />}
    </div>
  )
}
