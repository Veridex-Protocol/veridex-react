import { useState, useEffect, useRef } from 'react';
import { useVeridexSDK } from './provider.js';

// ============================================================================
// Types
// ============================================================================

interface SpendingLimitsData {
    dailyLimit: string;
    dailySpent: string;
    dailyRemaining: string;
    dailyUsedPercentage: number;
    transactionLimit: string;
    timeUntilReset: string;
}

interface UseSpendingLimitsReturn {
    /** Formatted spending limits */
    limits: SpendingLimitsData | null;
    /** Whether a fetch is in progress */
    loading: boolean;
    /** Last error */
    error: Error | null;
    /** Check if an amount is within limits */
    checkAmount: (amount: bigint) => Promise<{ allowed: boolean; message?: string }>;
    /** Manually refresh limits */
    refetch: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Monitor spending limits with live updates.
 *
 * @example
 * ```tsx
 * function SpendingLimitBar() {
 *   const { limits, loading, checkAmount } = useSpendingLimits();
 *
 *   if (loading || !limits) return <p>Loading limits...</p>;
 *
 *   return (
 *     <div>
 *       <progress value={limits.dailyUsedPercentage} max={100} />
 *       <p>{limits.dailyUsedPercentage}% used — resets in {limits.timeUntilReset}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSpendingLimits(): UseSpendingLimitsReturn {
    const sdk = useVeridexSDK();
    const [limits, setLimits] = useState<SpendingLimitsData | null>(null);
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
            const formatted = await sdk.getFormattedSpendingLimits();
            if (mountedRef.current) {
                setLimits({
                    dailyLimit: formatted.dailyLimit,
                    dailySpent: formatted.dailySpent,
                    dailyRemaining: formatted.dailyRemaining,
                    dailyUsedPercentage: formatted.dailyUsedPercentage,
                    transactionLimit: formatted.transactionLimit,
                    timeUntilReset: formatted.timeUntilReset,
                });
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
        const cred = sdk.passkey.getCredential();
        if (!cred) return;
        void refetch();
    }, [sdk]);

    const checkAmount = async (amount: bigint) => {
        const check = await sdk.checkSpendingLimit(amount);
        return { allowed: check.allowed, message: check.message };
    };

    return { limits, loading, error, checkAmount, refetch };
}
