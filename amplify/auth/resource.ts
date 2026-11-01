import { defineAuth } from '@aws-amplify/backend';

/**
 * PGMate authentication — Amazon Cognito User Pool (spec/design.md §5).
 *
 * Email-based sign-in; all AWS access is brokered by Lambda, so there is no
 * Identity Pool. The configuration below satisfies tasks 2.1 and 2.2 using
 * Cognito/Amplify defaults, per the design ("password per Cognito policy;
 * optional MFA toggled off for the challenge demo but available").
 *
 * 2.1 — User Pool:
 *   - Sign-in: email (`loginWith.email`).
 *   - Password policy: Cognito default (>= 8 chars, mixed case + digits).
 *   - MFA: off by default (no `multifactor` configured).
 *   - Identity Pool: none — Amplify creates a User Pool + app client only.
 *
 * 2.2 — App client (consumed by the SPA via `aws-amplify` Auth):
 *   - Auth flow: email/SRP (enabled by `loginWith.email`; the SPA calls
 *     Auth.signUp / signIn / signOut — no hosted UI).
 *   - Hosted UI: disabled (no OAuth / hostedUI config is provided, so Cognito
 *     does not provision hosted pages).
 *   - Refresh-token rotation: the Amplify SDK auto-refreshes the access token
 *     using the Cognito refresh token; refresh-token validity uses Cognito's
 *     default (30 days).
 *
 * Customising the password policy or refresh-token validity would use the CDK
 * escape hatch (`UserPool.passwordPolicy` / `UserPoolClient.refreshTokenValidity`).
 * That is deferred until `npm install` + type-check are available in this
 * environment, so we do not ship unverifiable escape-hatch code. Frontend
 * sign-up/in/out UI is task P6.5; API protection via the Cognito JWT authorizer
 * is task P4.
 *
 * NOTE: Authored but not yet type-checked or deployed here (no `npm install` /
 * AWS credentials). Run `npm install` then `npm run amp:build` (or `amp:sandbox`)
 * in a networked, AWS-credentialed environment to verify.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
