'use client'

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { PageHeader } from '@/components/ui/EmptyState'
import { CameraCapture } from '@/components/camera/CameraCapture'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, Upload, ChevronLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export function NewTicketCaptureView() {
  const draftTicketId = useAppStore((s) => s.draftTicketId)
  const tickets = useAppStore((s) => s.tickets)
  const deleteTicket = useAppStore((s) => s.deleteTicket)
  const clearDraftTicketId = useAppStore((s) => s.clearDraftTicketId)
  const updateTicket = useAppStore((s) => s.updateTicket)
  const navigate = useNavigate()

  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // The capture loader has already ensured draftTicketId + ticket exist.
  const draft = draftTicketId ? tickets.find((t) => t.id === draftTicketId) : null

  // FR-009: Back from capture with empty draft → delete draft + navigate home.
  // Otherwise: keep draft + navigate home.
  const handleBack = useCallback(() => {
    if (draft && draft.items.length === 0 && !draft.image) {
      deleteTicket(draft.id)
      clearDraftTicketId()
    }
    navigate('/')
  }, [draft, deleteTicket, clearDraftTicketId, navigate])

  const handleCapture = useCallback(
    async (imageDataUrl: string) => {
      setCapturedImage(imageDataUrl)
      setIsProcessing(true)

      try {
        if (draftTicketId) {
          // Reuse the draft created by the parent loader; just attach the image.
          updateTicket(draftTicketId, { image: imageDataUrl })
        }
        toast.success('Foto capturada', { description: 'Ahora puedes revisar los items' })
        navigate('/tickets/new/review')
      } catch (err) {
        console.error('[NewTicketCapture] Error:', err)
        toast.error('Error al capturar la foto')
      } finally {
        setIsProcessing(false)
      }
    },
    [draftTicketId, updateTicket, navigate]
  )

  const addTicketItem = useAppStore((s) => s.addTicketItem)

  const handleManualEntry = () => {
    if (draftTicketId) {
      updateTicket(draftTicketId, { title: 'Ticket manual' })
      // Add an empty placeholder item so reviewLoader allows entry
      addTicketItem(draftTicketId, { name: '', quantity: 1, unitPrice: 0 })
    }
    navigate('/tickets/new/review')
  }

  if (!draft) {
    // Loader should have handled this — show a fallback.
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">Iniciando wizard…</p>
      </div>
    )
  }

  // Show post-capture preview if we just captured
  if (capturedImage && !isProcessing) {
    return (
      <div className="px-4 pt-4">
        <PageHeader
          title="Foto capturada"
          subtitle="La imagen se ha guardado. ¿Continuar a revisión?"
          back={() => setCapturedImage(null)}
        />

        <div className="space-y-4">
          <Card className="p-4">
            <img
              src={capturedImage}
              alt="Ticket capturado"
              className="w-full max-h-64 object-contain rounded-lg mx-auto"
            />
          </Card>

          <div className="flex gap-2">
            <Button onClick={() => setCapturedImage(null)} variant="outline" className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Rehacer foto
            </Button>
            <Button onClick={() => navigate('/tickets/new/review')} className="flex-1">
              Continuar a revisión
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4">
      <PageHeader
        title="Nuevo ticket"
        subtitle="Escanea o sube la imagen del ticket"
        back={handleBack}
      />

      <CameraCapture
        onCapture={handleCapture}
        onCancel={handleBack}
      />

      <div className="mt-6 space-y-3">
        <Button
          variant="outline"
          onClick={handleManualEntry}
          className="w-full gap-2"
          disabled={isProcessing}
        >
          <Upload className="h-5 w-5" />
          Entrada manual (sin foto)
        </Button>

        <Card className="p-4 border-dashed bg-accent/30">
          <p className="text-sm text-muted-foreground text-center">
            <Sparkles className="h-4 w-4 mx-auto mb-2 text-primary" />
            El OCR detectará automáticamente items, precios e impuestos.
          </p>
        </Card>
      </div>
    </div>
  )
}