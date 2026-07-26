/**
 * Scan module barrel exports.
 * Provides the complete OCR pipeline: types, engines, orchestrator, and utilities.
 */
export { scanTicket, enableFlorenceEngine, enableNerEngine, isFlorenceEnabled, isNerEnabled } from './orchestrator'
export { detectCapabilities, getEngines, getRecommendedEngine, checkModelCached } from './capabilities'
export { preprocessReceiptImage, equalizeHistogramFn, medianFilter3x3, applyAdaptiveThreshold, calculateOptimalCropScale, preprocessMultiSectionReceipt } from './preprocessor'
export { scanWithTesseract, resetTesseractWorker } from './tesseract-engine'
export { classifyWithNER, enableNerEngine as enableNer, isNerEnabled as isNerActive, NER_MODELS, resetNerEngine } from './ner-engine'
export { scanWithTesseractNer, stringSimilarity } from './tesseract-ner-engine'
export { parseReceiptText, parseSpanishAmount } from './receipt-parser'
export { classifyIntent } from './mini-agent'
export { modelManager } from './model-manager'
export { DownloadTracker, formatBytes, formatSpeed, formatETA } from './download-tracker'
export { getStorageInfo, clearModelCaches, checkStorageForModel } from './storage-manager'
export { assessImageQuality, computeLaplacianVariance, computeRmsContrast, estimateCharacterHeight } from './imageQualityAssessor'
export { mergeMultiSectionOcrResults } from './multiSectionMerger'
export type {
  ScanInput, ScanResult, ScanProgress, ScanCapabilities,
  ScanEngineName, ScanEngineStatus, EngineInfo, ProgressCallback,
  NormalizedCropRect, CropSection, ResolutionPreset, ResolutionConfig,
  ImageQualityMetrics, QualityAssessmentSummary, ImageAdjustmentOptions,
  PreprocessedSection, MultiSectionPreprocessResult, SectionOcrPayload,
  MergedTicketScanResult,
} from './types'
export type { ParsedReceipt } from './receipt-parser'
export type { NerResult, NerEntity, NerModelType, NerModelSpec } from './ner-engine'
export type { IntentClassification } from './mini-agent'
export type { DownloadSummary, DownloadFileState } from './download-tracker'
