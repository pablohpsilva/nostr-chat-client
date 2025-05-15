export const ROUTES = {
  ROOT: "/",
  CHAT: "/chatlist",
  CHAT_ID: "/chat/{nip}/{npub}",
  LOGIN: "/login",
};

export const fillRoute = (
  route: string,
  fillObject: Record<string, string | number> = {},
  queryParams = ""
) =>
  Object.entries(fillObject)
    .reduce((acc, [key, value]) => acc.replace(`{${key}}`, `${value}`), route)
    .concat(
      queryParams
        ? !queryParams.startsWith("?")
          ? `?${queryParams}`
          : queryParams ?? ""
        : ""
    );
