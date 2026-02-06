#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Brevo = require('@getbrevo/brevo');

function parseArgs(argv) {
  const args = {
    to: null,
    subject: null,
    html: null,
    text: null,
    env: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--to') {
      args.to = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--subject') {
      args.subject = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--html') {
      args.html = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--text') {
      args.text = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--env') {
      args.env = argv[i + 1];
      i += 1;
      continue;
    }
  }

  return args;
}

function resolveEnvFile(explicitPath) {
  if (explicitPath) {
    const resolved = path.resolve(process.cwd(), explicitPath);
    return fs.existsSync(resolved) ? resolved : null;
  }

  const repoRoot = path.resolve(__dirname, '..', '..');
  const candidates = [
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, '.env.development'),
    path.join(repoRoot, '.env.production'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function loadEnvFile(explicitPath) {
  const envPath = resolveEnvFile(explicitPath || process.env.ENV_FILE);
  if (!envPath) {
    return null;
  }

  const result = dotenv.config({ path: envPath });
  if (result.error) {
    throw new Error(`Failed to load env file: ${envPath} (${result.error.message})`);
  }

  return envPath;
}

async function main() {
  const args = parseArgs(process.argv);

  let loadedEnvPath = null;
  try {
    loadedEnvPath = loadEnvFile(args.env);
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }

  const to = args.to || process.env.TEST_EMAIL_TO;
  if (!to) {
    console.error('Missing recipient. Use --to you@example.com or set TEST_EMAIL_TO in env.');
    process.exit(1);
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('Missing BREVO_API_KEY in env.');
    process.exit(1);
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@example.com';
  const fromName = process.env.BREVO_FROM_NAME || 'Telegram Plugin';

  const subject = args.subject || 'Test email - Sublynk';
  const html =
    args.html ||
    '<h1>Test email</h1><p>Ceci est un test d\'envoi pour valider la configuration Brevo.</p>';
  const text =
    args.text ||
    "Test email - Ceci est un test d'envoi pour valider la configuration Brevo.";

  const api = new Brevo.TransactionalEmailsApi();
  api.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.sender = { email: fromEmail, name: fromName };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.textContent = text;

  if (loadedEnvPath) {
    console.log(`Loaded env from: ${loadedEnvPath}`);
  }
  console.log(`Sending test email to: ${to}`);

  try {
    await api.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Failed to send email:', error?.message || error);
    process.exit(1);
  }
}

main();
