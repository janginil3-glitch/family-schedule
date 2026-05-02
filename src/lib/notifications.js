// 알림 소리 재생 (Web Audio API로 부드러운 종소리 생성)
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContext()
    
    // 도-미-솔 화음으로 부드러운 알림음
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = 'sine'
      osc.frequency.value = freq
      
      const startTime = ctx.currentTime + i * 0.15
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8)
      
      osc.start(startTime)
      osc.stop(startTime + 0.8)
    })
  } catch (e) {
    console.log('소리 재생 실패:', e)
  }
}

// 브라우저 알림 권한 요청
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false
  }
  
  if (Notification.permission === 'granted') {
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  
  return false
}

// 푸시 알림 보내기
export const sendNotification = (title, body, withSound = true) => {
  if (withSound) {
    playNotificationSound()
  }
  
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'family-schedule',
    })
    
    setTimeout(() => notification.close(), 5000)
    return notification
  }
}

// 예약된 알림 체크 (1분마다 실행)
export const checkScheduledNotifications = (todos, events) => {
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const currentDate = now.toISOString().split('T')[0]
  
  // 오늘 할 일 중 현재 시각과 일치하는 것
  todos.forEach(todo => {
    if (todo.notify_enabled && !todo.is_done && todo.scheduled_time) {
      const todoTime = todo.scheduled_time.substring(0, 5)
      if (todoTime === currentTime && todo.date === currentDate) {
        sendNotification('🔔 할 일 시간이에요!', todo.title)
      }
    }
  })
  
  // 오늘 일정 중 현재 시각과 일치하는 것
  events.forEach(event => {
    if (event.notify_enabled && event.event_time) {
      const eventTime = event.event_time.substring(0, 5)
      if (eventTime === currentTime && event.event_date === currentDate) {
        sendNotification('📅 일정 알림', event.title)
      }
    }
  })
}
