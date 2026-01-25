import { LegalLayout } from '@/components/marketing';

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="January 25, 2026">
      <h2>1. Introduction</h2>
      <p>
        TelegramPlugin (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
        This Privacy Policy explains how we collect, use, disclose, and safeguard your
        information when you use our platform.
      </p>
      <p>
        We are based in the European Union and comply with the General Data Protection
        Regulation (GDPR) and other applicable data protection laws.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Information You Provide</h3>
      <ul>
        <li><strong>Account Information:</strong> Email address, name, password when you register</li>
        <li><strong>Payment Information:</strong> Processed securely through Stripe; we do not store card details</li>
        <li><strong>Channel Information:</strong> Telegram, Discord, or WhatsApp channel identifiers you connect</li>
        <li><strong>Customer Data:</strong> Information about your subscribers and their access</li>
      </ul>

      <h3>2.2 Information Collected Automatically</h3>
      <ul>
        <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform</li>
        <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
        <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide and maintain our services</li>
        <li>Process payments and manage subscriptions</li>
        <li>Grant and revoke access to your channels</li>
        <li>Send transactional emails (receipts, access notifications)</li>
        <li>Improve our platform and develop new features</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>We share your data only with:</p>
      <ul>
        <li><strong>Stripe:</strong> For payment processing</li>
        <li><strong>Brevo:</strong> For transactional emails</li>
        <li><strong>Platform APIs:</strong> Telegram, Discord, WhatsApp for access management</li>
        <li><strong>Legal authorities:</strong> When required by law</li>
      </ul>
      <p>We never sell your personal data to third parties.</p>

      <h2>5. Data Retention</h2>
      <p>
        We retain your data for as long as your account is active. Upon account deletion,
        we anonymize or delete your personal data within 30 days, except where retention
        is required for legal or audit purposes.
      </p>

      <h2>6. Your Rights</h2>
      <p>Under GDPR, you have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of your personal data</li>
        <li><strong>Rectification:</strong> Correct inaccurate data</li>
        <li><strong>Erasure:</strong> Request deletion of your data</li>
        <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
        <li><strong>Objection:</strong> Object to certain processing activities</li>
        <li><strong>Restriction:</strong> Request limited processing of your data</li>
      </ul>
      <p>
        To exercise these rights, contact us at{' '}
        <a href="mailto:privacy@telegramplugin.com">privacy@telegramplugin.com</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        We implement industry-standard security measures including encryption in transit
        (TLS), secure password hashing, and regular security audits. All data is stored
        in European data centers.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of
        significant changes via email or a notice on our platform.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        For privacy-related inquiries, contact our Data Protection Officer at{' '}
        <a href="mailto:dpo@telegramplugin.com">dpo@telegramplugin.com</a>.
      </p>
    </LegalLayout>
  );
}
