import { useState, useEffect } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function QuickTemplates({ category, onSelect, color = 'pink' }) {
  const [templates, setTemplates] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newSubject, setNewSubject] = useState('')

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('quick_templates')
      .select('*')
      .eq('category', category)
      .order('use_count', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setTemplates(data)
  }

  useEffect(() => {
    fetchTemplates()
    const channel = supabase
      .channel(`tmpl-${category}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'quick_templates', filter: `category=eq.${category}` },
        fetchTemplates
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [category])

  const handleSelect = async (t) => {
    await supabase.from('quick_templates').update({ use_count: t.use_count + 1 }).eq('id', t.id)
    onSelect(t)
  }

  const handleAdd = async () => {
    if (!newText.trim()) return
    const data = { category, text: newText.trim() }
    if (category === 'todo' && newTime) data.default_time = newTime
    if (category === 'homework' && newSubject) data.default_subject = newSubject.trim()

    await supabase.from('quick_templates').insert(data)
    setNewText('')
    setNewTime('')
    setNewSubject('')
    setShowAdd(false)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('이 항목을 지울까요?')) return
    await supabase.from('quick_templates').delete().eq('id', id)
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-500">⭐ 자주 쓰는 항목 (눌러서 자동 입력)</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`text-xs px-2 py-1 rounded-lg bg-${color}-100 text-${color}-600 font-bold tap-effect`}
        >
          {showAdd ? '닫기' : '+ 새로 추가'}
        </button>
      </div>

      {/* 칩 목록 */}
      <div className="flex flex-wrap gap-2 mb-2">
        {templates.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">아직 없어요. + 새로 추가로 만들어보세요</p>
        ) : (
          templates.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelect(t)}
              className={`group relative px-3 py-1.5 rounded-full bg-${color}-100 text-${color}-700 text-sm font-bold border-2 border-${color}-200 hover:bg-${color}-200 tap-effect transition-all flex items-center gap-1`}
            >
              <span>{t.text}</span>
              {t.default_time && <span className="text-[10px] opacity-70">{t.default_time.substring(0,5)}</span>}
              {t.default_subject && <span className="text-[10px] opacity-70">[{t.default_subject}]</span>}
              <span
                onClick={(e) => handleDelete(e, t.id)}
                className="opacity-0 group-hover:opacity-100 ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </span>
            </button>
          ))
        )}
      </div>

      {/* 새 템플릿 추가 폼 */}
      {showAdd && (
        <div className={`bg-${color}-50 rounded-2xl p-3 fade-in space-y-2`}>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="자주 쓰는 항목 이름"
            className="cute-input w-full text-sm"
            autoFocus
          />
          {category === 'todo' && (
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="cute-input w-full text-sm"
              placeholder="기본 시간 (선택)"
            />
          )}
          {category === 'homework' && (
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="기본 과목 (예: 국어)"
              className="cute-input w-full text-sm"
            />
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowAdd(false); setNewText(''); }}
              className="cute-button bg-gray-200 text-gray-600 text-xs px-3 py-2"
            >
              취소
            </button>
            <button
              onClick={handleAdd}
              disabled={!newText.trim()}
              className={`cute-button bg-${color}-500 text-white text-xs px-3 py-2 disabled:opacity-50`}
            >
              저장 ✨
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
