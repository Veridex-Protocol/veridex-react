import { useState, useEffect, useRef } from 'react';
import { useVeridexSDK, useNetwork } from './provider.js';
import { resolveChainIds, type ChainTarget } from './chains.js';
import type { PortfolioBalance } from '@veridex/sdk';

// ============================================================================
// Types
// ============================================================================

interface UseMultiChainPortfolioOptions {
    /**
     * Specific chains to query.
     *
     * Accepts chain names (`'base'`, `'solana'`) or numeric Wormhole chain IDs.
     * Names are resolved based on the `network` prop on `<VeridexProvider>`.
     * Defaults to all sponsored chains when omitted.
     */
    chains?: ChainTarget[];
    /** Poll interval in ms (default: 30000 — 30s, since multi-chain is expensive) */
    pollInterval?: number;
    /** Enable polling (default: true) */
    enabled?: boolean;
}

interface UseMultiChainPortfolioReturn {
    /** Portfolio entries per chain */
    portfolio: PortfolioBalance[];
    /** Vault addresses keyed by Wormhole chain ID */
    addresses: Record<number, string>;
    /** Whether a fetch is in progress */
    loading: boolean;
    /** Last error */
    error: Error | null;
    /** Manually refresh */
    refetch: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Get a combined portfolio view and vault addresses across all chains.
 *
 * Accepts chain names (`'base'`, `'solana'`) instead of numeric IDs.
 * Names are resolved based on the `network` prop on `<VeridexProvider>`.
 *
 * @example
 * ```tsx
 * function PortfolioDashboard() {
 *   const { portfolio, addresses, loading } = useMultiChainPortfolio({
 *     chains: ['base', 'optimism', 'solana'],
 *   });
 *
 *   return (
 *     <div>
 *       {portfolio.map(entry => (
 *         <div key={entry.wormholeChainId}>
 *           <h3>{entry.chainName}</h3>
 *           <p>Address: {addresses[entry.wormholeChainId]}</p>
 *           {entry.tokens.map(t => (
 *             <p key={t.token.address}>{t.token.symbol}: {t.formatted}</p>
 *           ))}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMultiChainPortfolio(
    options: UseMultiChainPortfolioOptions = {},
): UseMultiChainPortfolioReturn {
    const { chains, pollInterval = 30_000, enabled = true } = options;
    const sdk = useVeridexSDK();
    const network = useNetwork();
    const [portfolio, setPortfolio] = useState<PortfolioBalance[]>([]);
    const [addresses, setAddresses] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refetch = async () => {
        try {
            setLoading(true);

            // Get addresses synchronously
            const addrs = sdk.getMultiChainAddresses();
            if (mountedRef.current) setAddresses(addrs);

            // Resolve chain names → Wormhole IDs
            const chainIds = chains ? resolveChainIds(chains, network) : undefined;

            // Get portfolio asynchronously
            const p = await sdk.getMultiChainPortfolio(chainIds);
            if (mountedRef.current) {
                setPortfolio(p);
                setError(null);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err : new Error(String(err)));
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    };

    useEffect(() => {
        if (!enabled) return;
        const cred = sdk.passkey.getCredential();
        if (!cred) return;

        void refetch();
        const timer = setInterval(() => void refetch(), pollInterval);
        return () => clearInterval(timer);
    }, [sdk, enabled, pollInterval, chains?.join(','), network]);

    return { portfolio, addresses, loading, error, refetch };
}
