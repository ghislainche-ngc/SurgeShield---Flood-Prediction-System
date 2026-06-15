/*
 * Links Convex to Clerk so ctx.auth.getUserIdentity() works inside functions.
 * `domain` is this Clerk instance's Frontend API (issuer); `applicationID`
 * must match the name of the Clerk JWT template ("convex").
 */
const authConfig = {
  providers: [
    {
      domain: "https://main-basilisk-46.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
