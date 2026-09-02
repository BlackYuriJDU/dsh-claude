// The composer microphone: dictation via the Web Speech API (Chromium).
// Final transcripts stream to the owner callback; interim results render as
// ghost text in the placeholder slot (kept simple: final-only in v1).

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ComposerBarProps } from '../contract/slots.ts'
import css from './MicButton.module.css'

/** Minimal structural type for the vendor-prefixed SpeechRecognition. */
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionResultLikeEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

/** The result event shape the dictation path reads (final chunks only). */
interface SpeechRecognitionResultLikeEvent {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}

/** Vendor constructor off the window (Chromium; absent elsewhere). */
interface SpeechRecognitionWindow {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

export interface MicButtonProps {
  /** Append one dictated chunk to the draft at the caret. */
  onDictate: (text: string) => void
  /** The bar's chrome disable state. */
  disabled: boolean
  t: ComposerBarProps['t']
}

/**
 * The microphone toggle. Renders nothing when the engine is unavailable so
 * the trailing cluster keeps the reference silhouette everywhere else.
 * @param props - see {@link MicButtonProps}.
 * @returns the mic button, or null without SpeechRecognition.
 */
export function MicButton({ onDictate, disabled, t }: MicButtonProps) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onDictateRef = useRef(onDictate)
  onDictateRef.current = onDictate

  const supported = (() => {
    const w = window as unknown as SpeechRecognitionWindow
    return w.SpeechRecognition !== undefined || w.webkitSpeechRecognition !== undefined
  })()

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) {
      stop()
      return
    }
    const w = window as unknown as SpeechRecognitionWindow
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (Ctor === undefined) return
    const recognition = new Ctor()
    recognition.lang = navigator.language?.startsWith('pt') === true ? navigator.language : 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (event) => {
      let chunk = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result?.isFinal === true) chunk += result[0]?.transcript ?? ''
      }
      const trimmed = chunk.trim()
      if (trimmed !== '') onDictateRef.current(trimmed)
    }
    recognition.onerror = () => {
      recognitionRef.current = null
      setListening(false)
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }, [listening, stop])

  useEffect(() => () => { recognitionRef.current?.stop() }, [])

  if (!supported) return null
  return (
    <button
      type="button"
      className={listening ? css.recording : css.mic}
      aria-label={listening ? t('input.micStop') : t('input.mic')}
      aria-pressed={listening}
      disabled={disabled}
      onClick={toggle}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
        <rect x="5.6" y="1.2" width="4.8" height="8" rx="2.4" fill="currentColor" />
        <path
          d="M3.4 7.4a4.6 4.6 0 0 0 9.2 0M8 12v2.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
