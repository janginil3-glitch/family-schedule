import { useState, useEffect } from 'react'
import { X, Settings } from 'lucide-react'
import { fetchShiftConfig, updateShiftConfig, SHIFT_TYPES } from '../lib/shifts'

export default function ShiftSettings({ onClose }) {
  const [config, setConfig] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [pattern, setPattern] = useState(['morning', 'night', 'afternoon'])
  const [cycleDays, setCycleDays] = useState(7)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchShiftConfig().then(c => {
      if (c) {
        setConfig(c)
        setStartDate(c.start_date)
        setPattern(c.pattern || ['morning', 'night', 'afternoon'])
        setCycleDays(c.cycle_days || 7)
      }
    })
  }, [])

  const handleChangeShift = (idx, value) => {
    const newPattern = [...pattern]
    newPattern[idx] = value
    setPattern(newPattern)
  }

  const handleAddShift = () => {
    if (pattern.length < 5) setPattern([...pattern, 'off'])
  }

  const handleRemoveShift = (idx) => {
    if (pattern.length > 1) {
      setPattern(pattern.filter((_, i) => i !== idx))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const ok = await updateShiftConfig({
      start_date: startDate,
      pattern,
      cycle_days: cycleDays,
    })
    setSaving(false)
    if (ok) {
      alert('저장되었어요! ✨')
      onClose()
    } else {
      alert('저장 실패 😢')
    }
  }

  if (!config) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="bg-orange-100 p-4 flex items-center justify-between sticky top-0">
          <h2 className="text-lg font-bold text-orange-700 font-cute flex items-center gap-2">
            <Settings className="w-5 h-5" />
            🌳 아빠 근무표 설정
          </h2>
          <button onClick={onClose} className="cute-button bg-white/80 text-gray-600 p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">📅 시작 기준일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="cute-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">이 날짜부터 첫 번째 근무가 시작돼요</p>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">⏰ 한 근무당 일수</label>
            <input
              type="number"
              min="1"
              max="14"
              value={cycleDays}
              onChange={(e) => setCycleDays(parseInt(e.target.value) || 7)}
              className="cute-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">예: 5 = 5일씩, 7 = 일주일씩</p>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">🔄 반복 순서</label>
            <div className="space-y-2">
              {pattern.map((shift, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-sm text-gray-500 w-6 self-center">{idx + 1}.</span>
                  <select
                    value={shift}
                    onChange={(e) => handleChangeShift(idx, e.target.value)}
                    className="cute-input flex-1 text-sm"
                  >
                    {Object.entries(SHIFT_TYPES).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.emoji} {info.name}
                      </option>
                    ))}
                  </select>
                  {pattern.length > 1 && (
                    <button
                      onClick={() => handleRemoveShift(idx)}
                      className="cute-button bg-red-100 text-red-600 px-3"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pattern.length < 5 && (
              <button
                onClick={handleAddShift}
                className="mt-2 cute-button bg-orange-100 text-orange-700 text-sm w-full"
              >
                + 단계 추가
              </button>
            )}
          </div>

          <div className="bg-orange-50 rounded-2xl p-3 text-xs text-gray-600">
            <strong className="text-orange-700">미리보기</strong>
            <p className="mt-1">
              {startDate}부터 {cycleDays}일씩{' '}
              {pattern.map(s => SHIFT_TYPES[s]?.short).join(' → ')}{' '}
              순서로 반복돼요
            </p>
          </div>

          <div className="flex gap-2 sticky bottom-0 bg-white pt-3">
            <button onClick={onClose} className="cute-button bg-gray-200 text-gray-600 flex-1">
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="cute-button bg-orange-500 text-white flex-1 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장 ✨'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
