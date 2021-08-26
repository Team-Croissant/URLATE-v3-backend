declare module "express-session" {
  interface SessionData {
    accessToken: unknown;
    refreshToken: unknown;
    userid: unknown;
    tempName: unknown;
    email: unknown;
    authorized: unknown;
    bag: unknown[];
    TID: unknown;
    vaildChecked: unknown;
  }
}

export {};
