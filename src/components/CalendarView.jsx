import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Bell, Calendar as CalIcon, X, Settings, Briefcase } from 'lucide-react'
import { supabase, FAMILY_MEMBERS, getMember } from '../lib/supabase'
import { sendNotification } from '../lib/notifications'
import { fetchShiftConfig, getShiftForDate, SHIFT_TYPES, toggleOvertime } from '../lib/shifts'
import ImageUpload from './ImageUpload'
import ShiftSettings from './ShiftSettings'

export default function CalendarView({ currentMember }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [events, setEvents] = useState([])
  const [overtimeDays, setOvertimeDays] = useState([])
  const [shiftConfig, setShiftConfig] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [time, setTime] = useState('')
  const [eventMember, setEventMember] = useState('')
  const [notify, setNotify] = useState(true)
  const [imageUrl, setImageUrl] = useState(null)
  const [zoomImage, setZoomImage] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    const [eventsRes, otRes, cfg] = await Promise.all([
      supabase.from('calendar_events').select('*').order('event_time', { ascending: true, nullsFirst: false }),
      supabase.from('overtime_days').select('*'),
      fetchShiftConfig(),
    ])
    if (eventsRes.data) setEvents(eventsRes.data)
    if (otRes.data) setOvertimeDays(otRes.data.map(d => d.work_date))
    if (cfg) setShiftConfig(cfg)
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    const ch1 = supabase.channel('calendar-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' },
        (payload) => {
          fetchAll()
          if (payload.eventType === 'INSERT') {
            const author = getMember(payload.new.author_id)
            sendNotification(`📅 ${author?.name || '가족'}이(가) 일정 추가`, payload.new.title)
          }
        }
      ).subscribe()
    const ch2 = supabase.channel('overtime-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'overtime_days' }, fetchAll)
      .subscribe()
    const ch3 = supabase.channel('shift-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_config' }, fetchAll)
      .subscribe()
    return () => {
      supabase.removeChannel(ch1)
      supabase.removeChannel(ch2)
      supabase.removeChannel(ch3)
    }
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= lastDate; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    days.push({ day: i, dateStr })
  }

  const getEventsForDate = (dateStr) => events.filter(e => e.event_date === dateStr)
  const isOvertime = (dateStr) => overtimeDays.includes(dateStr)

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !selectedDate) return
    await supabase.from('calendar_events').insert({
      title: title.trim(),
      description: description.trim() || null,
      event_date: selectedDate,
      event_time: time || null,
      member_id: eventMember || null,
      author_id: currentMember.id, // 누가 추가했는지 저장
      notify_enabled: notify,
      image_url: imageUrl,
    })
    setTitle(''); setDescription(''); setTime(''); setEventMember(''); setNotify(true); setImageUrl(null); setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('이 일정을 지울까요?')) return
    await supabase.from('calendar_events').delete().eq('id', id)
  }

  const handleToggleOT = async () => {
    if (!selectedDate) return
    await toggleOvertime(selectedDate)
  }

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const selectedShift = selectedDate && shiftConfig ? getShiftForDate(selectedDate, shiftConfig) : null
  const selectedShiftInfo = selectedShift ? SHIFT_TYPES[selectedShift] : null
  const selectedIsOT = selectedDate ? isOvertime(selectedDate) : false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalIcon className="w-7 h-7 text-orange-500" />
          <h2 className="text-2xl font-bold font-cute text-orange-600">
            {year}년 {monthNames[month]}
          </h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowSettings(true)}
            className="cute-button bg-orange-100 text-orange-700 p-2"
            title="아빠 근무표 설정"
          >
            <Briefcase className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="cute-button bg-orange-200 text-orange-700 p-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="cute-button bg-orange-300 text-orange-800 px-3 text-sm">
            오늘
          </button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="cute-button bg-orange-200 text-orange-700 p-2">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 근무 범례 */}
      {shiftConfig && (
        <div className="pastel-card p-2 flex items-center justify-around text-xs flex-wrap gap-2">
          <span className="font-bold text-gray-600">🌳 아빠:</span>
          {Object.entries(SHIFT_TYPES).filter(([k]) => k !== 'off').map(([key, info]) => (
            <span key={key} className={`flex items-center gap-1 px-2 py-1 rounded-full ${info.bgColor} ${info.textColor} font-bold`}>
              <span>{info.emoji}</span>{info.short}
            </span>
          ))}
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 font-bold">
            ⚡ 잔업
          </span>
        </div>
      )}

      {/* 달력 그리드 */}
      <div className="pastel-card p-2">
        <div className="grid grid-cols-7 mb-1">
          {dayNames.map((day, i) => (
            <div key={day} className={`text-center py-1 text-xs font-bold ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((d, idx) => {
            if (!d) return <div key={idx} className="aspect-[3/4]" />
            const dayEvents = getEventsForDate(d.dateStr)
            const isToday = d.dateStr === todayStr
            const isSelected = d.dateStr === selectedDate
            const dow = (firstDay + d.day - 1) % 7
            const shift = shiftConfig ? getShiftForDate(d.dateStr, shiftConfig) : null
            const shiftInfo = shift ? SHIFT_TYPES[shift] : null
            const ot = isOvertime(d.dateStr)

            return (
              <button
                key={d.dateStr}
                onClick={() => handleDateClick(d.dateStr)}
                className={`aspect-[3/4] rounded-xl p-0.5 flex flex-col items-center transition-all tap-effect relative overflow-hidden ${
                  isSelected ? 'bg-orange-300 ring-2 ring-orange-500 scale-105'
                  : isToday ? 'bg-orange-100 border-2 border-orange-400'
                  : shiftInfo ? `${shiftInfo.bgColor} border ${shiftInfo.borderColor}`
                  : 'bg-white/60 border border-gray-100'
                }`}
              >
                {/* 잔업 표시 */}
                {ot && (
                  <span className="absolute top-0 right-0.5 text-[8px] text-red-600 font-bold">⚡</span>
                )}

                {/* 날짜 */}
                <span className={`text-xs font-bold leading-tight ${
                  isSelected ? 'text-white'
                  : dow === 0 ? 'text-red-500'
                  : dow === 6 ? 'text-blue-500'
                  : 'text-gray-700'
                }`}>
                  {d.day}
                </span>

                {/* 근무 표시 */}
                {shiftInfo && !isSelected && (
                  <span className={`text-[8px] font-bold ${shiftInfo.textColor} leading-none`}>
                    {shiftInfo.short}
                  </span>
                )}

                {/* 일정 점 */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-auto flex-wrap justify-center pb-0.5">
                    {dayEvents.slice(0, 3).map((e, i) => {
                      const member = getMember(e.member_id) || getMember(e.author_id)
                      return (
                        <div key={i} className={`w-1 h-1 rounded-full ${member ? `bg-${member.color}-500` : 'bg-orange-500'}`} />
                      )
                    })}
                    {dayEvents.length > 3 && <span className="text-[7px] text-gray-500">+</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 선택된 날짜 */}
      {selectedDate && (
        <div className="pastel-card p-4 fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-orange-600">
              📅 {new Date(selectedDate).getMonth() + 1}월 {new Date(selectedDate).getDate()}일
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setShowForm(!showForm)} className="cute-button bg-orange-400 text-white text-sm">
                <Plus className="w-4 h-4 inline" /> 추가
              </button>
              <button onClick={() => { setSelectedDate(null); setShowForm(false); }} className="cute-button bg-gray-200 text-gray-600 p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 아빠 근무 정보 + 잔업 토글 */}
          {selectedShiftInfo && (
            <div className={`rounded-2xl p-3 mb-3 ${selectedShiftInfo.bgColor} border-2 ${selectedShiftInfo.borderColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-bold text-sm ${selectedShiftInfo.textColor}`}>
                    🌳 아빠 {selectedShiftInfo.emoji} {selectedShiftInfo.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{selectedShiftInfo.time}</p>
                </div>
                <button
                  onClick={handleToggleOT}
                  className={`cute-button text-xs px-3 py-1.5 ${
                    selectedIsOT
                      ? 'bg-red-500 text-white'
                      : 'bg-white border-2 border-red-200 text-red-600'
                  }`}
                >
                  ⚡ {selectedIsOT ? '잔업 취소' : '잔업 표시'}
                </button>
              </div>
            </div>
          )}

          {/* 일정 추가 폼 */}
          {showForm && (
            <div className="bg-orange-50 rounded-2xl p-3 mb-3 fade-in">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="일정 제목"
                className="cute-input w-full mb-2 text-sm"
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="자세한 내용 (선택)"
                className="cute-input w-full mb-2 text-sm min-h-[60px] resize-none"
              />
              <div className="flex gap-2 mb-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="cute-input flex-1 text-sm"
                />
                <select
                  value={eventMember}
                  onChange={(e) => setEventMember(e.target.value)}
                  className="cute-input flex-1 text-sm"
                >
                  <option value="">전체</option>
                  {FAMILY_MEMBERS.map(m => (
                    <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
                  ))}
                </select>
              </div>
              <ImageUpload value={imageUrl} onChange={setImageUrl} color="orange" />
              <label className="flex items-center gap-2 mb-2 text-sm">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <Bell className="w-4 h-4 text-orange-400" />
                <span>알림 받기</span>
              </label>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setImageUrl(null); }} className="cute-button bg-gray-200 text-gray-600 text-sm">
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="cute-button bg-orange-500 text-white text-sm disabled:opacity-50"
                >
                  저장 ✨
                </button>
              </div>
            </div>
          )}

          {/* 일정 목록 */}
          {selectedEvents.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">이 날에는 일정이 없어요</div>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(event => {
                const member = event.member_id ? getMember(event.member_id) : null
                const author = event.author_id ? getMember(event.author_id) : null
                return (
                  <div key={event.id} className="bg-white rounded-2xl p-3 border border-orange-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {member && <span className="text-lg">{member.emoji}</span>}
                          <span className="font-bold text-gray-800">{event.title}</span>
                        </div>
                        {event.description && <p className="text-sm text-gray-600 mb-1">{event.description}</p>}
                        {event.image_url && (
                          <img
                            src={event.image_url}
                            alt="일정 사진"
                            onClick={() => setZoomImage(event.image_url)}
                            className="rounded-xl max-h-40 mt-2 mb-1 cursor-pointer hover:opacity-90 border border-gray-200"
                          />
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                          {event.event_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{event.event_time.substring(0, 5)}
                            </span>
                          )}
                          {event.notify_enabled && <Bell className="w-3 h-3 text-orange-400" />}
                          {member && (
                            <span className={`px-2 py-0.5 bg-${member.color}-100 text-${member.color}-700 rounded-full font-bold`}>
                              {member.name}
                            </span>
                          )}
                          {author && (
                            <span className="text-[10px] text-gray-400">
                              ✏️ {author.emoji} {author.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(event.id)} className="text-gray-300 hover:text-red-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <p className="text-center text-sm text-gray-400 py-2">날짜를 눌러 일정을 추가해보세요 🌸</p>
      )}

      {zoomImage && (
        <div onClick={() => setZoomImage(null)} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer">
          <img src={zoomImage} alt="크게 보기" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}

      {showSettings && <ShiftSettings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
