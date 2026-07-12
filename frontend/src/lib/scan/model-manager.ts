/**
 * Model Manager: gestiona lazy loading y dispose de modelos de IA.
 *
 * Garantiza que solo UN modelo pesado esté cargado en RAM a la vez.
 * Antes de cargar uno nuevo, hace dispose() del anterior para liberar
 * memoria (crítico en iOS donde el límite es ~500MB por tab).
 *
 * Cada motor registra su modelo aquí. El manager trackea:
 *   - Qué modelo está cargado actualmente
 *   - Referencia al modelo para poder hacer dispose()
 *   - Tiempo de última carga (para stats)
 */

export interface LoadedModel {
  id: string
  /** Función para liberar la memoria del modelo. */
  dispose: () => Promise<void>
  /** Timestamp de carga. */
  loadedAt: number
  /** Tamaño aproximado en bytes. */
  sizeBytes: number
}

class ModelManagerImpl {
  private current: LoadedModel | null = null
  private loadingPromise: Promise<LoadedModel> | null = null

  /**
   * Carga un modelo. Si hay otro cargado, lo descarga primero.
   * Si el mismo modelo ya está cargado, lo reutiliza.
   */
  async load(
    id: string,
    loader: () => Promise<{ dispose: () => Promise<void>; sizeBytes?: number }>
  ): Promise<LoadedModel> {
    // Si ya está cargado el mismo, reutilizar
    if (this.current?.id === id) {
      return this.current
    }

    // Si hay una carga en progreso del mismo id, esperar
    if (this.loadingPromise) {
      const loaded = await this.loadingPromise
      if (loaded.id === id) return loaded
    }

    // Dispose del anterior SIEMPRE antes de cargar nuevo
    if (this.current) {
      console.log(`[model-manager] Disposing model "${this.current.id}" before loading "${id}"…`)
      await this.safeDispose(this.current)
      this.current = null
    }

    // Cargar nuevo
    this.loadingPromise = (async () => {
      console.log(`[model-manager] Loading model "${id}"…`)
      const start = Date.now()
      const result = await loader()
      const loaded: LoadedModel = {
        id,
        dispose: result.dispose,
        loadedAt: Date.now(),
        sizeBytes: result.sizeBytes ?? 0,
      }
      const elapsed = Date.now() - start
      console.log(`[model-manager] Model "${id}" loaded in ${elapsed}ms`)
      this.current = loaded
      this.loadingPromise = null
      return loaded
    })()

    return this.loadingPromise
  }

  /**
   * Descarga el modelo actual si existe.
   */
  async unloadCurrent(): Promise<void> {
    if (this.current) {
      await this.safeDispose(this.current)
      this.current = null
    }
  }

  /**
   * Verifica si un modelo específico está cargado.
   */
  isLoaded(id: string): boolean {
    return this.current?.id === id
  }

  /**
   * Devuelve info del modelo cargado.
   */
  getCurrent(): LoadedModel | null {
    return this.current
  }

  /**
   * Dispose seguro con manejo de errores.
   */
  private async safeDispose(model: LoadedModel): Promise<void> {
    try {
      await model.dispose()
      console.log(`[model-manager] Model "${model.id}" disposed`)
    } catch (err) {
      console.warn(`[model-manager] Error disposing "${model.id}":`, err)
    }
    // Sugerir GC (solo funciona si --js-flags="--expose-gc")
    if (typeof (globalThis as any).gc === 'function') {
      try { (globalThis as any).gc() } catch { /* ignore */ }
    }
  }
}

// Singleton
export const modelManager = new ModelManagerImpl()
