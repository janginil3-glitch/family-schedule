import { useState } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ImageUpload({ value, onChange, color = 'pink' }) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('사진 크기는 5MB 이하로 올려주세요!')
      return
    }

    setUploading(true)
    try {
      // 파일 이름 만들기 (시간 + 랜덤)
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

      // Supabase Storage 업로드
      const { error: upErr } = await supabase.storage
        .from('family-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (upErr) throw upErr

      // 공개 URL 가져오기
      const { data } = supabase.storage
        .from('family-images')
        .getPublicUrl(fileName)

      onChange(data.publicUrl)
    } catch (err) {
      alert('사진 올리기 실패: ' + err.message)
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    onChange(null)
  }

  return (
    <div className="mb-3">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="첨부 사진"
            className="rounded-2xl max-h-48 border-2 border-gray-200"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-400 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg tap-effect"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className={`inline-flex items-center gap-2 cute-button bg-${color}-100 text-${color}-700 cursor-pointer text-sm`}>
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              올리는 중...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              📷 사진 첨부
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
