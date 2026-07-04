# Email Configuration with Resend

This guide explains how to configure Boxty to send emails via [Resend](https://resend.com) using your own domain through Cloudflare.

## Why Resend?

- **Free tier**: 100 emails/day (more than enough for invites and password resets)
- **No credit card required** to start
- **Simple setup**: Just add DNS records to Cloudflare
- **SMTP support**: Works with standard SMTP protocol
- **No additional verification**: Just verify domain ownership via DNS

## Setup Steps

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up (free)
2. No credit card required for free tier

### 2. Add Your Domain

1. In Resend dashboard, go to "Domains" → "Add Domain"
2. Enter your domain (e.g., `yourdomain.com`)
3. Select "Cloudflare" as DNS provider
4. Resend will provide DNS records (SPF, DKIM, DMARC)

### 3. Configure DNS in Cloudflare

1. Go to Cloudflare dashboard → your domain → DNS
2. Add the records provided by Resend:
   - **SPF** (TXT record): `v=spf1 include:_spf.resend.com ~all`
   - **DKIM** (TXT record): Long string provided by Resend
   - **DMARC** (TXT record): `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com`
3. Wait for verification (usually 2-5 minutes, automatic)

### 4. Get SMTP Credentials

1. In Resend dashboard, go to "API Keys" → "Create API Key"
2. Choose "Sending access" permission
3. Copy the API key (this is your SMTP password)
4. Note your SMTP settings:
   - **Host**: `smtp.resend.com`
   - **Port**: `587`
   - **Username**: `resend`
   - **Password**: Your API key

### 5. Configure Boxty

Set these environment variables in your Boxty deployment:

```bash
# Email provider (use "smtp" for Resend, "console" for local development)
BOXTY_INVITE_EMAIL_PROVIDER=smtp

# SMTP settings for Resend
BOXTY_SMTP_HOST=smtp.resend.com
BOXTY_SMTP_PORT=587
BOXTY_SMTP_USERNAME=resend
BOXTY_SMTP_PASSWORD=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Your Resend API key

# Sender address (must be verified in Resend)
BOXTY_INVITE_EMAIL_FROM=noreply@yourdomain.com

# Frontend URL for email links (optional, defaults to https://boxty.dev)
BOXTY_API_BASE_URL=https://yourdomain.com
```

### 6. Test Configuration

After deploying with these settings, test by:

1. **Invite test**: Create a workspace invite - the invited user should receive an email with a link to `/accept-invite?token=...`
2. **Password reset test**: Request a password reset - you should receive an email with a link to `/password-reset?token=...`

## Troubleshooting

### Emails not sending

Check logs for:
```
[PasswordResetEmail] to=...  # Console output (SMTP not configured)
[InviteEmail] to=...          # Console output (SMTP not configured)
```

If you see these, SMTP is not configured correctly. Verify:
- `BOXTY_INVITE_EMAIL_PROVIDER=smtp` is set
- `BOXTY_SMTP_HOST` is not empty
- `BOXTY_SMTP_PASSWORD` is your actual Resend API key

### Domain verification fails

- Ensure DNS records are exactly as provided by Resend
- Wait 10-15 minutes after adding DNS records
- Check that Cloudflare proxy is **disabled** (grey cloud) for TXT records

### Emails going to spam

- Ensure DMARC record is configured
- Use a subdomain like `noreply@mail.yourdomain.com` instead of root domain
- Warm up the domain by sending a few emails manually first

## Alternative: Console Output (Development)

For local development without SMTP, use:

```bash
BOXTY_INVITE_EMAIL_PROVIDER=console
```

Emails will be printed to console/logs instead of being sent. This is the default behavior.

## Security Notes

- Never commit `BOXTY_SMTP_PASSWORD` to version control
- Use a dedicated API key for Boxty (not your main Resend key)
- Rotate API keys periodically
- The free tier's 100 emails/day is sufficient for most small deployments
