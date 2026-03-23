import { useState, useCallback } from 'react';
import { useVeridexSDK, useNetwork } from './provider.js';
import { resolveChainId, type ChainTarget } from './chains.js';
import type { PreparedTransfer, TransferResult } from '@veridex/sdk';

// ============================================================================
// Types
// ============================================================================

type TransferStep = 'idle' | 'preparing' | 'prepared' | 'executing' | 'confirmed' | 'error';

/**
 * Transfer parameters using chain names instead of raw Wormhole IDs.
 *
 * `targetChain` accepts either a chain name (`'base'`, `'solana'`, `'optimism'`)
 * or a numeric Wormhole chain ID for advanced use. Chain names are resolved
 * automatically based on the `network` prop set on `<VeridexProvider>`.
 */
export interface TransferInput {
    /** Target chain — a name like `'base'` or `'optimism'`, or a numeric Wormhole chain ID. */
    targetChain: ChainTarget;
    /** Token address, or `'native'` for the chain's native token. */
    token: string;
    /** Recipient address on the target chain. */
    recipient: string;
    /** Amount in the token's smallest unit (wei, lamports, etc.). */
    amount: bigint;
}

interface UseTransferReturn {
    /** Current step in the transfer flow */
    step: TransferStep;
    /** Prepared transfer (available after prepare()) */
    prepared: PreparedTransfer | null;
    /** Transfer result (available after execute()) */
    result: TransferResult | null;
    /** Last error */
    error: Error | null;
    /** Whether any operation is in progress */
    loading: boolean;
    /** Prepare a transfer (shows gas estimate). Accepts chain names like `'base'`. */
    prepare: (params: TransferInput) => Promise<PreparedTransfer>;
    /** Execute a previously prepared transfer */
    execute: (signer: any) => Promise<TransferResult>;
    /** Execute a gasless transfer via relayer (prepare+execute in one step). Accepts chain names. */
    transferViaRelayer: (params: TransferInput) => Promise<TransferResult>;
    /** Reset state to idle */
    reset: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manage the transfer lifecycle: prepare → review → execute.
 *
 * Accepts chain names (`'base'`, `'solana'`, `'optimism'`) instead of numeric
 * Wormhole chain IDs. The name is resolved to the correct ID based on the
 * `network` prop on `<VeridexProvider>` (defaults to `'testnet'`).
 *
 * @example
 * ```tsx
 * function TransferForm() {
 *   const { step, prepared, result, error, loading, prepare, execute, reset } = useTransfer();
 *
 *   const handlePrepare = () => prepare({
 *     targetChain: 'base',
 *     token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
 *     recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f5A234',
 *     amount: 1000000n,
 *   });
 *
 *   if (step === 'prepared' && prepared) {
 *     return (
 *       <div>
 *         <p>Gas cost: {prepared.formattedCost}</p>
 *         <button onClick={() => execute(signer)} disabled={loading}>Confirm</button>
 *         <button onClick={reset}>Cancel</button>
 *       </div>
 *     );
 *   }
 *
 *   if (step === 'confirmed' && result) {
 *     return <p>Sent! Tx: {result.transactionHash}</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handlePrepare} disabled={loading}>
 *         {loading ? 'Preparing...' : 'Send 1 USDC'}
 *       </button>
 *       {error && <p>{error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTransfer(): UseTransferReturn {
    const sdk = useVeridexSDK();
    const network = useNetwork();
    const [step, setStep] = useState<TransferStep>('idle');
    const [prepared, setPrepared] = useState<PreparedTransfer | null>(null);
    const [result, setResult] = useState<TransferResult | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const loading = step === 'preparing' || step === 'executing';

    const prepare = useCallback(
        async (params: TransferInput) => {
            setStep('preparing');
            setError(null);
            try {
                const sdkParams = {
                    ...params,
                    targetChain: resolveChainId(params.targetChain, network),
                };
                const prep = await sdk.prepareTransfer(sdkParams);
                setPrepared(prep);
                setStep('prepared');
                return prep;
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err));
                setError(e);
                setStep('error');
                throw e;
            }
        },
        [sdk, network],
    );

    const execute = useCallback(
        async (signer: any) => {
            if (!prepared) {
                throw new Error('Call prepare() before execute()');
            }
            setStep('executing');
            setError(null);
            try {
                const res = await sdk.executeTransfer(prepared, signer);
                setResult(res);
                setStep('confirmed');
                return res;
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err));
                setError(e);
                setStep('error');
                throw e;
            }
        },
        [sdk, prepared],
    );

    const transferViaRelayer = useCallback(
        async (params: TransferInput) => {
            setStep('executing');
            setError(null);
            try {
                const sdkParams = {
                    ...params,
                    targetChain: resolveChainId(params.targetChain, network),
                };
                const res = await sdk.transferViaRelayer(sdkParams);
                setResult(res);
                setStep('confirmed');
                return res;
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err));
                setError(e);
                setStep('error');
                throw e;
            }
        },
        [sdk, network],
    );

    const reset = useCallback(() => {
        setStep('idle');
        setPrepared(null);
        setResult(null);
        setError(null);
    }, []);

    return { step, prepared, result, error, loading, prepare, execute, transferViaRelayer, reset };
}
