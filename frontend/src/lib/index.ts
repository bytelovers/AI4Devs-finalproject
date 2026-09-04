// Barrel exports for src/lib
export type * from './types'
export {
  formatEUR,
  formatDate,
  formatDateTime,
  itemLineTotal,
  calcSubtotal,
  calcTaxAmount,
  calcTipAmount,
  calcTicketTotal,
  calcItemsTotal,
  calcDiscountsTotal,
  personItemShare,
  computeShares,
  verifyCuadre,
  itemsFullyAssigned,
  normalizeWeights,
  round2,
  AVATAR_COLORS,
  getInitials,
  genId,
} from './calc'
export { useAppStore, usePerson, useTicket, useGroup } from './store'
