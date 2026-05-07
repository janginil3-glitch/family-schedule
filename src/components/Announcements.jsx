import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertCircle, Megaphone, Check } from 'lucide-react'
import { supabase, getMember } from '../lib/supabase'
import { sendNotification } from '../lib/notifications'
import ImageUpload from './ImageUpload'

export default function Announcements({ currentMember }) {
  const [announcements, setAnnouncements] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [zoomImage, setZoomImage] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('is_important', { ascending: false })
      .order('created_at', { ascending: false })
    if (!error && data) setAnnouncements(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('announcements-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          fetchData()
          if (payload.eventType === 'INSERT' && payload.new.author_id !== currentMember.id) {
            const author = getMember(payload.new.author_id)
            sendNotification(
              `📢 ${author?.name || '가족'}이(가) 전달사항을 남겼어요`,
              payload.new.content
            )
          }
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [currentMember])

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return
    const { error } = await supabase.from('announcements').insert({
      content: content.trim() || '(사진)',
      author_id: currentMember.id,
      is_important: isImportant,
      image_url: imageUrl,
      confirmed_by: [],
    })
    if (!error) {
      setContent('')
      setIsImportant(false)
      setImageUrl(null)
      setShowForm(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 지울까요?')) return
    await supabase.from('announcements').delete().eq('id', id)
  }

  // 확인 / 확인 취소
  const handleToggleConfirm = async (item) => {
    const confirmedBy = Array.isArray(item.confirmed_by) ? item.confirmed_by : []
    const alreadyConfirmed = confirmedBy.some(c => c.member_id === currentMember.id)

    let newConfirmedBy
    if (alreadyConfirmed) {
      // 이미 확인했으면 취소
      newConfirmedBy = confirmedBy.filter(c => c.member_id !== currentMember.id)
    } else {
      // 처음 확인하면 추가
      newConfirmedBy = [
        ...confirmedBy,
        { member_id: currentMember.id, confirmed_at: new Date().toISOString() }
      ]
    }

    await supabase
      .from('announcements')
      .update({ confirmed_by: newConfirmedBy })
      .eq('id', item.id)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const diffMin = Math.floor((new Date() - date) / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    if (diffMin < 1) return '방금'
    if (diffMin < 60) return `${diffMin}분 전`
    if (diffHour < 24) return `${diffHour}시간 전`
    if (diffDay < 7) return `${diffDay}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-pink-500" />
          <h2 className="text-2xl font-bold font-cute text-pink-600">전달사항</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="cute-button bg-pink-400 text-white tap-effect">
          <Plus className="w-5 h-5 inline" />
        </button>
      </div>

      {showForm && (
        <div className="pastel-card p-4 fade-in">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="가족에게 전할 말을 적어주세요 ✏️ (사진만 올려도 OK)"
            className="cute-input w-full min-h-[100px] resize-none mb-3"
            autoFocus
          />
          <ImageUpload value={imageUrl} onChange={setImageUrl} color="pink" />
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="w-5 h-5 accent-pink-500"
              />
              <span className="text-sm font-bold text-pink-600">⚠️ 중요</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setContent(''); setImageUrl(null); }}
                className="cute-button bg-gray-200 text-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() && !imageUrl}
                className="cute-button bg-pink-500 text-white disabled:opacity-50"
              >
                전달하기 💌
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : announcements.length === 0 ? (
        <div className="pastel-card p-8 text-center">
          <div className="text-5xl mb-3">💌</div>
          <p className="text-gray-500">아직 전달사항이 없어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(item => {
            const author = getMember(item.author_id)
            const confirmedBy = Array.isArray(item.confirmed_by) ? item.confirmed_by : []
            const isConfirmedByMe = confirmedBy.some(c => c.member_id === currentMember.id)
            return (
              <div
                key={item.id}
                className={`pastel-card p-4 ${item.is_important ? 'border-pink-400 bg-pink-50/80' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xl">{author?.emoji}</span>
                      <span className="font-bold text-sm">{author?.name}</span>
                      <span className="text-xs text-gray-400">{formatTime(item.created_at)}</span>
                      {item.is_important && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />중요
                        </span>
                      )}
                    </div>
                    {item.content && item.content !== '(사진)' && (
                      <p className="text-gray-700 whitespace-pre-wrap mb-2">{item.content}</p>
                    )}
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt="첨부 사진"
                        onClick={() => setZoomImage(item.image_url)}
                        className="rounded-2xl max-h-64 cursor-pointer hover:opacity-90 border border-gray-200"
                      />
                    )}
                  </div>
                  {item.author_id === currentMember.id && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-400 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 확인 영역 */}
                <div className="mt-3 pt-3 border-t border-pink-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    {confirmedBy.length === 0 ? (
                      <span className="text-xs text-gray-400">아직 아무도 확인하지 않았어요</span>
                    ) : (
                      <>
                        <span className="text-xs text-gray-500 mr-1">확인:</span>
                        {confirmedBy.map(c => {
                          const m = getMember(c.member_id)
                          if (!m) return null
                          return (
                            <span
                              key={c.member_id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-${m.color}-100 text-${m.color}-700 border border-${m.color}-200`}
                              title={new Date(c.confirmed_at).toLocaleString('ko-KR')}
                            >
                              <span>{m.emoji}</span>
                              <span>{m.name}</span>
                              <Check className="w-3 h-3" />
                            </span>
                          )
                        })}
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleConfirm(item)}
                    className={`cute-button text-xs tap-effect flex items-center gap-1 ${
                      isConfirmedByMe
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-pink-400 text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {isConfirmedByMe ? '확인 취소' : '확인했어요'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 사진 확대 보기 */}
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
