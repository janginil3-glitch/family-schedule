import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 가족 구성원 정보
export const FAMILY_MEMBERS = [
  { id: 'eungyeol', name: '은결', emoji: '🦁', color: 'eungyeol', isChild: true },
  { id: 'nagyeom', name: '나겸', emoji: '🐰', color: 'nagyeom', isChild: true },
  { id: 'mom', name: '엄마', emoji: '🌸', color: 'mom', isChild: false },
  { id: 'dad', name: '아빠', emoji: '🌳', color: 'dad', isChild: false },
]

export const getMember = (id) => FAMILY_MEMBERS.find(m => m.id === id)
