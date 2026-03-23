// @veridex/react — React hooks for Veridex Protocol SDK
//
// Usage:
//   import { VeridexProvider, usePasskey, useBalance, useTransfer } from '@veridex/react';

export { VeridexProvider, useVeridexSDK, useNetwork } from './provider.js';
export { usePasskey } from './usePasskey.js';
export { useBalance } from './useBalance.js';
export { useTransfer } from './useTransfer.js';
export type { TransferInput } from './useTransfer.js';
export { useMultiChainPortfolio } from './useMultiChainPortfolio.js';
export { useSpendingLimits } from './useSpendingLimits.js';
export { resolveChainId, resolveChainIds } from './chains.js';
export type { ChainTarget } from './chains.js';
