import * as SecureStore from "expo-secure-store";
import type * as SQLite from "expo-sqlite";

export const migrations = [
  {
    version: 0,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(
        `CREATE TABLE IF NOT EXISTS unpublished_events (
                    id TEXT PRIMARY KEY,
                    event TEXT,
                    relays TEXT,
                    last_try_at INTEGER
                );`
      );
    },
  },
  {
    version: 1,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(
        `CREATE TABLE IF NOT EXISTS nip60_wallet_proofs (
                    wallet_id TEXT,
                    proof_c TEXT,
                    mint TEXT,
                    token_id TEXT,
                    state TEXT,
                    raw TEXT,
                    created_at INTEGER,
                    updated_at INTEGER,
                    PRIMARY KEY (wallet_id, proof_c, mint),
                    UNIQUE (wallet_id, proof_c, mint)
                );`
      );
    },
  },

  {
    version: 2,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(
        `CREATE TABLE IF NOT EXISTS blacklisted_words (
                    word TEXT PRIMARY KEY,
                    created_at INTEGER,
                    updated_at INTEGER
                );`
      );
    },
  },

  // {
  //   version: 3,
  //   up: (db: SQLite.SQLiteDatabase) => {
  //     db.execSync(
  //       `CREATE TABLE IF NOT EXISTS saved_searches (
  //                   title TEXT PRIMARY KEY,
  //                   subtitle TEXT,
  //                   hashtags TEXT,
  //                   created_at INTEGER,
  //                   updated_at INTEGER,
  //                   last_used_at INTEGER
  //               );`
  //     );

  //     for (const search of predefinedSearches) {
  //       db.runSync(
  //         "INSERT OR REPLACE INTO saved_searches (title, subtitle, hashtags, created_at, updated_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?);",
  //         [
  //           search.title,
  //           search.subTitle,
  //           search.hashtags.join(" "),
  //           Date.now(),
  //           Date.now(),
  //           Date.now(),
  //         ]
  //       );
  //     }
  //   },
  // },

  {
    version: 4,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(
        `CREATE TABLE IF NOT EXISTS relays (
                    url TEXT PRIMARY KEY,
                    connect BOOLEAN
                );`
      );
    },
  },

  {
    version: 5,
    up: (db: SQLite.SQLiteDatabase) => {
      const relays = (SecureStore.getItem("relays") || "").split(",");
      for (const relay of relays) {
        db.runSync(
          "INSERT OR REPLACE INTO relays (url, connect) VALUES (?, ?);",
          [relay, true]
        );
      }
    },
  },

  {
    version: 6,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(
        `CREATE TABLE IF NOT EXISTS nwc_zaps (
                    preimage TEXT PRIMARY KEY,
                    recipient_pubkey TEXT,
                    recipient_event_id TEXT,
                    zap_type TEXT,
                    created_at INTEGER,
                    updated_at INTEGER
                );`
      );
    },
  },

  // {
  //   version: 7,
  //   up: (db: SQLite.SQLiteDatabase) => {
  //     db.execSync(
  //       `CREATE TABLE IF NOT EXISTS private_follows (
  //                   pubkey TEXT PRIMARY KEY,
  //                   created_at INTEGER
  //               );`
  //     );
  //   },
  // },

  {
    version: 8,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync("ALTER TABLE nwc_zaps RENAME COLUMN preimage TO pr;");
      db.execSync("ALTER TABLE nwc_zaps ADD COLUMN preimage TEXT;");
    },
  },

  {
    version: 9,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync("ALTER TABLE nwc_zaps ADD COLUMN amount INTEGER;");
      db.execSync("ALTER TABLE nwc_zaps ADD COLUMN unit TEXT;");
    },
  },

  {
    version: 10,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync("ALTER TABLE nwc_zaps ADD COLUMN pending_payment_id TEXT;");
    },
  },

  {
    version: 11,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(
        "CREATE INDEX IF NOT EXISTS idx_nwc_zaps_pending_payment_id ON nwc_zaps (pending_payment_id);"
      );
    },
  },

  {
    version: 12,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(`CREATE TABLE IF NOT EXISTS mint_info (
                url TEXT PRIMARY KEY,
                payload TEXT,
                created_at INTEGER,
                updated_at INTEGER
            )`);
    },
  },

  {
    version: 14,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(`CREATE TABLE IF NOT EXISTS mint_keys (
                url TEXT PRIMARY KEY,
                keyset_id TEXT,
                payload TEXT,
                created_at INTEGER,
                updated_at INTEGER
            )`);
    },
  },

  {
    version: 15,
    up: (db: SQLite.SQLiteDatabase) => {
      const walletConfig = SecureStore.getItem("wallet");
      db.execSync(`CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )`);

      if (walletConfig) {
        if (walletConfig === "none") {
          db.runSync(
            "INSERT INTO app_settings (key, value) VALUES ('wallet_type', 'none');"
          );
        } else {
          const payload = JSON.parse(walletConfig);
          db.runSync(
            `INSERT INTO app_settings (key, value) VALUES ('wallet_type', '${payload.type}');`
          );
          db.runSync(
            `INSERT INTO app_settings (key, value) VALUES ('wallet_payload', '${
              payload.pairingCode ?? payload.bech32
            }');`
          );
        }
      }

      SecureStore.deleteItemAsync("wallet");
      SecureStore.deleteItemAsync("wallet_last_updated_at");
    },
  },

  {
    version: 16,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(`CREATE TABLE IF NOT EXISTS payments (
                internal_id TEXT PRIMARY KEY,
                target_type TEXT,
                target_id TEXT,
                recipient TEXT,
                sender TEXT,
                comment TEXT,
                amount INTEGER,
                unit TEXT,
                status TEXT,
                created_at INTEGER,
                updated_at INTEGER,
                receipt_id TEXT
            )`);
    },
  },

  {
    version: 17,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(`CREATE TABLE IF NOT EXISTS pubkey_flares (
                pubkey TEXT PRIMARY KEY,
                flare_type TEXT,
                created_at INTEGER
            )`);
    },
  },
  // {
  //   version: 18,
  //   up: (db: SQLite.SQLiteDatabase) => {
  //     // Update the #photography saved search if it has the wrong hashtag
  //     db.runSync(
  //       `UPDATE saved_searches
  //                SET hashtags = REPLACE(hashtags, 'introductions', 'photography')
  //                WHERE title = '#photography' AND hashtags LIKE '%introductions%'`
  //     );
  //   },
  // },
  {
    version: 19,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync(
        `CREATE TABLE IF NOT EXISTS image_cache (
                    original_url TEXT NOT NULL,
                    width INTEGER,
                    state TEXT NOT NULL,
                    filesystem_key TEXT NOT NULL,
                    fetched_url TEXT,
                    attempts INTEGER DEFAULT 0,
                    PRIMARY KEY (original_url, width)
                );`
      );
    },
  },
  {
    version: 20,
    up: (db: SQLite.SQLiteDatabase) => {
      // remove filesystem_key from image_cache
      db.execSync("ALTER TABLE image_cache DROP COLUMN filesystem_key;");
    },
  },
  {
    version: 21,
    up: (db: SQLite.SQLiteDatabase) => {
      db.execSync("ALTER TABLE image_cache ADD COLUMN cache_key TEXT;");
    },
  },
];
