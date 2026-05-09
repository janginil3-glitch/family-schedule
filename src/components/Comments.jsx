import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { supabase, getMember } from '../lib/supabase'

/**
 * 공통 댓글 컴포넌트
 * @param {string} parentTable - 'announcements' | 'todos' | 'homework' | 'supplies'
 * @param {number} parentId - 부모 항목의 id
 * @param {object} currentMember - 현재 로그인한 가족 구성원
 * @param {string} themeColor - 'pink' | 'blue' | 'purple' | 'green'
 */
export default function Comments({
  parentTable,
  parentId,
  currentMember,
  themeColor = 'pink',
}) {
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const messagesEndRef = useRef(null)

  // 댓글 개수만 먼저 가져오기 (펼치지 않아도 표시)
  const fetchCount = async () => {
    const { count: c } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('parent_table', parentTable)
      .eq('parent_id', parentId)
    setCount(c || 0)
  }

  // 전체 댓글 가져오기
  const fetchComments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_table', parentTable)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })
    if (data) {
      setComments(data)
      setCount(data.length)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCount()
    // 실시간 구독
    const channel = supabase
      .channel(`comments-${parentTable}-${parentId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `parent_id=eq.${parentId}`,
        },
        (payload) => {
          // 같은 parent_table에만 반응
          if (payload.new?.parent_table === parentTable ||
              payload.old?.parent_table === parentTable) {
            fetchCount()
            if (showComments) fetchComments()
          }
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [parentTable, parentId, showComments])

  // 댓글 영역 열면 전체 가져오기
  useEffect(() => {
    if (showComments) fetchComments()
  }, [showComments])

  // 새 댓글 오면 자동 스크롤
  useEffect(() => {
    if (showComments && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments, showComments])

  const handleSubmit = async () => {
    if (!content.trim()) return
    const text = content.trim()
    setContent('')
    await supabase.from('comments').insert({
      parent_table: parentTable,
      parent_id: parentId,
      member_id: currentMember.id,
      content: text,
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('댓글을 지울까요?')) return
    await supabase.from('comments').delete().eq('id', id)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const diffMin = Math.floor((new Date() - date) / 60000)
    const diffHour = Math.floor(diffMin / 60)
    if (diffMin < 1) return '방금'
    if (diffMin < 60) return `${diffMin}분 전`
    if (diffHour < 24) return `${diffHour}시간 전`
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // 색상 매핑 (Tailwind JIT 안전)
  const colorMap = {
    pink: { btn: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200', send: 'bg-pink-500' },
    blue: { btn: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', send: 'bg-blue-500' },
    purple: { btn: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', send: 'bg-purple-500' },
    green: { btn: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', send: 'bg-green-500' },
  }
  const c = colorMap[themeColor] || colorMap.pink

  return (
    <div className="mt-2">
      {/* 댓글 토글 버튼 */}
      <button
        onClick={() => setShowComments(!showComments)}
        className={`flex items-center gap-1 text-xs font-bold ${c.btn} hover:underline tap-effect`}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>
          {count > 0 ? `댓글 ${count}개` : '댓글 달기'}
          {showComments ? ' 닫기' : ''}
        </span>
      </button>

      {/* 댓글 영역 */}
      {showComments && (
        <div className={`mt-2 ${c.bg} border ${c.border} rounded-2xl p-3 fade-in`}>
          {/* 댓글 목록 */}
          <div className="space-y-2 max-h-72 overflow-y-auto mb-3">
            {loading ? (
              <div className="text-center text-xs text-gray-400 py-4">불러오는 중...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-4">
                💬 첫 댓글을 남겨보세요
              </div>
            ) : (
              comments.map(comment => {
                const author = getMember(comment.member_id)
                const isMine = comment.member_id === currentMember.id
                return (
                  <div
                    key={comment.id}
                    className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                  >
                    {/* 아바타 */}
                    <div className={`w-8 h-8 rounded-full bg-${author?.color}-100 border border-${author?.color}-200 flex items-center justify-center flex-shrink-0 text-base`}>
                      {author?.emoji || '?'}
                    </div>
                    {/* 말풍선 */}
                    <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMine && (
                        <span className="text-[10px] font-bold text-gray-500 mb-0.5 ml-1">
                          {author?.name || '알 수 없음'}
                        </span>
                      )}
                      <div className="flex items-end gap-1">
                        {isMine && (
                          <div className="flex flex-col items-end gap-0.5">
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="text-gray-300 hover:text-red-400 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <span className="text-[9px] text-gray-400 whitespace-nowrap">
                              {formatTime(comment.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                            isMine
                              ? `${c.send} text-white rounded-br-sm`
                              : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                          }`}
                        >
                          {comment.content}
                        </div>
                        {!isMine && (
                          <span className="text-[9px] text-gray-400 whitespace-nowrap mb-0.5">
                            {formatTime(comment.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          <div className="flex gap-2 items-end">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="댓글을 남겨주세요... (Enter로 전송)"
              rows={1}
              className="flex-1 px-3 py-2 rounded-2xl border-2 border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-300 resize-none min-h-[40px] max-h-[100px]"
            />
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className={`${c.send} text-white p-2.5 rounded-full disabled:opacity-40 tap-effect flex-shrink-0`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
