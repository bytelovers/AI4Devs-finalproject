'use client'

import { useCallback, useState } from 'react'
import { PageHeader } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { Camera, Wand2, Edit3 } from 'lucide-react'

interface OcrReviewViewProps {
  /** If provided, use controlled mode */
  rawText?: string
  imageUrl?: string
  onChange?: (text: string) => void
  onContinue?: () => void
  onSkip?: () => void
  onBack?: () => void
}

export function OcrReviewView({
  rawText: initialRawText,
  imageUrl,
  onChange,
  onContinue,
  onSkip,
  onBack,
}: OcrReviewViewProps) {
  const [rawText, setRawText] = useState(initialRawText || '')

  // If controlled, sync with prop
  if (initialRawText && onChange) {
    // Controlled mode
  } else if (!initialRawText) {
    // Uncontrolled mode - load from ticket if needed
  }

  const handleChange = (text: string) => {
    setRawText(text)
    onChange?.(text)
  }

  const handleContinue = useCallback(async () => {
    if (!rawText.trim()) return
    onContinue?.()
  }, [rawText, onContinue])

  const handleSkip = useCallback(() => {
    onSkip?.()
  }, [onSkip])

  const handleBack = useCallback(() => {
    onBack?.()
  }, [onBack])

  return (
    <div className="px-4 pt-4">
      <PageHeader
        title="Revisar texto OCR"
        subtitle="Corrige el texto antes de procesarlo con IA"
        back={handleBack}
      />

      {/* Ticket image collapsible */}
      {imageUrl && (
        <details className="mb-4">
          <summary className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
            <Camera className="h-3.5 w-3.5" />
            Ver imagen del ticket
          </summary>
          <div className="mt-2 rounded-xl overflow-hidden border border-border">
            <img
              src={imageUrl}
              alt="Ticket"
              className="w-full max-h-48 object-contain bg-black/5"
            />
          </div>
        </details>
      )}

      {/* Info banner */}
      <div className="mb-3 p-3 rounded-lg bg-accent/40 border border-border">
        <p className="text-xs text-muted-foreground">
          Este es el texto que el OCR ha extraído del ticket. Revísalo y
          corrige errores antes de que la IA (NER) lo procese. Si el texto es
          ilegible, puedes reescribirlo manualmente.
        </p>
      </div>

      {/* Editable textarea */}
      <textarea
        value={rawText}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-[40vh] p-3 rounded-xl border border-border bg-card text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
        placeholder="El texto del ticket aparecerá aquí…"
        spellCheck={false}
      />

      {/* Stats */}
      <div className="flex items-center justify-between mt-2 mb-4 text-xs text-muted-foreground">
        <span>{rawText.split(/\r?\n/).filter((l) => l.trim()).length} líneas</span>
        <span>{rawText.length} caracteres</span>
      </div>

      {/* Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleContinue}
          className="w-full"
          size="lg"
          disabled={!rawText.trim()}
        >
          <Wand2 className="h-5 w-5 mr-2" />
          Procesar con IA (NER)
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSkip} className="flex-1">
            <Edit3 className="h-4 w-4 mr-2" />
            Sin NER (solo parser)
          </Button>
          <Button variant="ghost" onClick={handleBack} className="flex-1 text-muted-foreground">
            Volver a capturar
          </Button>
        </div>
      </div>
    </div>
  )
}