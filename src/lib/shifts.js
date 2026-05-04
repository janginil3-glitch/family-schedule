import { supabase } from './supabase'

// 근무 종류 정보
export const SHIFT_TYPES = {
  morning: {
    name: '아침조',
    short: '아침',
    emoji: '🌅',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    dotColor: 'bg-amber-400',
    time: '06:00 ~ 14:00',
  },
  afternoon: {
    name: '오후조',
    short: '오후',
    emoji: '☀️',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    dotColor: 'bg-orange-500',
    time: '14:00 ~ 22:00',
  },
  night: {
    name: '야간조',
    short: '야간',
    emoji: '🌙',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-300',
    dotColor: 'bg-indigo-500',
    time: '22:00 ~ 06:00',
  },
  off: {
    name: '휴무',
    short: '휴무',
    emoji: '🏠',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-200',
    dotColor: 'bg-gray-300',
    time: '쉬는 날',
  },
}

// 두 날짜 사이 일수 차이
const daysBetween = (start, end) => {
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
}

// 날짜에 해당하는 근무 종류 계산
// pattern: ['morning', 'night', 'afternoon'] 순서로 cycle_days 만큼씩 반복
export const getShiftForDate = (dateStr, config) => {
  if (!config || !config.start_date) return null
  
  const diff = daysBetween(config.start_date, dateStr)
  if (diff < 0) return null // 시작일 이전
  
  const cycleLength = config.cycle_days * config.pattern.length
  const positionInCycle = diff % cycleLength
  const patternIndex = Math.floor(positionInCycle / config.cycle_days)
  
  return config.pattern[patternIndex]
}

// 근무 설정 가져오기
export const fetchShiftConfig = async () => {
  const { data } = await supabase.from('shift_config').select('*').eq('id', 1).single()
  return data
}

// 근무 설정 업데이트
export const updateShiftConfig = async (config) => {
  const { error } = await supabase
    .from('shift_config')
    .update({
      start_date: config.start_date,
      pattern: config.pattern,
      cycle_days: config.cycle_days,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
  return !error
}

// 잔업 토글
export const toggleOvertime = async (dateStr) => {
  const { data: existing } = await supabase
    .from('overtime_days')
    .select('id')
    .eq('work_date', dateStr)
    .maybeSingle()
  
  if (existing) {
    await supabase.from('overtime_days').delete().eq('id', existing.id)
  } else {
    await supabase.from('overtime_days').insert({ work_date: dateStr })
  }
}
