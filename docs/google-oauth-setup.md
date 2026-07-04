# Google OAuth Setup Guide

This guide explains how to create the Google OAuth 2.0 credentials required for Boxty's "Sign in with Google" feature.

> Important: Google does not currently expose the OAuth consent screen or OAuth client creation through the stable `gcloud` CLI. The fastest and safest way is to use the Google Cloud Console, but you can still use `gcloud` to prepare the project and open the right pages.

## Prerequisites

- A Google Cloud project. Create one if needed:

```bash
gcloud projects create boxty-production --name="Boxty Production"
gcloud config set project boxty-production
```

- The `gcloud` CLI installed and authenticated:

```bash
gcloud auth login
gcloud config set project boxty-production
```

- Verify the project:

```bash
gcloud projects describe $(gcloud config get-value project)
```

## 1. Open the OAuth consent screen

Use `gcloud` to jump to the correct console URL for your project:

```bash
open "https://console.cloud.google.com/apis/credentials/consent?project=$(gcloud config get-value project)"
```

On Linux:

```bash
xdg-open "https://console.cloud.google.com/apis/credentials/consent?project=$(gcloud config get-value project)"
```

Configure the consent screen as follows:

- **User type**: External
- **App name**: Boxty
- **User support email**: `support@boxty.dev`
- **Developer contact email**: `dev@boxty.dev`
- **Authorized domains**: `boxty.dev`
- **Application home page**: `https://app.boxty.dev`
- **Application privacy policy link**: `https://app.boxty.dev/privacy`
- **Application terms of service link**: `https://app.boxty.dev/terms`

Add these scopes under **Data access**:

- `openid`
- `/auth/userinfo.profile`
- `/auth/userinfo.email`

Publish the consent screen when ready. While testing, add test users under **Audience** so you can log in before the app is published.

## 2. Create OAuth 2.0 Web credentials

Open the credentials page from the terminal:

```bash
open "https://console.cloud.google.com/apis/credentials?project=$(gcloud config get-value project)"
```

1. Click **Create credentials** → **OAuth client ID**.
2. **Application type**: Web application.
3. **Name**: `Boxty Web App`.
4. **Authorized redirect URIs**:
   - `http://localhost:5173/oauth/callback` (local development)
   - `https://app.boxty.dev/oauth/callback` (production)
   - `https://app-staging.boxty.dev/oauth/callback` (staging)
5. Click **Create**.

Copy the **Client ID** and **Client Secret** shown in the dialog.

## 3. Store the secrets

### Option A: using the `sync-secrets.sh` script

Copy the example file and fill in the values:

```bash
cp infrastructure/scripts/sync-secrets.example.env infrastructure/scripts/.env
```

Edit `infrastructure/scripts/.env` and set:

```bash
BOXTY_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
BOXTY_GOOGLE_CLIENT_SECRET=your-client-secret
BOXTY_GOOGLE_REDIRECT_URI=https://app.boxty.dev/oauth/callback
```

Then upload:

```bash
./infrastructure/scripts/sync-secrets.sh
```

### Option B: using `gh` directly

```bash
gh secret set BOXTY_GOOGLE_CLIENT_ID --body "your-client-id.apps.googleusercontent.com"
gh secret set BOXTY_GOOGLE_CLIENT_SECRET --body "your-client-secret"
gh secret set BOXTY_GOOGLE_REDIRECT_URI --body "https://app.boxty.dev/oauth/callback"
```

### Option C: local development

Add the values to `control_plane/.env`:

```bash
BOXTY_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
BOXTY_GOOGLE_CLIENT_SECRET=your-client-secret
BOXTY_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/callback
```

## 4. Verify the deployment

After deploying the control plane, the environment file on the server should contain the variables. Check it with:

```bash
ssh -i ~/.ssh/boxty_control_plane boxty@<control-plane-ip>
sudo cat /opt/boxty-control-plane/control-plane.env | grep GOOGLE
```

You should see:

```bash
BOXTY_GOOGLE_CLIENT_ID=...
BOXTY_GOOGLE_CLIENT_SECRET=...
BOXTY_GOOGLE_REDIRECT_URI=...
```

## 5. Test the sign-in flow

1. Open the web app at `https://app.boxty.dev`.
2. Click **Sign in with Google**.
3. Complete the Google consent screen.
4. After redirect, you should be logged in.

## Troubleshooting

- **Error 400: redirect_uri_mismatch** — the redirect URI in the request does not match the URI registered in Google Cloud. Make sure `BOXTY_GOOGLE_REDIRECT_URI` exactly matches one of the authorized redirect URIs, including scheme and path.
- **Error 403: access_denied** — the user is not in the test audience while the app is still in testing mode. Add test users or publish the app.
- **Client secret not found** — verify the GitHub Actions deploy workflow received the secret and Ansible wrote it to the server env file.
