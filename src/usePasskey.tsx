import { useState, useCallback } from 'react';
import { useVeridexSDK } from './provider.js';
import type { PasskeyCredential } from '@veridex/sdk';

// ============================================================================
// Types
// ============================================================================

interface UsePasskeyReturn {
    /** Currently active credential (null if not authenticated) */
    credential: PasskeyCredential | null;
    /** Whether a passkey operation is in progress */
    loading: boolean;
    /** Last error from a passkey operation */
    error: Error | null;
    /** Register a new passkey (triggers biometric prompt) */
    register: (username: string, displayName: string) => Promise<PasskeyCredential>;
    /** Authenticate with existing passkey (shows picker) */
    authenticate: () => Promise<PasskeyCredential>;
    /** Clear current credential */
    clear: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manage passkey registration and authentication.
 *
 * @example
 * ```tsx
 * function LoginButton() {
 *   const { credential, register, authenticate, loading, error } = usePasskey();
 *
 *   if (credential) return <p>Logged in: {credential.keyHash}</p>;
 *
 *   return (
 *     <div>
 *       <button onClick={() => register('user@example.com', 'My Wallet')} disabled={loading}>
 *         {loading ? 'Creating...' : 'Create Wallet'}
 *       </button>
 *       <button onClick={() => authenticate()} disabled={loading}>
 *         {loading ? 'Signing in...' : 'Sign In'}
 *       </button>
 *       {error && <p className="error">{error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePasskey(): UsePasskeyReturn {
    const sdk = useVeridexSDK();
    const [credential, setCredential] = useState<PasskeyCredential | null>(
        () => sdk.passkey.getCredential(),
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const register = useCallback(
        async (username: string, displayName: string) => {
            setLoading(true);
            setError(null);
            try {
                const cred = await sdk.passkey.register(username, displayName);
                setCredential(cred);
                return cred;
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err));
                setError(e);
                throw e;
            } finally {
                setLoading(false);
            }
        },
        [sdk],
    );

    const authenticate = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { credential: cred } = await sdk.passkey.authenticate();
            setCredential(cred);
            return cred;
        } catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            setError(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [sdk]);

    const clear = useCallback(() => {
        sdk.clearCredential();
        setCredential(null);
        setError(null);
    }, [sdk]);

    return { credential, loading, error, register, authenticate, clear };
}
