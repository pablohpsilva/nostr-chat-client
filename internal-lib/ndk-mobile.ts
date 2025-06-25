import NDK, {
  type NDKRelay,
  NDKCacheAdapterSqlite,
} from "@nostr-dev-kit/ndk-mobile";

import { DB_NAME, DEFAULT_RELAYS } from "@/constants";
// import { NET_DEBUG } from "@/utils/const";

const cacheAdapter = new NDKCacheAdapterSqlite(DB_NAME);
cacheAdapter.initialize();

/**
 * 1. Starts the app-database (which contains information about the relay list and stuff like that)
 * 2. Initializes the cache adapter
 * 3. Creates the NDK instance
 * 4. Connects to the relays
 * @returns
 */
let ndkInstance: NDK | null = null;

export function initializeNDK() {
  if (ndkInstance) {
    return ndkInstance;
  }

  const opts: any = {};
  if (process.env.NODE_ENV !== "production") {
    opts.netDebug = netDebug;
  }

  ndkInstance = new NDK({
    cacheAdapter,
    explicitRelayUrls: Object.keys(DEFAULT_RELAYS),
    blacklistRelayUrls: [],
    enableOutboxModel: true,
    initialValidationRatio: 0.0,
    lowestValidationRatio: 0.0,
    clientName: DB_NAME,
    clientNip89:
      "31990:fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52:1731850618505",
    profileConfig: {
      profileRefreshSeconds: 24 * 60 * 60,
    },
    ...opts,
  });
  cacheAdapter.ndk = ndkInstance;

  ndkInstance.connect();

  return ndkInstance;
}

const netDebug = (
  _msg: string,
  relay: NDKRelay,
  direction?: "send" | "recv"
) => {
  const _url = new URL(relay.url);
  if (direction === "send" && relay.url.match(/olas/)) {
    const asString = JSON.stringify(JSON.parse(_msg), null, 4);
    const lines = asString.split("\n");
    const newLines = lines.map((line) => `🟢 ${line}`);
    const newString = newLines.join("\n");
  }
  if (direction === "recv" && relay.url.match(/olas__/)) {
  }
};

const _timeZero = Date.now();
