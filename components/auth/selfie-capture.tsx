'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, RotateCcw, Upload } from 'lucide-react'

const MAX_SIZE = 480

function toJpeg(source: CanvasImageSource, width: number, height: number, mirror: boolean) {
  const scale = Math.min(1, MAX_SIZE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')!
  if (mirror) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export function SelfieCapture({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<'starting' | 'live' | 'unavailable'>('starting')
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640 }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraState('live')
      })
      .catch(() => !cancelled && setCameraState('unavailable'))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function takePhoto() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const dataUrl = toJpeg(video, video.videoWidth, video.videoHeight, true)
    setPreview(dataUrl)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setPreview(toJpeg(img, img.naturalWidth, img.naturalHeight, false))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-full border-4 border-olympic-blue bg-olympic-white/5">
        {preview ? (
          <img src={preview} alt="Tu selfie" className="size-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="size-full -scale-x-100 object-cover" />
        )}
        {!preview && cameraState !== 'live' ? (
          <p className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-olympic-white/70">
            {cameraState === 'starting' ? 'Activando cámara…' : 'No pudimos usar la cámara. Subí una selfie desde tu dispositivo.'}
          </p>
        ) : null}
      </div>

      {preview ? (
        <div className="flex gap-3">
          <button type="button" onClick={() => setPreview(null)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-olympic-white/30 px-4 py-3 font-semibold">
            <RotateCcw className="size-4" /> Repetir
          </button>
          <button type="button" onClick={() => onCapture(preview)} className="flex-1 rounded-full bg-olympic-blue px-4 py-3 font-bold text-olympic-white">
            Verificar identidad
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          {cameraState === 'live' ? (
            <button type="button" onClick={takePhoto} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-olympic-blue px-4 py-3 font-bold text-olympic-white">
              <Camera className="size-4" /> Tomar selfie
            </button>
          ) : null}
          <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-olympic-white/30 px-4 py-3 font-semibold">
            <Upload className="size-4" /> Subir foto
            <input type="file" accept="image/*" capture="user" onChange={handleFile} className="sr-only" />
          </label>
        </div>
      )}
    </div>
  )
}
