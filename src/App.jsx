import { useState, useEffect } from 'react'
import { Megaphone, ListChecks, BookOpen, Backpack, Calendar, Bell } from 'lucide-react'
import { FAMILY_MEMBERS } from './lib/supabase'
import { requestNotificationPermission, checkScheduledNotifications } from './lib/notifications'
import { supabase } from './lib/supabase'

import Announcements from './components/Announcements'
import Todos from './components/Todos'
import Homework from './components/Homework'
import Supplies from './components/Supplies'
import CalendarView from './components/CalendarView'
import MemberSelector from './components/MemberSelector'

const TABS = [
  { id: 'announcements', name: '전달사항', icon: Megaphone, color: 'text-pink-500' },
  { id: 'todos', name: '오늘 할 일', icon: ListChecks, color: 'text-blue-500' },
  { id: 'homework', name: '숙제', icon: BookOpen, color: 'text-purple-500' },
  { id: 'supplies', name: '준비물', icon: Backpack, color: 'text-green-500' },
  { id: 'calendar', name: '달력', icon: Calendar, color: 'text-orange-500' },
]

function App() {
  const [activeTab, setActiveTab] = useState('announcements')
  const [currentMember, setCurrentMember] = useState(null)
  const [notifPermission, setNotifPermission] = useState(false)

  // 저장된 사용자 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('current_member')
    if (saved) {
      const member = FAMILY_MEMBERS.find(m => m.id === saved)
      if (member) setCurrentMember(member)
    }
  }, [])

  // 알림 권한 요청
  useEffect(() => {
    requestNotificationPermission().then(setNotifPermission)
  }, [])

  // 1분마다 알림 체크
  useEffect(() => {
    const checkNotif = async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('date', today)
      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('event_date', today)
      
      checkScheduledNotifications(todos || [], events || [])
    }
    
    const interval = setInterval(checkNotif, 60000) // 1분마다
    return () => clearInterval(interval)
  }, [])

  const handleSelectMember = (member) => {
    setCurrentMember(member)
    localStorage.setItem('current_member', member.id)
  }

  // 사용자 선택 안 했으면 선택 화면
  if (!currentMember) {
    return <MemberSelector onSelect={handleSelectMember} />
  }

  // 아이가 아닌 경우 숙제 탭 숨김 (보기 가능, 편집은 자녀만)
  const visibleTabs = TABS

  return (
    <div className="min-h-screen pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b-2 border-pink-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <h1 className="text-lg font-bold text-pink-600 font-cute">우리가족 스케줄</h1>
          </div>
          <button
            onClick={() => setCurrentMember(null)}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl bg-${currentMember.color}-100 border-2 border-${currentMember.color}-200 tap-effect`}
          >
            <span className="text-xl">{currentMember.emoji}</span>
            <span className="font-bold text-sm">{currentMember.name}</span>
          </button>
        </div>
        {!notifPermission && (
          <div className="max-w-2xl mx-auto mt-2 px-3 py-2 bg-yellow-100 rounded-xl text-xs text-yellow-700 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>알림을 받으려면 위쪽 알림 허용을 해주세요!</span>
          </div>
        )}
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="fade-in">
          {activeTab === 'announcements' && <Announcements currentMember={currentMember} />}
          {activeTab === 'todos' && <Todos currentMember={currentMember} />}
          {activeTab === 'homework' && <Homework currentMember={currentMember} />}
          {activeTab === 'supplies' && <Supplies currentMember={currentMember} />}
          {activeTab === 'calendar' && <CalendarView currentMember={currentMember} />}
        </div>
      </main>

      {/* 하단 탭 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-pink-100 px-2 py-2 z-30">
        <div className="max-w-2xl mx-auto flex justify-around">
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all tap-effect ${
                  isActive ? 'bg-pink-100 scale-105' : ''
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? tab.color : 'text-gray-400'}`} />
                <span className={`text-[10px] font-bold ${isActive ? tab.color : 'text-gray-400'}`}>
                  {tab.name}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default App
