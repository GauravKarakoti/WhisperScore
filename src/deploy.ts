/**
 * Deploy WhisperScore contract to a Midnight network.
 * Supports local devnet, preview, and preprod networks.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveNetwork, getOrCreateWallet, formatWalletBackupNotice, recordDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from './wallet';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';

// Midnight SDK imports
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

// Required for wallet sync in Node.js runtime
// @ts-expect-error WebSocket global assignment
globalThis.WebSocket = WebSocket;

// ─── Types & Configuration ─────────────────────────────────────────────────────

export interface WhisperScorePrivateState {
  userScore: bigint;
}

const PRIVATE_STATE_ID = 'whisperScorePrivateState';
const DEFAULT_INITIAL_THRESHOLD = 700n;

// Resolved from --network flag, .midnight-state.json, or defaulting to 'undeployed'
const { network, config: networkConfig } = resolveNetwork();
const WALLET = getOrCreateWallet(network);
const SEED = WALLET.seed;

{
  const notice = formatWalletBackupNotice(WALLET, network);
  if (notice) console.log(notice);
}

// ─── Proof Server Readiness ────────────────────────────────────────────────────

async function waitForProofServer(maxAttempts = 60, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fetch(networkConfig.proofServer, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return true;
    } catch (err: any) {
      const code = err?.cause?.code || err?.code || '';
      if (code !== 'ECONNREFUSED' && code !== 'UND_ERR_CONNECT_TIMEOUT' && code !== 'UND_ERR_SOCKET') {
        return true;
      }
    }
    if (attempt < maxAttempts) {
      process.stdout.write(`\r  Waiting for proof server... (${attempt}/${maxAttempts})   `);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

// ─── Compiled Contract Loading ─────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'whisper_score');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

if (!fs.existsSync(contractPath)) {
  console.error('\n❌ Contract not compiled! Run: compact compile\n');
  process.exit(1);
}

const WhisperScore = await import(pathToFileURL(contractPath).href);

// Bind private witness directly to private state
const compiledContract = CompiledContract.make('whisper_score', WhisperScore.Contract as any).pipe(
  (CompiledContract.withWitnesses as any)({
    privateUserValue: (context: { privateState: WhisperScorePrivateState }) => {
      return context.privateState?.userScore ?? 750n;
    },
  }),
  (CompiledContract.withCompiledFileAssets as any)(zkConfigPath),
);

// ─── Providers Setup ───────────────────────────────────────────────────────────

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword =
    process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Development-Placeholder-1';

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'whisperScore-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

// ─── Main Execution ────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Deploying WhisperScore to: ${network.toUpperCase()}`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('─── Wallet Setup ───────────────────────────────────────────────\n');
  console.log('  Initializing wallet...');
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
  const restoredCount = Object.values(walletCtx.restored).filter(Boolean).length;
  if (restoredCount > 0) {
    console.log(`  Restored ${restoredCount}/3 child wallets from state cache.`);
  }

  console.log('  Syncing with network state...');
  const syncStart = Date.now();
  const syncInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - syncStart) / 1000);
    process.stdout.write(`\r  ⏳ Syncing ledger... (${elapsed}s elapsed)   `);
  }, 5000);
  const state = await walletCtx.wallet.waitForSyncedState();
  clearInterval(syncInterval);
  process.stdout.write('\r  ✓ Synced with Midnight network.                             \n');

  await persistWalletState(network, walletCtx);

  const address = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`\n  Wallet Address: ${address}`);
  console.log(`  Balance:        ${balance.toLocaleString()} tNight\n`);

  if (network === 'undeployed' && balance === 0n) {
    console.error(
      '\n❌ Genesis wallet balance is 0. Check docker containers:\n' +
        '   docker compose down -v && docker compose up -d\n',
    );
    await walletCtx.wallet.stop();
    process.exit(1);
  }

  // Faucet Polling for public networks
  if (network !== 'undeployed' && networkConfig.faucet) {
    const initialBalance = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
    );
    const initialTNight = initialBalance.unshielded.balances[unshieldedToken().raw] ?? 0n;
    if (initialTNight === 0n) {
      console.log('─── Fund Wallet ────────────────────────────────────────────────\n');
      console.log(`  Address: ${address}`);
      console.log(`  Faucet:  ${networkConfig.faucet}\n`);
      console.log('  Waiting for tNIGHT funding...');

      const rawTimeout = Number(process.env.MIDNIGHT_FAUCET_TIMEOUT_MS);
      const timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 600_000;
      const start = Date.now();

      while (true) {
        await new Promise((r) => setTimeout(r, 10_000));
        const s = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((x) => x.isSynced)));
        const tn = s.unshielded.balances[unshieldedToken().raw] ?? 0n;
        if (tn > 0n) {
          console.log(`\n  ✓ Funded! tNIGHT balance: ${tn.toLocaleString()}\n`);
          break;
        }
        if (Date.now() - start > timeoutMs) {
          console.log(`\n  ❌ Funding timed out after ${Math.round(timeoutMs / 60_000)} min.`);
          await walletCtx.wallet.stop();
          process.exit(1);
        }
        const elapsed = Math.round((Date.now() - start) / 1000);
        process.stdout.write(`\r  ...waiting for faucet transaction (${elapsed}s elapsed)`);
      }
    }
  }

  // DUST Registration & Balance Check
  console.log('─── DUST Token Generation ──────────────────────────────────────\n');
  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  const unregisteredUtxos = dustState.unshielded.availableCoins.filter(
    (c: any) => !c.meta?.registeredForDustGeneration,
  );

  if (unregisteredUtxos.length > 0) {
    console.log(`  Registering ${unregisteredUtxos.length} UTXOs for DUST generation...`);
    const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
      unregisteredUtxos,
      walletCtx.unshieldedKeystore.getPublicKey(),
      (payload) => walletCtx.unshieldedKeystore.signData(payload),
    );
    const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
    await walletCtx.wallet.submitTransaction(finalized);
  }

  if (dustState.dust.balance(new Date()) === 0n) {
    console.log('  Waiting for active DUST balance...');
    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter((s) => s.isSynced),
        Rx.filter((s) => s.dust.balance(new Date()) > 0n),
      ),
    );
  }
  console.log('  ✓ DUST tokens ready.\n');

  // Deployment Setup
  console.log('─── Deploying Contract ─────────────────────────────────────────\n');
  const proofServerReady = await waitForProofServer();
  if (!proofServerReady) {
    console.log('\n  ❌ Proof server unreachable on port 6300. Start it with docker.\n');
    await walletCtx.wallet.stop();
    process.exit(1);
  }

  const providers = await createProviders(walletCtx);

  const initialThreshold = process.env.INITIAL_THRESHOLD
    ? BigInt(process.env.INITIAL_THRESHOLD)
    : DEFAULT_INITIAL_THRESHOLD;

  console.log(`  Configured Public Threshold: ${initialThreshold.toLocaleString()}`);
  process.stdout.write('  Generating initial DUST buffer...');
  await new Promise((r) => setTimeout(r, 6000));
  process.stdout.write(' done.\n');

  const MAX_RETRIES = 20;
  const RETRY_DELAY_MS = 5000;
  let deployed: Awaited<ReturnType<typeof deployContract>> | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      deployed = await deployContract(providers, {
        compiledContract: compiledContract as any,
        args: [initialThreshold],
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: {
          userScore: 750n,
        },
      });
      break;
    } catch (err: any) {
      const errMsg = err?.message || err?.toString() || '';
      const errCause = err?.cause?.message || err?.cause?.toString() || '';
      const fullError = `${errMsg} ${errCause}`;

      const isDustShortage =
        fullError.includes('Not enough Dust') ||
        fullError.includes('Insufficient Funds') ||
        fullError.includes('could not balance dust');

      if (!(isDustShortage && attempt === 1)) {
        console.error(`\n  Attempt ${attempt} error: ${errMsg}`);
        if (errCause && errCause !== errMsg) console.error(`  Cause: ${errCause}`);
      }

      if (
        !isDustShortage &&
        (fullError.includes('Failed to connect to Proof Server') ||
          fullError.includes('connect ECONNREFUSED 127.0.0.1:6300'))
      ) {
        console.log('  ❌ Proof server connection lost. Exiting.\n');
        await walletCtx.wallet.stop();
        process.exit(1);
      }

      if (isDustShortage) {
        const currentState = await walletCtx.wallet.waitForSyncedState();
        const dustBalance = currentState.dust.balance(new Date());
        if (attempt < MAX_RETRIES) {
          console.log(
            `  ⏳ Waiting for DUST ledger sync (Current: ${dustBalance.toLocaleString()}), retrying in ${
              RETRY_DELAY_MS / 1000
            }s...`,
          );
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        } else {
          console.log(`  ❌ Insufficient DUST balance after ${MAX_RETRIES} attempts.`);
          await walletCtx.wallet.stop();
          process.exit(1);
        }
      } else {
        throw err;
      }
    }
  }

  if (!deployed) throw new Error('Deployment failed to complete.');

  const contractAddress = deployed.deployTxData.public.contractAddress;
  console.log('  ✅ Contract successfully deployed on-chain!\n');
  console.log(`  Contract Address: ${contractAddress}\n`);

  recordDeployment(network, contractAddress, address.toString());
  console.log('  Recorded address to .midnight-state.json\n');

  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
  console.log('─── Next Steps ─────────────────────────────────────────────────\n');
  console.log('  1. Test execution CLI:    npm run cli');
  console.log('  2. Run frontend app:      cd frontend && npm run dev\n');
}

main().catch((err) => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});