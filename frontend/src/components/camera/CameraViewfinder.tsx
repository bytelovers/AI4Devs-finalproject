/**
 * CameraViewfinder — composable viewfinder overlay
 *
 * Renders corner brackets, a 3x3 grid guide, and an animated scan line
 * over the camera preview video. Uses the slot pattern: children are
 * rendered inside the viewfinder container.
 *
 * Theming uses CSS variables — no next-themes dependency.
 */

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CameraViewfinderProps {
  /** Whether the camera stream is active and showing video. */
  cameraReady: boolean
  /** Whether to show the scanning animation line. */
  scanning?: boolean
  /** Optional className override. */
  className?: string
  /** The video element (or other content) rendered inside the viewfinder. */
  children?: React.ReactNode
}

export function CameraViewfinder({
  cameraReady,
  scanning = false,
  className,
  children,
}: CameraViewfinderProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-black rounded-2xl',
        'aspect-[3/4]',
        className
      )}
    >
      {/* Video / children slot */}
      {children}

      {/* Loading state */}
      {!cameraReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm">Starting camera…</p>
        </div>
      )}

      {/* Viewfinder overlay — only visible when camera is ready */}
      {cameraReady && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner brackets */}
          {/* Top-left */}
          <div
            className="absolute top-3 left-3 w-6 h-6"
            style={{
              borderTop: '3px solid var(--color-sage, #5F8575)',
              borderLeft: '3px solid var(--color-sage, #5F8575)',
            }}
          />
          {/* Top-right */}
          <div
            className="absolute top-3 right-3 w-6 h-6"
            style={{
              borderTop: '3px solid var(--color-sage, #5F8575)',
              borderRight: '3px solid var(--color-sage, #5F8575)',
            }}
          />
          {/* Bottom-left */}
          <div
            className="absolute bottom-3 left-3 w-6 h-6"
            style={{
              borderBottom: '3px solid var(--color-sage, #5F8575)',
              borderLeft: '3px solid var(--color-sage, #5F8575)',
            }}
          />
          {/* Bottom-right */}
          <div
            className="absolute bottom-3 right-3 w-6 h-6"
            style={{
              borderBottom: '3px solid var(--color-sage, #5F8575)',
              borderRight: '3px solid var(--color-sage, #5F8575)',
            }}
          />

          {/* 3x3 Grid overlay */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 3 3"
            preserveAspectRatio="none"
          >
            {/* Vertical lines */}
            <line x1="1" y1="0" x2="1" y2="3" stroke="white" strokeOpacity={0.2} strokeWidth="0.02" />
            <line x1="2" y1="0" x2="2" y2="3" stroke="white" strokeOpacity={0.2} strokeWidth="0.02" />
            {/* Horizontal lines */}
            <line x1="0" y1="1" x2="3" y2="1" stroke="white" strokeOpacity={0.2} strokeWidth="0.02" />
            <line x1="0" y1="2" x2="3" y2="2" stroke="white" strokeOpacity={0.2} strokeWidth="0.02" />
          </svg>

          {/* Scanning animation line */}
          {scanning && <div className="absolute left-0 w-full h-1 scan-line-animation" />}
        </div>
      )}
    </div>
  )
}
