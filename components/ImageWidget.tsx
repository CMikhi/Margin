'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ImageWidgetProps {
  id: string
  imageSrc: string
  onImageChange: (id: string, imageSrc: string) => void
  onDelete: (id: string) => void
}

const fadeIn = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
}

export function ImageWidget({ id, imageSrc, onImageChange, onDelete }: ImageWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    // Create a fast local preview URL to avoid flicker
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setIsLoading(true)

    // Also persist as base64 for storage
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        onImageChange(id, base64)
        setIsLoading(false)
        // Revoke the object URL once we have a persistent src
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
          setPreviewUrl(null)
        }
      }
      reader.onerror = () => {
        console.error('Error reading image file')
        setIsLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error loading image:', error)
      setIsLoading(false)
    }
  }

  // Cleanup any lingering preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const isEmpty = !imageSrc

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={handleImageClick}
        className={`cursor-pointer w-full h-full rounded-lg border-2 border-dashed transition-colors duration-200 ${(isEmpty || isLoading) ? 'flex items-center justify-center' : ''}`}
        style={{
          backgroundColor: isEmpty ? 'var(--bg-hover)' : 'transparent',
          borderColor: isEmpty ? 'var(--border-default)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (isEmpty) {
            e.currentTarget.style.borderColor = 'var(--border-hover)'
            e.currentTarget.style.backgroundColor = 'var(--bg-active)'
          }
        }}
        onMouseLeave={(e) => {
          if (isEmpty) {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
          }
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-blue)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading...
            </span>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-3 p-6">
            <svg className="w-12 h-12" fill="none" stroke="var(--text-muted)" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Click to upload image
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative group" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <img
              src={previewUrl || imageSrc}
              alt="Uploaded image"
              className="w-full h-full object-cover rounded-lg"
              style={{ objectFit: 'cover' }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                // If the base64 fails to render, fall back to preview URL
                if (!previewUrl && imageSrc) {
                  try {
                    // Attempt to create a blob URL from base64
                    const matches = imageSrc.match(/^data:(.*?);base64,(.*)$/)
                    if (matches) {
                      const mime = matches[1]
                      const b64 = matches[2]
                      const byteChars = atob(b64)
                      const byteNums = new Array(byteChars.length)
                      for (let i = 0; i < byteChars.length; i++) {
                        byteNums[i] = byteChars.charCodeAt(i)
                      }
                      const byteArray = new Uint8Array(byteNums)
                      const blob = new Blob([byteArray], { type: mime })
                      const url = URL.createObjectURL(blob)
                      setPreviewUrl(url)
                    }
                  } catch (e) {
                    console.error('Failed to create preview fallback URL:', e)
                  }
                }
                setIsLoading(false)
              }}
            />
            {/* Overlay removed to avoid potential compositing issues */}
          </div>
        )}
      </div>
    </motion.div>
  )
}