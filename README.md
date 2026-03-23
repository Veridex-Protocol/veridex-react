# @veridex/react

React hooks for [Veridex Protocol SDK](https://www.npmjs.com/package/@veridex/sdk). Passkeys, vaults, transfers, and balances — all with loading/error states built in.

```bash
npm install @veridex/react @veridex/sdk react
```

## Quick Start

```tsx
import { createSDK } from '@veridex/sdk';
import { VeridexProvider, usePasskey, useBalance, useTransfer } from '@veridex/react';

const sdk = createSDK('base', { network: 'testnet' });

function App() {
  return (
    <VeridexProvider sdk={sdk}>
      <Wallet />
    </VeridexProvider>
  );
}

function Wallet() {
  const { credential, register, authenticate, loading } = usePasskey();
  const { balance } = useBalance();
  const { prepare, execute, step, prepared, result } = useTransfer();

  if (!credential) {
    return (
      <div>
        <button onClick={() => register('user@example.com', 'My Wallet')} disabled={loading}>
          Create Wallet
        </button>
        <button onClick={() => authenticate()} disabled={loading}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Balance</h2>
      {balance?.tokens.map(t => (
        <p key={t.token.address}>{t.token.symbol}: {t.formatted}</p>
      ))}
    </div>
  );
}
```

## Hooks

| Hook | Purpose |
|------|---------|
| `useVeridexSDK()` | Access the SDK instance from context |
| `usePasskey()` | Register, authenticate, clear credentials |
| `useBalance()` | Poll vault balance with loading/error states |
| `useTransfer()` | Prepare → review → execute transfer flow |
| `useMultiChainPortfolio()` | Combined balance view across all chains |
| `useSpendingLimits()` | Monitor spending limits, check amounts |

## Requirements

- React 18+
- `@veridex/sdk` >= 1.0.0-beta.20
- Browser environment (passkeys require WebAuthn)

## License

MIT
