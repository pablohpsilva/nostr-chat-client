import {
  NDKEvent,
  NDKFilter,
  NDKPrivateKeySigner,
  useNDK,
  useNDKSessionLogin,
  useNDKSessionLogout,
} from "@nostr-dev-kit/ndk-mobile";
import { nip19 } from "nostr-tools";

export default function useNDKWrapper() {
  const { ndk } = useNDK();
  const ndkLogin = useNDKSessionLogin();
  const ndkLogout = useNDKSessionLogout();
  // const refUsers = useRef<{ [id: string]: NDKUser }>({});
  // const [users, setUsers] = useState<{ [id: string]: NDKUser }>({});

  async function fetchEvents(filter: NDKFilter): Promise<NDKEvent[]> {
    if (ndk === undefined) return [];

    return new Promise((resolve) => {
      const events: Map<string, NDKEvent> = new Map();

      const relaySetSubscription = ndk.subscribe(filter, {
        closeOnEose: true,
      });

      relaySetSubscription.on("event", (event: NDKEvent) => {
        event.ndk = ndk;
        events.set(event.tagId(), event);
      });

      relaySetSubscription.on("eose", () => {
        setTimeout(() => resolve(Array.from(new Set(events.values()))), 3000);
      });
    });
  }

  async function signPublishEvent(
    event: NDKEvent,
    params: { repost: boolean; publish: boolean; sign: boolean } | undefined = {
      repost: false,
      sign: true,
      publish: true,
    }
  ) {
    if (ndk === undefined) return;
    event.ndk = ndk;
    if (params.repost) {
      await event.repost();
    }
    if (params.sign) {
      await event.sign();
    }
    if (params.publish) {
      await event.publish();
    }
    return event;
  }

  async function fetchProfile(id: string) {
    if (ndk == undefined) {
      return;
    }

    // if (refUsers.current[id]) {
    //   return;
    // }

    // refUsers.current = {
    //   ...refUsers.current,
    //   [id]: NDKUser.prototype,
    // };

    let user;

    if (id.startsWith("npub")) {
      user = ndk.getUser({
        npub: id,
      });
    } else {
      user = ndk.getUser({
        hexpubkey: id,
      });
    }

    return await user.fetchProfile();

    // if (user.profile) {
    //   refUsers.current = {
    //     ...refUsers.current,
    //     [id]: user,
    //   };
    //   setUsers(refUsers.current);
    // }
  }

  // function getProfile(id: string) {
  //   if (users[id]) {
  //     return users[id].profile!;
  //   } else {
  //     fetchUser(id);
  //   }
  //   return {};
  // }

  async function _loginWithSecret(skOrNsec: string) {
    try {
      let privkey = skOrNsec;

      if (privkey.substring(0, 4) === "nsec") {
        privkey = nip19.decode(privkey).data as string;
      }

      const signer = new NDKPrivateKeySigner(privkey);
      return signer.user().then(async (user) => {
        if (user.npub) {
          return {
            user: user,
            npub: user.npub,
            sk: privkey,
            signer: signer,
          };
        }
      });
    } catch (e) {
      throw e;
    }
  }

  async function loginWithSecret(skOrNsec: string) {
    const res = await _loginWithSecret(skOrNsec);
    if (res) {
      const { signer } = res;
      await ndkLogin(signer);
      return res;
    }
  }

  async function logout() {
    await ndkLogout();
  }

  return {
    ndk,
    fetchEvents,
    signPublishEvent,
    loginWithSecret,
    logout,
    fetchProfile,
  };
}
