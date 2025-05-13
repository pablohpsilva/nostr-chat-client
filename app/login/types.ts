export enum LoginMode {
  LOGIN = "login",
  CREATE = "create",
  CREATE_ADVANCED = "create-advanced",
  IMPORT = "import",
  IMPORT_ADVANCED = "import-advanced",
}

export interface KeysType {
  privateKey: string;
  publicKey: string;
  nsec: string;
  npub: string;
}
