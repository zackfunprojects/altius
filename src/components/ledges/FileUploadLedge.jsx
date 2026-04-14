import { useState, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const DEFAULT_ACCEPT = 'image/*,application/pdf,audio/*,video/*'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * File upload exercise: upload a creative deliverable for AI evaluation.
 */
export default function FileUploadLedge({ spec, onSubmit }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState(null)
  const [error, setError] = useState(null)

  const acceptTypes = spec?.accepted_types || DEFAULT_ACCEPT

  const handleFileSelect = useCallback((e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 50MB.')
      return
    }

    setError(null)
    setFile(selected)
    setUploadedUrl(null)
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file || !user?.id || uploading) return
    setUploading(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop() || 'bin'
      const path = `exercise-files/${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('exercise-files')
        .upload(path, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('exercise-files')
        .getPublicUrl(path)

      setUploadedUrl(urlData.publicUrl)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [file, user, uploading])

  const handleSubmit = useCallback(() => {
    if (!uploadedUrl) return
    onSubmit({
      file_url: uploadedUrl,
      file_name: file?.name,
      file_type: file?.type,
      type: 'file_upload',
    })
  }, [uploadedUrl, file, onSubmit])

  return (
    <div className="space-y-4">
      {/* Prompt */}
      {spec?.prompt && (
        <p className="font-body text-sm text-ink leading-relaxed">{spec.prompt}</p>
      )}

      {/* File input */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center py-8 px-6 border-2 border-dashed border-trail-brown/30 rounded-lg bg-catalog-cream/50 cursor-pointer hover:border-summit-cobalt/40 hover:bg-summit-cobalt/5 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
        <svg className="w-10 h-10 text-trail-brown/40 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 16V4M12 4L8 8M12 4L16 8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 16V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {file ? (
          <p className="text-sm font-ui text-ink">{file.name}</p>
        ) : (
          <p className="text-sm font-ui text-trail-brown/60">
            Click to select a file
          </p>
        )}
        {file && !uploadedUrl && (
          <p className="text-xs font-mono text-trail-brown/50 mt-1">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        )}
      </div>

      {/* Upload / Submit buttons */}
      {file && !uploadedUrl && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2.5 bg-summit-cobalt text-white font-ui font-semibold text-sm rounded-lg hover:bg-summit-cobalt/90 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      )}

      {uploadedUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-phosphor-green/10 rounded-lg border border-phosphor-green/20">
            <svg className="w-4 h-4 text-phosphor-green flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13L9 17L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm font-ui text-ink">File uploaded successfully</p>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-summit-cobalt text-white font-ui font-semibold text-sm rounded-lg hover:bg-summit-cobalt/90 transition-colors"
          >
            Submit for Evaluation
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm font-ui text-signal-orange text-center">{error}</p>
      )}
    </div>
  )
}
