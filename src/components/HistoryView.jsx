import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Save } from 'lucide-react'
import { supabase, FAMILY_MEMBERS, getMember } from '../lib/supabase'

// 주간 히스토리 모달
export default function HistoryView({ category, onClose }) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    const day = d.getDay() // 0=일 1=월 ...
    const diff = day === 0 ? -6 : 1 - day // 월요일 시작
    d.setDate(d.getDate() + diff)
    d.setHours(0,0,0,0)
    return d
  })
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  const tableMap = {
    todos: { table: 'todos', dateField: 'date' },
    homework: { table: 'homework', dateField: 'due_date' },
    supplies: { table: 'supplies', dateField: 'for_date' },
  }

  const titleMap = {
    todos: '오늘 할 일 기록',
    homework: '숙제 기록',
    supplies: '준비물 기록',
  }

  const colorMap = {
    todos: 'blue',
    homework: 'purple',
    supplies: 'green',
  }

  const color = colorMap[category]

  // 주의 7일 날짜 만들기
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    days.push(d)
  }

  const fmtDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }

  const fetchData = async () => {
    setLoading(true)
    const { table, dateField } = tableMap[category]
    const startStr = fmtDate(days[0])
    const endStr = fmtDate(days[6])
    
    const { data: rows } = await supabase
      .from(table)
      .select('*')
      .gte(dateField, startStr)
      .lte(dateField, endStr)
      .order(dateField, { ascending: true })
    
    // 날짜별로 그룹핑
    const grouped = {}
    if (rows) {
      rows.forEach(row => {
        const date = row[dateField]
        if (!grouped[date]) grouped[date] = []
        grouped[date].push(row)
      })
    }
    setData(grouped)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [weekStart, category])

  const moveWeek = (delta) => {
    const newStart = new Date(weekStart)
    newStart.setDate(newStart.getDate() + delta * 7)
    setWeekStart(newStart)
  }

  const dayNames = ['월', '화', '수', '목', '금', '토', '일']
  const todayStr = fmtDate(new Date())

  // 항목 표시
  const renderItem = (item) => {
    if (category === 'todos') {
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className={item.is_done ? '✅' : '⬜'}>
            {item.is_done ? '✅' : '⬜'}
          </span>
          <span className={item.is_done ? 'line-through text-gray-400' : ''}>
            {item.scheduled_time && (
              <span className="text-gray-500 text-xs mr-1">
                {item.scheduled_time.substring(0, 5)}
              </span>
            )}
            {item.title}
          </span>
        </div>
      )
    }
    if (category === 'homework') {
      return (
        <div className="flex items-start gap-2 text-sm">
          <span>{item.is_done ? '✅' : '⬜'}</span>
          <div className="flex-1">
            <span className={`px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold mr-1`}>
              {item.subject}
            </span>
            <span className={item.is_done ? 'line-through text-gray-400' : ''}>
              {item.content}
            </span>
          </div>
        </div>
      )
    }
    if (category === 'supplies') {
      return (
        <div className="flex items-center gap-2 text-sm">
          <span>{item.is_packed ? '✅' : '⬜'}</span>
          <span className={item.is_packed ? 'line-through text-gray-400' : ''}>
            {item.item_name}
          </span>
        </div>
      )
    }
  }

  // 가족별로 그룹핑
  const renderDayItems = (items) => {
    const byMember = {}
    items.forEach(it => {
      const mid = it.member_id
      if (!byMember[mid]) byMember[mid] = []
      byMember[mid].push(it)
    })

    return Object.entries(byMember).map(([memberId, memberItems]) => {
      const member = getMember(memberId)
      if (!member) return null
      return (
        <div key={memberId} className="mb-2">
          <div className="text-xs font-bold text-gray-500 mb-1">
            {member.emoji} {member.name}
          </div>
          <div className="space-y-1 pl-2">
            {memberItems.map((it, i) => (
              <div key={i}>{renderItem(it)}</div>
            ))}
          </div>
        </div>
      )
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className={`bg-${color}-100 p-4 flex items-center justify-between`}>
          <h2 className={`text-lg font-bold text-${color}-700 font-cute`}>
            📅 {titleMap[category]}
          </h2>
          <button onClick={onClose} className="cute-button bg-white/80 text-gray-600 p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 주 이동 */}
        <div className="flex items-center justify-between p-3 bg-white border-b">
          <button onClick={() => moveWeek(-1)} className={`cute-button bg-${color}-100 text-${color}-700 p-2`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-bold text-gray-700">
            {weekStart.getMonth() + 1}월 {weekStart.getDate()}일 ~ {days[6].getMonth() + 1}월 {days[6].getDate()}일
          </div>
          <button onClick={() => moveWeek(1)} className={`cute-button bg-${color}-100 text-${color}-700 p-2`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 주간 카드 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-12 text-gray-400">불러오는 중...</div>
          ) : (
            days.map((d, i) => {
              const dateStr = fmtDate(d)
              const items = data[dateStr] || []
              const isToday = dateStr === todayStr
              const dow = d.getDay()
              return (
                <div
                  key={dateStr}
                  className={`pastel-card p-3 ${
                    isToday ? `border-${color}-400 bg-${color}-50/60` : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
                      }`}>
                        {d.getMonth() + 1}/{d.getDate()} ({dayNames[i]})
                      </span>
                      {isToday && (
                        <span className={`text-xs px-2 py-0.5 bg-${color}-200 text-${color}-700 rounded-full font-bold`}>
                          오늘
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {items.length > 0 ? `${items.length}개` : '없음'}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-2">기록 없음</p>
                  ) : (
                    renderDayItems(items)
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
