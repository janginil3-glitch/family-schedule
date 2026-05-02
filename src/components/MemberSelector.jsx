import { FAMILY_MEMBERS } from '../lib/supabase'

export default function MemberSelector({ onSelect }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce-slow">🏠</div>
          <h1 className="text-3xl font-bold text-pink-600 font-cute mb-2">우리가족 스케줄</h1>
          <p className="text-gray-600">누구로 들어갈까요?</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {FAMILY_MEMBERS.map(member => (
            <button
              key={member.id}
              onClick={() => onSelect(member)}
              className={`pastel-card p-6 hover:scale-105 transition-transform tap-effect bg-${member.color}-50 border-${member.color}-200`}
              style={{
                background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
              }}
            >
              <div className="text-5xl mb-3">{member.emoji}</div>
              <div className="font-bold text-xl font-cute">{member.name}</div>
              {member.isChild && (
                <div className="text-xs text-gray-500 mt-1">어린이</div>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          한 번 선택하면 다음에는 자동으로 들어가요 ✨
        </p>
      </div>
    </div>
  )
}
