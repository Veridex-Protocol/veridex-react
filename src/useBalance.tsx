import { useState, useEffect, useCallback, useRef } from 'react';
import { useVeridexSDK } from './provider.js';
import type { PortfolioBalance } from '@veridex/sdk';

// ============================================================================
// Types
// ============================================================================

interface UseBalanceOptions {
    /** Poll interval in milliseconds (default: 15000) */
    pollInterval?: number;
    /** Whether to start polling immediately (default: true) */
    enabled?: boolean;
}

interface UseBalanceReturn {
    /** Current portfolio balance (null until first fetch) */
    balance: PortfolioBalance | null;
    /** Whether a balance fetch is in progress */
    loading: boolean;
    /** Last error from a balance fetch */
    error: Error | null;
    /** Manually refresh balance */
    refetch: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Subscribe to vault balance changes with automatic polling.
 *
 * @example
 * ```tsx
 * function BalanceDisplay() {
 *   const { balance, loading, error, refetch } = useBalance({ pollInterval: 10000 });
 *
 *   if (loading && !balance) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!balance) return null;
 *
 *   return (
 *     <div>
 *       {balance.tokens.map(t => (
 *         <p key={t.token.address}>{t.token.symbol}: {t.formatted}</p>
 *       ))}
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBalance(options: UseBalanceOptions = {}): UseBalanceReturn {
    const { pollInterval = 15_000, enabled = true } = options;
    const sdk = useVeridexSDK();
    const [balance, setBalance] = useState<PortfolioBalance | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const mountedRef = useRef(true);

    const fetchBalance = useCallback(async () => {
        try {
            setLoading(true);
            const portfolio = await sdk.getVaultBalances();
            if (mountedRef.current) {
                setBalance(portfolio);
                setError(null);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err : new Error(String(err)));
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [sdk]);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Check if credential is set
        const cred = sdk.passkey.getCredential();
        if (!cred) return;

        void fetchBalance();

        const timer = setInterval(() => void fetchBalance(), pollInterval);
        return () => clearInterval(timer);
    }, [sdk, enabled, pollInterval, fetchBalance]);

    return { balance, loading, error, refetch: fetchBalance };
}
