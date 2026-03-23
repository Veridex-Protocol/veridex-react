import { vi } from 'vitest';
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { VeridexProvider } from '../src/provider';

// ============================================================================
// Mock Data
// ============================================================================

export const mockCredential = {
  credentialId: 'test-cred-123',
  publicKeyX: 1234567890n,
  publicKeyY: 9876543210n,
  keyHash: '0xdeadbeef',
};

export const mockPortfolioBalance = {
  tokens: [
    {
      token: { address: '0xUSDC', symbol: 'USDC' },
      formatted: '100.00',
      balance: 100000000n,
    },
    {
      token: { address: '0xETH', symbol: 'ETH' },
      formatted: '1.5',
      balance: 1500000000000000000n,
    },
  ],
};

export const mockMultiChainPortfolio = [
  { ...mockPortfolioBalance, wormholeChainId: 10004, chainName: 'Base Sepolia' },
  { tokens: [{ token: { address: '0xSOL', symbol: 'SOL' }, formatted: '5.0', balance: 5000000000n }], wormholeChainId: 1, chainName: 'Solana' },
];

export const mockAddresses: Record<number, string> = {
  10004: '0xVaultBase',
  1: '0xVaultSolana',
  10005: '0xVaultOptimism',
};

export const mockPreparedTransfer = {
  targetChain: 10004,
  token: '0xUSDC',
  recipient: '0xRecipient',
  amount: 1000000n,
  formattedCost: '0.001 ETH',
  nonce: 1n,
  deadline: BigInt(Date.now() + 300_000),
};

export const mockTransferResult = {
  transactionHash: '0xabc123def456',
};

export const mockTransferParams = {
  targetChain: 10004,
  token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f5A234',
  amount: 1000000n,
};

export const mockFormattedSpendingLimits = {
  dailyLimit: '1000.00 USDC',
  dailySpent: '250.00 USDC',
  dailyRemaining: '750.00 USDC',
  dailyUsedPercentage: 25,
  transactionLimit: '500.00 USDC',
  timeUntilReset: '18h 30m',
};

// ============================================================================
// Mock SDK Factory
// ============================================================================

export function createMockSDK(overrides: Record<string, any> = {}) {
  return {
    passkey: {
      getCredential: vi.fn(() => mockCredential),
      register: vi.fn(async () => mockCredential),
      authenticate: vi.fn(async () => ({ credential: mockCredential })),
    },
    clearCredential: vi.fn(),
    getVaultAddress: vi.fn(() => '0xVaultBase'),
    getVaultBalances: vi.fn(async () => mockPortfolioBalance),
    getMultiChainAddresses: vi.fn(() => mockAddresses),
    getMultiChainPortfolio: vi.fn(async () => mockMultiChainPortfolio),
    prepareTransfer: vi.fn(async () => mockPreparedTransfer),
    executeTransfer: vi.fn(async () => mockTransferResult),
    transferViaRelayer: vi.fn(async () => mockTransferResult),
    getFormattedSpendingLimits: vi.fn(async () => mockFormattedSpendingLimits),
    checkSpendingLimit: vi.fn(async () => ({ allowed: true })),
    ...overrides,
  } as any;
}

// ============================================================================
// Render Helper
// ============================================================================

export function renderWithProvider(
  ui: React.ReactElement,
  sdk?: any,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const mockSDK = sdk ?? createMockSDK();
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(VeridexProvider, { sdk: mockSDK }, children);

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    sdk: mockSDK,
  };
}
