import { getChainConfig } from '@veridex/sdk';
import type { ChainName, NetworkType } from '@veridex/sdk';

// ============================================================================
// Types
// ============================================================================

/** A chain target — either a friendly name ('base', 'solana') or a raw Wormhole chain ID. */
export type ChainTarget = ChainName | number;

// ============================================================================
// Resolution
// ============================================================================

/**
 * Resolve a chain name or numeric ID to a Wormhole chain ID.
 *
 * - If `chain` is a number, it's returned as-is (assumed to be a valid Wormhole ID).
 * - If `chain` is a chain name, it's looked up in the SDK presets for the given network.
 *
 * @example
 * ```ts
 * resolveChainId('base', 'testnet');   // 10004  (Base Sepolia)
 * resolveChainId('base', 'mainnet');   // 30     (Base Mainnet)
 * resolveChainId(10004, 'testnet');    // 10004  (passthrough)
 * ```
 */
export function resolveChainId(chain: ChainTarget, network: NetworkType): number {
    if (typeof chain === 'number') return chain;
    const config = getChainConfig(chain, network);
    return config.wormholeChainId;
}

/**
 * Resolve an array of chain targets to Wormhole chain IDs.
 */
export function resolveChainIds(chains: ChainTarget[], network: NetworkType): number[] {
    return chains.map((c) => resolveChainId(c, network));
}
