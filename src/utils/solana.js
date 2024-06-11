import { BN } from "bn.js";
import BigNumber from "bignumber.js";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  AuthorityType,
  getMint,
  getAccount,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createInitializeAccountInstruction,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  createBurnInstruction,
  createCloseAccountInstruction,
} from "@solana/spl-token";
import {
  Token,
  TxVersion,
  TokenAmount,
  MarketV2,
  LOOKUP_TABLE_CACHE,
  DEVNET_PROGRAM_ID,
  MAINNET_PROGRAM_ID,
  SPL_ACCOUNT_LAYOUT,
  MARKET_STATE_LAYOUT_V2,
  InstructionType,
  Liquidity,
  generatePubKey,
  struct,
  u8,
  u16,
  u32,
  u64,
  splitTxAndSigners,
  poolKeys2JsonInfo,
  buildSimpleTransaction,
} from "@raydium-io/raydium-sdk";
import { Market, MARKET_STATE_LAYOUT_V3 } from "@project-serum/serum";
import {
  PROGRAM_ID,
  Metadata,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import axios from "axios";

const PROGRAMIDS =
  process.env.REACT_APP_DEVNET_MODE === "true"
    ? DEVNET_PROGRAM_ID
    : MAINNET_PROGRAM_ID;
const addLookupTableInfo =
  process.env.REACT_APP_DEVNET_MODE === "true" ? undefined : LOOKUP_TABLE_CACHE;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export const USE_BACKEND = true;

async function makeCreateMarketInstruction({
  connection,
  owner,
  baseInfo,
  quoteInfo,
  lotSize, // 1
  tickSize, // 0.01
  dexProgramId,
  makeTxVersion,
  lookupTableCache,
}) {
  const market = generatePubKey({
    fromPublicKey: owner,
    programId: dexProgramId,
  });
  const requestQueue = generatePubKey({
    fromPublicKey: owner,
    programId: dexProgramId,
  });
  const eventQueue = generatePubKey({
    fromPublicKey: owner,
    programId: dexProgramId,
  });
  const bids = generatePubKey({
    fromPublicKey: owner,
    programId: dexProgramId,
  });
  const asks = generatePubKey({
    fromPublicKey: owner,
    programId: dexProgramId,
  });
  const baseVault = generatePubKey({
    fromPublicKey: owner,
    programId: TOKEN_PROGRAM_ID,
  });
  const quoteVault = generatePubKey({
    fromPublicKey: owner,
    programId: TOKEN_PROGRAM_ID,
  });
  const feeRateBps = 0;
  const quoteDustThreshold = new BN(100);

  function getVaultOwnerAndNonce() {
    const vaultSignerNonce = new BN(0);
    while (true) {
      try {
        const vaultOwner = PublicKey.createProgramAddressSync(
          [
            market.publicKey.toBuffer(),
            vaultSignerNonce.toArrayLike(Buffer, "le", 8),
          ],
          dexProgramId
        );
        return { vaultOwner, vaultSignerNonce };
      } catch (e) {
        vaultSignerNonce.iaddn(1);
        if (vaultSignerNonce.gt(new BN(25555)))
          throw Error("find vault owner error");
      }
    }
  }

  function initializeMarketInstruction({ programId, marketInfo }) {
    const dataLayout = struct([
      u8("version"),
      u32("instruction"),
      u64("baseLotSize"),
      u64("quoteLotSize"),
      u16("feeRateBps"),
      u64("vaultSignerNonce"),
      u64("quoteDustThreshold"),
    ]);

    const keys = [
      { pubkey: marketInfo.id, isSigner: false, isWritable: true },
      { pubkey: marketInfo.requestQueue, isSigner: false, isWritable: true },
      { pubkey: marketInfo.eventQueue, isSigner: false, isWritable: true },
      { pubkey: marketInfo.bids, isSigner: false, isWritable: true },
      { pubkey: marketInfo.asks, isSigner: false, isWritable: true },
      { pubkey: marketInfo.baseVault, isSigner: false, isWritable: true },
      { pubkey: marketInfo.quoteVault, isSigner: false, isWritable: true },
      { pubkey: marketInfo.baseMint, isSigner: false, isWritable: false },
      { pubkey: marketInfo.quoteMint, isSigner: false, isWritable: false },
      // Use a dummy address if using the new dex upgrade to save tx space.
      {
        pubkey: marketInfo.authority
          ? marketInfo.quoteMint
          : SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ]
      .concat(
        marketInfo.authority
          ? { pubkey: marketInfo.authority, isSigner: false, isWritable: false }
          : []
      )
      .concat(
        marketInfo.authority && marketInfo.pruneAuthority
          ? {
              pubkey: marketInfo.pruneAuthority,
              isSigner: false,
              isWritable: false,
            }
          : []
      );

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
      {
        version: 0,
        instruction: 0,
        baseLotSize: marketInfo.baseLotSize,
        quoteLotSize: marketInfo.quoteLotSize,
        feeRateBps: marketInfo.feeRateBps,
        vaultSignerNonce: marketInfo.vaultSignerNonce,
        quoteDustThreshold: marketInfo.quoteDustThreshold,
      },
      data
    );

    return new TransactionInstruction({
      keys,
      programId,
      data,
    });
  }

  const { vaultOwner, vaultSignerNonce } = getVaultOwnerAndNonce();

  const ZERO = new BN(0);
  const baseLotSize = new BN(Math.round(10 ** baseInfo.decimals * lotSize));
  const quoteLotSize = new BN(
    Math.round(lotSize * 10 ** quoteInfo.decimals * tickSize)
  );
  if (baseLotSize.eq(ZERO)) throw Error("lot size is too small");
  if (quoteLotSize.eq(ZERO)) throw Error("tick size or lot size is too small");

  const ins1 = [];
  const accountLamports = await connection.getMinimumBalanceForRentExemption(
    165
  );
  ins1.push(
    SystemProgram.createAccountWithSeed({
      fromPubkey: owner,
      basePubkey: owner,
      seed: baseVault.seed,
      newAccountPubkey: baseVault.publicKey,
      lamports: accountLamports,
      space: 165,
      programId: TOKEN_PROGRAM_ID,
    }),
    SystemProgram.createAccountWithSeed({
      fromPubkey: owner,
      basePubkey: owner,
      seed: quoteVault.seed,
      newAccountPubkey: quoteVault.publicKey,
      lamports: accountLamports,
      space: 165,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(
      baseVault.publicKey,
      baseInfo.mint,
      vaultOwner
    ),
    createInitializeAccountInstruction(
      quoteVault.publicKey,
      quoteInfo.mint,
      vaultOwner
    )
  );

  const EVENT_QUEUE_ITEMS = 128; // Default: 2978
  const REQUEST_QUEUE_ITEMS = 63; // Default: 63
  const ORDERBOOK_ITEMS = 201; // Default: 909

  const eventQueueSpace = EVENT_QUEUE_ITEMS * 88 + 44 + 48;
  const requestQueueSpace = REQUEST_QUEUE_ITEMS * 80 + 44 + 48;
  const orderBookSpace = ORDERBOOK_ITEMS * 80 + 44 + 48;

  const ins2 = [];
  ins2.push(
    SystemProgram.createAccountWithSeed({
      fromPubkey: owner,
      basePubkey: owner,
      seed: market.seed,
      newAccountPubkey: market.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        MARKET_STATE_LAYOUT_V2.span
      ),
      space: MARKET_STATE_LAYOUT_V2.span,
      programId: dexProgramId,
    }),
    SystemProgram.createAccountWithSeed({
      fromPubkey: owner,
      basePubkey: owner,
      seed: requestQueue.seed,
      newAccountPubkey: requestQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        requestQueueSpace
      ),
      space: requestQueueSpace,
      programId: dexProgramId,
    }),
    SystemProgram.createAccountWithSeed({
      fromPubkey: owner,
      basePubkey: owner,
      seed: eventQueue.seed,
      newAccountPubkey: eventQueue.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        eventQueueSpace
      ),
      space: eventQueueSpace,
      programId: dexProgramId,
    }),
    SystemProgram.createAccountWithSeed({
      fromPubkey: owner,
      basePubkey: owner,
      seed: bids.seed,
      newAccountPubkey: bids.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        orderBookSpace
      ),
      space: orderBookSpace,
      programId: dexProgramId,
    }),
    SystemProgram.createAccountWithSeed({
      fromPubkey: owner,
      basePubkey: owner,
      seed: asks.seed,
      newAccountPubkey: asks.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        orderBookSpace
      ),
      space: orderBookSpace,
      programId: dexProgramId,
    }),
    initializeMarketInstruction({
      programId: dexProgramId,
      marketInfo: {
        id: market.publicKey,
        requestQueue: requestQueue.publicKey,
        eventQueue: eventQueue.publicKey,
        bids: bids.publicKey,
        asks: asks.publicKey,
        baseVault: baseVault.publicKey,
        quoteVault: quoteVault.publicKey,
        baseMint: baseInfo.mint,
        quoteMint: quoteInfo.mint,
        baseLotSize: baseLotSize,
        quoteLotSize: quoteLotSize,
        feeRateBps: feeRateBps,
        vaultSignerNonce: vaultSignerNonce,
        quoteDustThreshold: quoteDustThreshold,
      },
    })
  );

  const ins = {
    address: {
      marketId: market.publicKey,
      requestQueue: requestQueue.publicKey,
      eventQueue: eventQueue.publicKey,
      bids: bids.publicKey,
      asks: asks.publicKey,
      baseVault: baseVault.publicKey,
      quoteVault: quoteVault.publicKey,
      baseMint: baseInfo.mint,
      quoteMint: quoteInfo.mint,
    },
    innerTransactions: [
      {
        instructions: ins1,
        signers: [],
        instructionTypes: [
          InstructionType.createAccount,
          InstructionType.createAccount,
          InstructionType.initAccount,
          InstructionType.initAccount,
        ],
      },
      {
        instructions: ins2,
        signers: [],
        instructionTypes: [
          InstructionType.createAccount,
          InstructionType.createAccount,
          InstructionType.createAccount,
          InstructionType.createAccount,
          InstructionType.createAccount,
          InstructionType.initMarket,
        ],
      },
    ],
  };

  return {
    address: ins.address,
    innerTransactions: await splitTxAndSigners({
      connection,
      makeTxVersion,
      computeBudgetConfig: undefined,
      payer: owner,
      innerTransaction: ins.innerTransactions,
      lookupTableCache,
    }),
  };
}

export async function getTipTransaction(connection, ownerPubkey, tip) {
  const TIP_ADDRESSES = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5", // Jitotip 1
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe", // Jitotip 2
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY", // Jitotip 3
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49", // Jitotip 4
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh", // Jitotip 5
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt", // Jitotip 6
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL", // Jitotip 7
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT", // Jitotip 8
  ];
  // const getRandomNumber = (min, max) => {
  //     return Math.floor(Math.random() * (max - min + 1)) + min;
  // };
  console.log("Adding tip transactions...");

  const tipAccount = new PublicKey(TIP_ADDRESSES[0]);
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: ownerPubkey,
      toPubkey: tipAccount,
      lamports: LAMPORTS_PER_SOL * tip,
    }),
  ];
  const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const messageV0 = new TransactionMessage({
    payerKey: ownerPubkey,
    recentBlockhash,
    instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
}

export async function getWalletTokenAccount(connection, ownerPubkey) {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(
    ownerPubkey,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );
  return walletTokenAccount.value.map((item) => ({
    pubkey: item.pubkey,
    programId: item.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(item.account.data),
  }));
}

export async function getTokenListByOwner(
  connection,
  ownerPubkey,
  queryMarketId
) {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(
    ownerPubkey,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );
  const tokenList = await Promise.all(
    walletTokenAccount.value.map(async (item) => {
      const accountInfo = SPL_ACCOUNT_LAYOUT.decode(item.account.data);
      const mintInfo = await getMint(connection, accountInfo.mint);
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          PROGRAM_ID.toBuffer(),
          accountInfo.mint.toBuffer(),
        ],
        PROGRAM_ID
      );

      let marketId = null;
      if (queryMarketId) {
        const quoteMint = new PublicKey(
          "So11111111111111111111111111111111111111112"
        );
        const marketAccounts = await Market.findAccountsByMints(
          connection,
          accountInfo.mint,
          quoteMint,
          PROGRAMIDS.OPENBOOK_MARKET
        );
        if (marketAccounts.length > 0) marketId = marketAccounts[0].publicKey;
      }

      let tokenName;
      let tokenSymbol;
      try {
        const metadata = await Metadata.fromAccountAddress(
          connection,
          metadataPDA
        );
        tokenName = metadata.data.name;
        tokenSymbol = metadata.data.symbol;
      } catch (err) {
        // console.log(err);
        tokenName = "";
        tokenSymbol = "";
      }

      return {
        name: tokenName,
        symbol: tokenSymbol,
        mint: accountInfo.mint.toBase58(),
        account: item.pubkey.toBase58(),
        balance: accountInfo.amount
          .div(new BN(Math.pow(10, mintInfo.decimals)))
          .toString(),
        marketId: queryMarketId && marketId ? marketId : undefined,
      };
    })
  );
  return tokenList;
}

export async function getPoolInfo(connection, token) {
  console.log("Getting pool info...", token);

  if (!token) {
    console.log("Invalid token address");
    return {};
  }

  const mint = new PublicKey(token);
  const mintInfo = await getMint(connection, mint);

  const baseToken = new Token(TOKEN_PROGRAM_ID, token, mintInfo.decimals);
  const quoteToken = new Token(
    TOKEN_PROGRAM_ID,
    "So11111111111111111111111111111111111111112",
    9,
    "WSOL",
    "WSOL"
  );

  const marketAccounts = await Market.findAccountsByMints(
    connection,
    baseToken.mint,
    quoteToken.mint,
    PROGRAMIDS.OPENBOOK_MARKET
  );
  if (marketAccounts.length === 0) {
    console.log("Not found market info");
    return {};
  }

  const marketInfo = MARKET_STATE_LAYOUT_V3.decode(
    marketAccounts[0].accountInfo.data
  );
  let poolKeys = Liquidity.getAssociatedPoolKeys({
    version: 4,
    marketVersion: 4,
    baseMint: baseToken.mint,
    quoteMint: quoteToken.mint,
    baseDecimals: baseToken.decimals,
    quoteDecimals: quoteToken.decimals,
    marketId: marketAccounts[0].publicKey,
    programId: PROGRAMIDS.AmmV4,
    marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
  });
  poolKeys.marketBaseVault = marketInfo.baseVault;
  poolKeys.marketQuoteVault = marketInfo.quoteVault;
  poolKeys.marketBids = marketInfo.bids;
  poolKeys.marketAsks = marketInfo.asks;
  poolKeys.marketEventQueue = marketInfo.eventQueue;

  const poolInfo = poolKeys2JsonInfo(poolKeys);
  return poolInfo;
}

export async function getLPBalance(
  connection,
  baseMintAddress,
  quoteMintAddress,
  ownerPubkey
) {
  if (!baseMintAddress || !quoteMintAddress) {
    console.log("Invalid base or quote token address");
    return 0;
  }

  try {
    const baseMint = new PublicKey(baseMintAddress);
    const baseMintInfo = await getMint(connection, baseMint);

    const quoteMint = new PublicKey(quoteMintAddress);
    const quoteMintInfo = await getMint(connection, quoteMint);

    const baseToken = new Token(
      TOKEN_PROGRAM_ID,
      baseMint,
      baseMintInfo.decimals
    );
    const quoteToken = new Token(
      TOKEN_PROGRAM_ID,
      quoteMint,
      quoteMintInfo.decimals
    );

    const marketAccounts = await Market.findAccountsByMints(
      connection,
      baseToken.mint,
      quoteToken.mint,
      PROGRAMIDS.OPENBOOK_MARKET
    );
    if (marketAccounts.length === 0) {
      console.log("Not found market info");
      return 0;
    }

    for (let i = 0; i < marketAccounts.length; i++) {
      const poolKeys = Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 4,
        baseMint: baseToken.mint,
        quoteMint: quoteToken.mint,
        baseDecimals: baseToken.decimals,
        quoteDecimals: quoteToken.decimals,
        marketId: marketAccounts[i].publicKey,
        programId: PROGRAMIDS.AmmV4,
        marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
      });
      console.log("LP Mint:", poolKeys.lpMint.toBase58());

      try {
        const lpATA = await getAssociatedTokenAddress(
          poolKeys.lpMint,
          ownerPubkey
        );
        const lpAccount = await getAccount(connection, lpATA);
        const balance = new BN(lpAccount.amount)
          .div(new BN(Math.pow(10, poolKeys.lpDecimals)))
          .toString();
        console.log("LP Balance:", balance);
        return balance;
      } catch (err) {
        console.log(err);
      }
    }
    return 0;
  } catch (err) {
    console.log(err);
  }
  return 0;
}

export async function sendAndConfirmSignedTransactions(
  useBackend,
  connection,
  transactions,
  apiServerURL,
  accessToken,
  userID,
  tx_type
) {
  if (useBackend) {
    try {
      const base64Txns = transactions.map((item) =>
        Buffer.from(item.serialize()).toString("base64")
      );
      await axios.post(
        `${apiServerURL}/api/v1/misc/run-transaction`,
        {
          userID: userID,
          tx_type,
          transactions: base64Txns,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "MW-USER-ID": accessToken,
          },
        }
      );
      return true;
    } catch (err) {
      console.log(err);
    }
  } else {
    let retries = 10;
    let passed = {};

    const rawTransactions = transactions.map((transaction) => {
      return transaction.serialize();
    });

    while (retries > 0) {
      try {
        let pendings = {};
        for (let i = 0; i < rawTransactions.length; i++) {
          if (!passed[i]) {
            pendings[i] = connection.sendRawTransaction(rawTransactions[i], {
              skipPreflight: true,
              maxRetries: 1,
            });
          }
        }

        let signatures = {};
        for (let i = 0; i < rawTransactions.length; i++) {
          if (!passed[i]) signatures[i] = await pendings[i];
        }

        const sentTime = Date.now();
        while (Date.now() - sentTime <= 1000) {
          for (let i = 0; i < rawTransactions.length; i++) {
            if (!passed[i]) {
              const ret = await connection.getParsedTransaction(signatures[i], {
                commitment: "finalized",
                maxSupportedTransactionVersion: 0,
              });
              if (ret) {
                // console.log("Slot:", ret.slot);
                // if (ret.transaction) {
                //     console.log("Signatures:", ret.transaction.signatures);
                //     console.log("Message:", ret.transaction.message);
                // }
                passed[i] = true;
              }
            }
          }

          let done = true;
          for (let i = 0; i < rawTransactions.length; i++) {
            if (!passed[i]) {
              done = false;
              break;
            }
          }

          if (done) return true;

          await sleep(500);
        }
      } catch (err) {
        console.log(err);
      }
      retries--;
    }
  }

  return false;
}

export async function createToken(
  connection,
  ownerPubkey,
  name,
  symbol,
  uri,
  decimals,
  totalSupply
) {
  // console.log("Creating token transaction...", name, symbol, decimals, totalSupply);
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  const mintKeypair = Keypair.generate();
  const tokenATA = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    ownerPubkey
  );

  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      PROGRAM_ID.toBuffer(),
      mintKeypair.publicKey.toBuffer(),
    ],
    PROGRAM_ID
  );
  console.log(name, symbol, mintKeypair.publicKey.toBase58());

  const tokenMetadata = {
    name: name,
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const instructions = [
    SystemProgram.createAccount({
      fromPubkey: ownerPubkey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      ownerPubkey,
      null,
      TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountInstruction(
      ownerPubkey,
      tokenATA,
      ownerPubkey,
      mintKeypair.publicKey
    ),
    createMintToInstruction(
      mintKeypair.publicKey,
      tokenATA,
      ownerPubkey,
      totalSupply * Math.pow(10, decimals)
    ),
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mintKeypair.publicKey,
        mintAuthority: ownerPubkey,
        payer: ownerPubkey,
        updateAuthority: ownerPubkey,
      },
      {
        createMetadataAccountArgsV3: {
          data: tokenMetadata,
          isMutable: true,
          collectionDetails: null,
        },
      }
    ),
  ];
  const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const message = new TransactionMessage({
    payerKey: ownerPubkey,
    recentBlockhash,
    instructions,
  });
  const transaction = new VersionedTransaction(
    message.compileToV0Message(Object.values({ ...(addLookupTableInfo ?? {}) }))
  );
  transaction.sign([mintKeypair]);

  return { mint: mintKeypair.publicKey, transaction: transaction };
}

export async function setMintAuthority(
  connection,
  mintAddress,
  ownerPubkey,
  newAuthority
) {
  const mint = new PublicKey(mintAddress);

  const transaction = new Transaction().add(
    createSetAuthorityInstruction(
      mint,
      ownerPubkey,
      AuthorityType.MintTokens,
      newAuthority ? new PublicKey(newAuthority) : null
    )
  );
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  transaction.feePayer = ownerPubkey;

  return transaction;
}

export async function setFreezeAuthority(
  connection,
  mintAddress,
  ownerPubkey,
  newAuthority
) {
  const mint = new PublicKey(mintAddress);

  const transaction = new Transaction().add(
    createSetAuthorityInstruction(
      mint,
      ownerPubkey,
      AuthorityType.FreezeAccount,
      newAuthority ? new PublicKey(newAuthority) : null
    )
  );
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  transaction.feePayer = ownerPubkey;

  return transaction;
}

export async function closeTokenAccount(connection, mintAddress, ownerPubkey) {
  const mint = new PublicKey(mintAddress);
  const tokenATA = await getAssociatedTokenAddress(mint, ownerPubkey);
  const tx = new Transaction().add(
    createCloseAccountInstruction(tokenATA, ownerPubkey, ownerPubkey)
  );
  tx.feePayer = ownerPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export async function burnTokenByPercent(
  connection,
  mintAddress,
  percent,
  ownerPubkey
) {
  const mint = new PublicKey(mintAddress);
  const tokenATA = await getAssociatedTokenAddress(mint, ownerPubkey);
  const tokenAccount = await getAccount(connection, tokenATA);
  const bnAmount = new BigNumber(tokenAccount.amount.toString())
    .dividedBy(new BigNumber(percent.toString()))
    .multipliedBy(new BigNumber("100"));
  const tx = new Transaction().add(
    createBurnInstruction(
      tokenAccount.address,
      mint,
      ownerPubkey,
      bnAmount.toFixed(0)
    )
  );
  tx.feePayer = ownerPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

// export async function createOpenBookMarket(
//   connection,
//   baseMintAddress,
//   quoteMintAddress,
//   lotSize,
//   tickSize,
//   ownerPubkey
// ) {
//   console.log("Creating OpenBook market...");

//   const baseMint = new PublicKey(baseMintAddress);
//   const baseMintInfo = await getMint(connection, baseMint);

//   const quoteMint = new PublicKey(quoteMintAddress);
//   const quoteMintInfo = await getMint(connection, quoteMint);

//   const baseToken = new Token(
//     TOKEN_PROGRAM_ID,
//     baseMint,
//     baseMintInfo.decimals
//   );
//   const quoteToken = new Token(
//     TOKEN_PROGRAM_ID,
//     quoteMint,
//     quoteMintInfo.decimals
//   );

//   const { innerTransactions, address } =
//     await MarketV2.makeCreateMarketInstructionSimple({
//       connection,
//       wallet: ownerPubkey,
//       baseInfo: baseToken,
//       quoteInfo: quoteToken,
//       lotSize: lotSize, // default 1
//       tickSize: tickSize, // default 0.01
//       dexProgramId: PROGRAMIDS.OPENBOOK_MARKET,
//       makeTxVersion: TxVersion.V0,
//     });

//   const transactions = await buildSimpleTransaction({
//     connection,
//     makeTxVersion: TxVersion.V0,
//     payer: ownerPubkey,
//     innerTransactions,
//     addLookupTableInfo,
//   });

//   // await sendAndConfirmTransactions(connection, payer, transactions);
//   console.log("created Market ID:", address.marketId.toBase58());
//   return { marketId: address.marketId, transactions };
// }

export async function createOpenBookMarket(
  connection,
  baseMintAddress,
  quoteMintAddress,
  lotSize,
  tickSize,
  ownerPubkey
) {
  console.log(
    "Creating OpenBook Market...",
    baseMintAddress,
    lotSize,
    tickSize,
    PROGRAMIDS.OPENBOOK_MARKET.toBase58()
  );

  const baseMint = new PublicKey(baseMintAddress);
  const baseMintInfo = await getMint(connection, baseMint);

  const quoteMint = new PublicKey(quoteMintAddress);
  const quoteMintInfo = await getMint(connection, quoteMint);

  const marketAccounts = await Market.findAccountsByMints(
    connection,
    baseMint,
    quoteMint,
    PROGRAMIDS.OPENBOOK_MARKET
  );
  if (marketAccounts.length > 0) {
    console.log("Already created OpenBook market!");
    return { marketId: marketAccounts[0].publicKey };
  }

  const baseToken = new Token(
    TOKEN_PROGRAM_ID,
    baseMint,
    baseMintInfo.decimals
  );
  const quoteToken = new Token(
    TOKEN_PROGRAM_ID,
    quoteMint,
    quoteMintInfo.decimals
  );

  // -------- step 1: make instructions --------
  const { innerTransactions, address } = await makeCreateMarketInstruction({
    connection,
    owner: ownerPubkey,
    baseInfo: baseToken,
    quoteInfo: quoteToken,
    lotSize: lotSize,
    tickSize: tickSize,
    dexProgramId: PROGRAMIDS.OPENBOOK_MARKET,
    makeTxVersion: TxVersion.V0,
  });

  const transactions = await buildSimpleTransaction({
    connection,
    makeTxVersion: TxVersion.V0,
    payer: ownerPubkey,
    innerTransactions,
    addLookupTableInfo,
  });

  return { marketId: address.marketId, transactions };
}

export async function createPool(
  connection,
  baseMintAddress,
  baseMintAmount,
  quoteMintAddress,
  quoteMintAmount,
  marketId,
  ownerPubkey
) {
  const baseMint = new PublicKey(baseMintAddress);
  const baseMintInfo = await getMint(connection, baseMint);

  const quoteMint = new PublicKey(quoteMintAddress);
  const quoteMintInfo = await getMint(connection, quoteMint);

  const baseToken = new Token(
    TOKEN_PROGRAM_ID,
    baseMint,
    baseMintInfo.decimals
  );
  const quoteToken = new Token(
    TOKEN_PROGRAM_ID,
    quoteMint,
    quoteMintInfo.decimals
  );

  const baseAmount = new BN(
    new BigNumber(
      baseMintAmount.toString() + "e" + baseMintInfo.decimals.toString()
    ).toFixed(0)
  );
  const quoteAmount = new BN(
    new BigNumber(
      quoteMintAmount.toString() + "e" + quoteMintInfo.decimals.toString()
    ).toFixed(0)
  );
  const walletTokenAccounts = await getWalletTokenAccount(
    connection,
    ownerPubkey
  );
  const startTime = Math.floor(Date.now() / 1000);

  const { innerTransactions } =
    await Liquidity.makeCreatePoolV4InstructionV2Simple({
      connection,
      programId: PROGRAMIDS.AmmV4,
      marketInfo: {
        marketId: new PublicKey(marketId),
        programId: PROGRAMIDS.OPENBOOK_MARKET,
      },
      baseMintInfo: baseToken,
      quoteMintInfo: quoteToken,
      baseAmount: baseAmount,
      quoteAmount: quoteAmount,
      startTime: new BN(startTime),
      ownerInfo: {
        feePayer: ownerPubkey,
        wallet: ownerPubkey,
        tokenAccounts: walletTokenAccounts,
        useSOLBalance: true,
      },
      associatedOnly: false,
      checkCreateATAOwner: true,
      makeTxVersion: TxVersion.V0,
      feeDestinationId:
        process.env.REACT_APP_DEVNET_MODE === "true"
          ? new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR")
          : new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5"),
    });

  const transactions = await buildSimpleTransaction({
    connection,
    makeTxVersion: TxVersion.V0,
    payer: ownerPubkey,
    innerTransactions,
  });

  return transactions;
}

export async function removeLiquidityByPercent(
  connection,
  baseMintAddress,
  quoteMintAddress,
  percent,
  ownerPubkey
) {
  const baseMint = new PublicKey(baseMintAddress);
  const baseMintInfo = await getMint(connection, baseMint);

  const quoteMint = new PublicKey(quoteMintAddress);
  const quoteMintInfo = await getMint(connection, quoteMint);

  const baseToken = new Token(
    TOKEN_PROGRAM_ID,
    baseMint,
    baseMintInfo.decimals
  );
  const quoteToken = new Token(
    TOKEN_PROGRAM_ID,
    quoteMint,
    quoteMintInfo.decimals
  );

  const marketAccounts = await Market.findAccountsByMints(
    connection,
    baseToken.mint,
    quoteToken.mint,
    PROGRAMIDS.OPENBOOK_MARKET
  );
  if (marketAccounts.length === 0) {
    console.log("Not found market info");
    return null;
  }
  console.log("Market Accounts:", marketAccounts);

  const walletTokenAccounts = await getWalletTokenAccount(
    connection,
    ownerPubkey
  );
  for (let i = 0; i < marketAccounts.length; i++) {
    const marketInfo = MARKET_STATE_LAYOUT_V3.decode(
      marketAccounts[i].accountInfo.data
    );
    console.log("Market Info:", marketInfo);

    let poolKeys = Liquidity.getAssociatedPoolKeys({
      version: 4,
      marketVersion: 3,
      baseMint: baseToken.mint,
      quoteMint: quoteToken.mint,
      baseDecimals: baseToken.decimals,
      quoteDecimals: quoteToken.decimals,
      marketId: marketAccounts[i].publicKey,
      programId: PROGRAMIDS.AmmV4,
      marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
    });

    try {
      const lpToken = new Token(
        TOKEN_PROGRAM_ID,
        poolKeys.lpMint,
        poolKeys.lpDecimals
      );
      const lpATA = await getAssociatedTokenAddress(
        poolKeys.lpMint,
        ownerPubkey
      );
      const lpAccount = await getAccount(connection, lpATA);
      const bnAmount = new BigNumber(lpAccount.amount.toString())
        .dividedBy(new BigNumber(percent.toString()))
        .multipliedBy(new BigNumber("100"));
      const amountIn = new TokenAmount(lpToken, bnAmount.toFixed(0));

      poolKeys.marketBaseVault = marketInfo.baseVault;
      poolKeys.marketQuoteVault = marketInfo.quoteVault;
      poolKeys.marketBids = marketInfo.bids;
      poolKeys.marketAsks = marketInfo.asks;
      poolKeys.marketEventQueue = marketInfo.eventQueue;

      const { innerTransactions } =
        await Liquidity.makeRemoveLiquidityInstructionSimple({
          connection,
          poolKeys,
          userKeys: {
            owner: ownerPubkey,
            payer: ownerPubkey,
            tokenAccounts: walletTokenAccounts,
          },
          amountIn: amountIn,
          makeTxVersion: TxVersion.V0,
        });

      const transactions = await buildSimpleTransaction({
        connection,
        makeTxVersion: TxVersion.V0,
        payer: ownerPubkey,
        innerTransactions,
        addLookupTableInfo,
      });

      return transactions;
    } catch (err) {
      console.log(err);
    }
  }

  return null;
}

export async function burnLPByPercent(
  connection,
  baseMintAddress,
  quoteMintAddress,
  percent,
  ownerPubkey
) {
  const baseMint = new PublicKey(baseMintAddress);
  const baseMintInfo = await getMint(connection, baseMint);

  const quoteMint = new PublicKey(quoteMintAddress);
  const quoteMintInfo = await getMint(connection, quoteMint);

  const baseToken = new Token(
    TOKEN_PROGRAM_ID,
    baseMint,
    baseMintInfo.decimals
  );
  const quoteToken = new Token(
    TOKEN_PROGRAM_ID,
    quoteMint,
    quoteMintInfo.decimals
  );

  const marketAccounts = await Market.findAccountsByMints(
    connection,
    baseToken.mint,
    quoteToken.mint,
    PROGRAMIDS.OPENBOOK_MARKET
  );
  if (marketAccounts.length === 0) {
    console.log("Not found market info");
    return null;
  }
  console.log("Market Accounts:", marketAccounts);

  for (let i = 0; i < marketAccounts.length; i++) {
    const marketInfo = MARKET_STATE_LAYOUT_V3.decode(
      marketAccounts[i].accountInfo.data
    );
    console.log("Market Info:", marketInfo);

    let poolKeys = Liquidity.getAssociatedPoolKeys({
      version: 4,
      marketVersion: 3,
      baseMint: baseToken.mint,
      quoteMint: quoteToken.mint,
      baseDecimals: baseToken.decimals,
      quoteDecimals: quoteToken.decimals,
      marketId: marketAccounts[i].publicKey,
      programId: PROGRAMIDS.AmmV4,
      marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
    });

    try {
      const lpATA = await getAssociatedTokenAddress(
        poolKeys.lpMint,
        ownerPubkey
      );
      const lpAccount = await getAccount(connection, lpATA);
      const bnAmount = new BigNumber(lpAccount.amount.toString())
        .dividedBy(new BigNumber(percent.toString()))
        .multipliedBy(new BigNumber("100"));
      const tx = new Transaction().add(
        createBurnInstruction(
          lpAccount.address,
          poolKeys.lpMint,
          ownerPubkey,
          bnAmount.toFixed(0)
        )
      );
      tx.feePayer = ownerPubkey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      return tx;
    } catch (err) {
      console.log(err);
    }
  }

  return null;
}
