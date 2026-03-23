import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { VeridexSDK, NetworkType } from '@veridex/sdk';

// ============================================================================
// Context
// ============================================================================

interface VeridexContextValue {
    sdk: VeridexSDK;
    network: NetworkType;
}

const VeridexContext = createContext<VeridexContextValue | null>(null);

/**
 * Hook to access the VeridexSDK instance from context.
 *
 * Must be used within a `<VeridexProvider>`.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const sdk = useVeridexSDK();
 *   const address = sdk.getVaultAddress();
 * }
 * ```
 */
export function useVeridexSDK(): VeridexSDK {
    const ctx = useContext(VeridexContext);
    if (!ctx) {
        throw new Error(
            'useVeridexSDK must be used within a <VeridexProvider>. ' +
            'Wrap your app or component tree with <VeridexProvider sdk={sdk}>.',
        );
    }
    return ctx.sdk;
}

/**
 * Hook to access the current network type ('mainnet' | 'testnet').
 *
 * Must be used within a `<VeridexProvider>`.
 */
export function useNetwork(): NetworkType {
    const ctx = useContext(VeridexContext);
    if (!ctx) {
        throw new Error(
            'useNetwork must be used within a <VeridexProvider>. ' +
            'Wrap your app or component tree with <VeridexProvider sdk={sdk}>.',
        );
    }
    return ctx.network;
}

// ============================================================================
// Provider
// ============================================================================

interface VeridexProviderProps {
    /** A VeridexSDK instance (created via `createSDK()`). */
    sdk: VeridexSDK;
    /**
     * Network type for chain name resolution.
     *
     * - `'mainnet'` — resolves chain names to mainnet Wormhole chain IDs.
     * - `'testnet'` (default) — resolves to testnet/devnet IDs.
     */
    network?: NetworkType;
    children: ReactNode;
}

/**
 * Provides a VeridexSDK instance and network context to all child hooks.
 *
 * Create the SDK **outside** the component tree (or in a `useMemo`) to
 * avoid re-creating it on every render.
 *
 * @example
 * ```tsx
 * import { createSDK } from '@veridex/sdk';
 * import { VeridexProvider } from '@veridex/react';
 *
 * const sdk = createSDK('base', { network: 'testnet' });
 *
 * function App() {
 *   return (
 *     <VeridexProvider sdk={sdk}>
 *       <MyWalletPage />
 *     </VeridexProvider>
 *   );
 * }
 *
 * // For mainnet:
 * // <VeridexProvider sdk={sdk} network="mainnet">
 * ```
 */
export function VeridexProvider({ sdk, network = 'testnet', children }: VeridexProviderProps) {
    const value = useMemo(() => ({ sdk, network }), [sdk, network]);
    return (
        <VeridexContext.Provider value={value}>
            {children}
        </VeridexContext.Provider>
    );
}
