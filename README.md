# Tana Sync GCal

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bigjangmon/tana-sync-gcal)

**Create, update, and delete Google Calendar events directly from [Tana](https://tana.inc) nodes.**
Built as a serverless API that bridges the gap between your personal knowledge system and calendar scheduling.

### Key Features

- **One-way sync**: Tana → Google Calendar
- **Completely free**: Google Calendar API + Cloudflare Workers (100k requests/day)
- **Simple setup**: Service Account based, no OAuth complexity
- **Tana Paste integration**: Event details flow back to Tana automatically

### Important Limitations

- **No Bidirectional Sync**: For Google Calendar → Tana sync, use [Tana&#39;s official Calendar Integration](https://tana.inc/docs/calendar-integration) (requires Tana Pro/Plus subscription)
- **No Attendee Management**: Service Account cannot add attendees or send invitations
- **Limited Calendar Permissions**: Service Account can only access calendars that have been explicitly shared with the service account email.
- **No Real-time Updates**: Changes made directly in Google Calendar won't trigger updates back to Tana through this integration.

## Tech Stack

- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Serverless compute platform
- **[Hono](https://hono.dev/)** - Fast, lightweight web framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Zod](https://zod.dev/)** - Runtime type validation
- **[Google Calendar API](https://developers.google.com/calendar)** - Calendar integration

---

## Setup Guide for Non-Developers

### Step 1: Google Cloud Console Setup

#### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project"
3. Enter project name (e.g., "tana-calendar-sync")
4. Click "Create"

#### 1.2 Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

#### 1.3 Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Enter service account name (e.g., "tana-sync-service")
4. Click "Create and Continue"
5. Skip role assignment for now
6. Click "Done"

#### 1.4 Generate Service Account Key

1. Click on your newly created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create" and save the downloaded JSON file

#### 1.5 Extract Information from JSON Key

Open the downloaded JSON file in a text editor. You'll need these five values:

1. **Project ID**: Look for `"project_id"` field

   ```json
   "project_id": "your-project-name"
   ```

2. **Private Key ID**: Look for `"private_key_id"` field

   ```json
   "private_key_id": "abc123def456..."
   ```

3. **Private Key**: Look for `"private_key"` field

```json
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

4. **Client ID**: Look for `"client_id"` field

   ```json
   "client_id": "123456789012345678901"
   ```

5. **Service Account Email**: Look for `"client_email"` field

   ```json
   "client_email": "tana-sync-service@your-project-name.iam.gserviceaccount.com"
   ```

> **Important**: Keep this JSON file secure and never commit it to version control!

#### 1.6 Share Calendar with Service Account

1. Open Google Calendar
2. Find the calendar you want to sync
3. Click the three dots → "Settings and sharing"
4. Under "Share with specific people", add your **service account email** (from step 1.5)
5. Set permission to "Make changes to events"

### Step 2: Cloudflare Workers Setup

#### 2.1 Create Cloudflare Account

1. Sign up at [Cloudflare Workers](https://workers.cloudflare.com/)
2. Complete the verification process

#### 2.2 Fork and Deploy Repository

1. Fork this repository on GitHub
2. Connect your GitHub account to Cloudflare Workers
3. Create a new Worker from your forked repository

#### 2.3 Set Environment Variables

1. In your Worker dashboard, go to "Settings" → "Variables"
2. Add these environment variables using the values from your JSON file (step 1.5):

   ```
   GOOGLE_PROJECT_ID = your-project-name
   GOOGLE_PRIVATE_KEY_ID = abc123def456...
   GOOGLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n[your-key-content]\n-----END PRIVATE KEY-----\n
   GOOGLE_CLIENT_ID = 123456789012345678901
   GOOGLE_CLIENT_EMAIL = your-service-account@project-name.iam.gserviceaccount.com
   ```

   > **Note**: Use the exact values from your JSON file fields. Copy them exactly as they appear, including newlines in the private key.

#### 2.4 Deploy

1. Click "Deploy" in your Worker dashboard
2. Note your Worker URL (e.g., `https://your-worker.your-subdomain.workers.dev`)

---

## Developer Guide

### Local Development

```bash
# Fork the repository on GitHub first, then clone your fork
git clone https://github.com/YOUR_USERNAME/tana-sync-gcal
cd tana-sync-gcal

# Install dependencies using pnpm
pnpm install

# Create .dev.vars file with your credentials (see format below)
touch .dev.vars

# Start development server
pnpm run cf-dev
# or
pnpm run dev

# Deploy to Cloudflare Workers
pnpm run deploy
```

### Environment Setup

Add your credentials to `.dev.vars` file:

```bash
GOOGLE_PROJECT_ID=your-project-name
GOOGLE_PRIVATE_KEY_ID=abc123def456...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_ID=123456789012345678901
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

> **Note**: `.dev.vars` is for local development. For production, set environment variables in your Cloudflare Workers dashboard.

---

## Contributing

We welcome contributions! Here's how you can help:

### Priority Areas

1. **Documentation** - Setup guides, API docs, examples
2. **Testing** - Unit tests, integration tests, edge cases
3. **Developer Experience** - Better error messages, debugging tools

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
