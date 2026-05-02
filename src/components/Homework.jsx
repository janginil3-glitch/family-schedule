import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, BookOpen, Lock } from 'lucide-react'
import { supabase, getMember } from '../lib/supabase'
import QuickTemplates from './QuickTemplates'
import ImageUpload from './ImageUpload'

const CHILDREN = [
  { id: 'eungyeol', name: '은결', emoji: '🦁', color: 'eungyeol' },
  { id: 'nagyeom', name: '나겸', emoji: '🐰', color: 'nagyeom' },
]

export default function Homework({ currentMember }) {
  const [homework, setHomework] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [zoomImage, setZoomImage] = useState(null)
  const [viewChild, setViewChild] = useState(currentMember.isChild ? currentMember.id : 'eungyeol')
  const [loading, setLoading] = useState(true)

  const canEdit = currentMember.isChild

  const fetchData = async () => {
    const { data } = await supabase
      .from('homework').select('*')
      .order('is_done', { ascending: true })
      .order('created_at', { ascending: false })
    if (data) setHomework(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('homework-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const handleSubmit = async () => {
    if (!subject.trim() || (!content.trim() && !imageUrl)) return
    await supabase.from('homework').insert({
      member_id: currentMember.id,
      subject: subject.trim(),
      content: content.trim() || '(사진 참고)',
      image_url: imageUrl,
    })
    setSubject('')
    setContent('')
    setImageUrl(null)
    setShowForm(false)
  }

  const handleTemplateSelect = (template) => {
    setContent(template.text)
    if (template.default_subject) setSubject(template.default_subject)
  }

  const toggleDone = async (hw) => {
    if (!canEdit && hw.member_id !== currentMember.id) return
    await supabase.from('homework').update({ is_done: !hw.is_done }).eq('id', hw.id)
  }

  const handleDelete = async (id) => {
    await supabase.from('homework').delete().eq('id', id)
  }

  const filtered = homework.filter(h => h.member_id === viewChild)
  const doneCount = filtered.filter(h => h.is_done).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-purple-500" />
          <h2 className="text-2xl font-bold font-cute text-purple-600">숙제</h2>
        </div>
        {canEdit ? (
          <button onClick={() => setShowForm(!showForm)} className="cute-button bg-purple-400 text-white">
            <Plus className="w-5 h-5 inline" />
          </button>
        ) : (
          <div className="flex items-center gap-1 text-xs text-gray-400 px-3 py-2 bg-gray-100 rounded-2xl">
            <Lock className="w-3 h-3" />보기만 가능
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {CHILDREN.map(c => (
          <button
            key={c.id}
            onClick={() => setViewChild(c.id)}
            className={`flex-1 px-4 py-3 rounded-2xl font-bold tap-effect transition-all ${
              viewChild === c.id
                ? `bg-${c.color}-200 border-2 border-${c.color}-400 scale-105`
                : 'bg-white/60 border-2 border-gray-200'
            }`}
          >
            <span className="text-2xl mr-1">{c.emoji}</span>{c.name}
          </button>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="pastel-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-600">{getMember(viewChild)?.name}의 숙제</span>
            <span className="text-sm font-bold text-purple-500">{doneCount} / {filtered.length} 완료</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-300 to-purple-500 h-full transition-all duration-500"
              style={{ width: `${filtered.length ? (doneCount / filtered.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {showForm && canEdit && (
        <div className="pastel-card p-4 fade-in">
          <p className="text-sm text-gray-500 mb-3">
            {currentMember.emoji} {currentMember.name}의 숙제를 추가해요
          </p>

          <QuickTemplates category="homework" onSelect={handleTemplateSelect} color="purple" />

          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="과목 (예: 국어, 수학)"
            className="cute-input w-full mb-2"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="무엇을 해야하나요? (사진만 올려도 OK)"
            className="cute-input w-full min-h-[80px] resize-none mb-3"
          />
          <ImageUpload value={imageUrl} onChange={setImageUrl} color="purple" />
          <div className="flex gap-2 justify-end mt-3">
            <button
              onClick={() => { setShowForm(false); setSubject(''); setContent(''); setImageUrl(null); }}
              className="cute-button bg-gray-200 text-gray-600"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!subject.trim() || (!content.trim() && !imageUrl)}
              className="cute-button bg-purple-500 text-white disabled:opacity-50"
            >
              추가하기 📝
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="pastel-card p-8 text-center">
          <div className="text-5xl mb-3">📚</div>
          <p className="text-gray-500">아직 숙제가 없어요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(hw => (
            <div key={hw.id} className={`pastel-card p-4 flex items-start gap-3 ${hw.is_done ? 'opacity-60' : ''}`}>
              <button
                onClick={() => toggleDone(hw)}
                disabled={!canEdit}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 tap-effect transition-all mt-1 ${
                  hw.is_done ? 'bg-purple-400 border-purple-400' : 'border-gray-300 hover:border-purple-300'
                } ${!canEdit ? 'cursor-not-allowed' : ''}`}
              >
                {hw.is_done && <Check className="w-5 h-5 text-white" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    {hw.subject}
                  </span>
                </div>
                <div className={`mb-2 ${hw.is_done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {hw.content}
                </div>
                {hw.image_url && (
                  <img
                    src={hw.image_url}
                    alt="숙제 사진"
                    onClick={() => setZoomImage(hw.image_url)}
                    className="rounded-xl max-h-48 cursor-pointer hover:opacity-90 border border-gray-200"
                  />
                )}
              </div>
              {canEdit && hw.member_id === currentMember.id && (
                <button onClick={() => handleDelete(hw.id)} className="text-gray-300 hover:text-red-400 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={zoomImage} alt="크게 보기" className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </div>
  )
}
