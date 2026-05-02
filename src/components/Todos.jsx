import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, Clock, Bell, BellOff, ListChecks } from 'lucide-react'
import { supabase, FAMILY_MEMBERS, getMember } from '../lib/supabase'

export default function Todos({ currentMember }) {
  const [todos, setTodos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [notify, setNotify] = useState(true)
  const [viewMember, setViewMember] = useState(currentMember.id)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  const fetchData = async () => {
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('date', today)
      .order('scheduled_time', { ascending: true, nullsFirst: false })
    
    if (data) setTodos(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('todos-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const handleSubmit = async () => {
    if (!title.trim()) return
    
    await supabase.from('todos').insert({
      member_id: viewMember,
      title: title.trim(),
      scheduled_time: time || null,
      date: today,
      notify_enabled: notify,
    })
    
    setTitle('')
    setTime('')
    setNotify(true)
    setShowForm(false)
  }

  const toggleDone = async (todo) => {
    await supabase
      .from('todos')
      .update({ is_done: !todo.is_done })
      .eq('id', todo.id)
  }

  const handleDelete = async (id) => {
    await supabase.from('todos').delete().eq('id', id)
  }

  const memberTodos = todos.filter(t => t.member_id === viewMember)
  const doneCount = memberTodos.filter(t => t.is_done).length

  return (
    <div className="space-y-4">
      {/* 타이틀 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="w-7 h-7 text-blue-500" />
          <h2 className="text-2xl font-bold font-cute text-blue-600">오늘 할 일</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="cute-button bg-blue-400 text-white"
        >
          <Plus className="w-5 h-5 inline" />
        </button>
      </div>

      {/* 가족 구성원 선택 */}
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
            <span className="mr-1">{m.emoji}</span>
            {m.name}
          </button>
        ))}
      </div>

      {/* 진행률 */}
      {memberTodos.length > 0 && (
        <div className="pastel-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-600">
              {getMember(viewMember)?.emoji} {getMember(viewMember)?.name}의 오늘
            </span>
            <span className="text-sm font-bold text-blue-500">
              {doneCount} / {memberTodos.length} 완료
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-300 to-blue-500 h-full transition-all duration-500"
              style={{ width: `${memberTodos.length ? (doneCount / memberTodos.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* 작성 폼 */}
      {showForm && (
        <div className="pastel-card p-4 fade-in">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="무엇을 해야하나요?"
            className="cute-input w-full mb-3"
            autoFocus
          />
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="cute-input flex-1"
            />
          </div>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="w-5 h-5 accent-blue-500"
            />
            <Bell className="w-4 h-4 text-blue-400" />
            <span className="text-sm">시간 되면 알림 받기</span>
          </label>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="cute-button bg-gray-200 text-gray-600">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="cute-button bg-blue-500 text-white disabled:opacity-50"
            >
              추가하기 ✨
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : memberTodos.length === 0 ? (
        <div className="pastel-card p-8 text-center">
          <div className="text-5xl mb-3">☀️</div>
          <p className="text-gray-500">오늘 할 일이 없어요!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {memberTodos.map(todo => (
            <div
              key={todo.id}
              className={`pastel-card p-4 flex items-center gap-3 transition-all ${
                todo.is_done ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => toggleDone(todo)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 tap-effect transition-all ${
                  todo.is_done
                    ? 'bg-blue-400 border-blue-400'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                {todo.is_done && <Check className="w-5 h-5 text-white" />}
              </button>

              <div className="flex-1">
                <div className={`font-bold ${todo.is_done ? 'line-through text-gray-400' : ''}`}>
                  {todo.title}
                </div>
                {todo.scheduled_time && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {todo.scheduled_time.substring(0, 5)}
                    {todo.notify_enabled ? (
                      <Bell className="w-3 h-3 ml-1 text-blue-400" />
                    ) : (
                      <BellOff className="w-3 h-3 ml-1" />
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDelete(todo.id)}
                className="text-gray-300 hover:text-red-400 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
