# LeetLLM Authentication Setup

Web and iOS must use the same Supabase project. User progress tables key data by Supabase `auth.users.id`, so signing in to both clients with the same Supabase identity restores the same synced progress.

## Supported Methods

- Email and password on web and iOS.
- Google OAuth on web and iOS.
- Apple OAuth on web plus native Sign in with Apple on iOS.

Clients read `/auth/v1/settings` and only show social providers enabled in Supabase. This prevents a provider button from opening an unconfigured flow.

## Redirect Allow List

Add these URLs under Supabase Authentication > URL Configuration:

```text
https://leetllm.com/auth/callback
com.leetllm.ios://auth/callback
http://localhost:23456/auth/callback
```

Keep production Site URL set to `https://leetllm.com`.

## Google

Google provider is configured in Supabase with a Web OAuth client. Google Cloud's authorized redirect URI must be Supabase's callback URL:

```text
https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
```

iOS opens the Supabase Google OAuth flow in `ASWebAuthenticationSession` and receives the Supabase session at `com.leetllm.ios://auth/callback`. No Google client secret belongs in the app.
Supabase access and refresh tokens are stored in iOS Keychain, not `UserDefaults`.

## Apple

Apple remains unavailable until these external steps are complete:

1. Enable Sign in with Apple for App ID `com.leetllm.ios` in Apple Developer.
2. Create a Services ID for web sign-in and associate it with that App ID.
3. Configure Apple's web domain and return URL using Supabase's callback URL above.
4. Create a Sign in with Apple key and generate the client secret.
5. Enable Apple provider in Supabase. Include both web Services ID and native bundle ID in authorized client IDs.
6. Verify `/auth/v1/settings` reports `external.apple: true` before release.

Do not enable Apple in production until account deletion also revokes the user's Apple authorization. Current deletion removes the Supabase user and cascaded progress, but it does not retain an Apple authorization code or provider refresh token for Apple token revocation.

Apple web OAuth secrets expire every six months. Store the `.p8` key securely and schedule rotation before expiry. Native iOS sign-in uses Apple's identity token, nonce verification, and the app entitlement in `LeetLLM.entitlements`.

## Identity Linking

Supabase automatically links verified identities that return the same email address. An existing email/password user can therefore use Google or Apple with that same verified email and retain one `auth.users.id`.

Apple's Hide My Email can return a private relay address. That address does not match an existing Google or email identity, so automatic linking cannot prove both accounts belong together. Do not merge such users by email in application code. Enable Supabase manual identity linking and add an authenticated linking flow before promising relay-address account merging.

## Verification

### iOS Private Articles

`GET /api/ios/private-blogs` uses the existing cookie/Bearer Supabase authentication path. It returns the GLM-5.3 masterclass only when `IOS_PRIVATE_BLOG_EMAIL` is configured and `auth.getUser()` verifies a session whose confirmed email matches `IOS_PRIVATE_BLOG_EMAIL`. Missing or invalid sessions receive HTTP 401; other identities (or unconfigured environments) receive an empty catalog. Every response is private, no-store, and noindex. iOS never uses a client-supplied email as server authorization.

The native app refreshes this catalog on sign-in, account changes, connectivity changes, and foreground entry. Content and PNGs stay in memory and are cleared on sign-out or account changes. Use **Learn > Blog** to find the masterclass after sign-in. An Apple private relay email doesn't satisfy the owner-email rule unless the Supabase identity is linked to the existing owner account.

### Providers

Provider state is public and contains no secrets:

```bash
curl -fsS \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/settings" | jq '.external | {email, google, apple}'
```

Release gate:

- Google and Apple report enabled.
- Web login and signup complete through both providers.
- iOS Google and Apple login return same Supabase user ID as web for same linked identity.
- Fresh-device sync restores lessons, theory quizzes, and personal plan.
- Account deletion is verified for email, Google, and Apple users.
- Apple authorization is revoked when an Apple user deletes the account.
