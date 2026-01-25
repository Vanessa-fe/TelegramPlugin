import Link from 'next/link';
import { LegalLayout } from '@/components/marketing';

export default function GDPRPage() {
  return (
    <LegalLayout title="GDPR Compliance" lastUpdated="January 25, 2026">
      <h2>Our Commitment to GDPR</h2>
      <p>
        TelegramPlugin is fully committed to GDPR compliance. As an EU-based company,
        we have built our platform with privacy by design and data protection as
        core principles.
      </p>

      <h2>Data Controller Information</h2>
      <p>
        <strong>Company:</strong> TelegramPlugin SAS<br />
        <strong>Address:</strong> [Company Address], Europe<br />
        <strong>Email:</strong>{' '}
        <a href="mailto:dpo@telegramplugin.com">dpo@telegramplugin.com</a><br />
        <strong>Data Protection Officer:</strong> [DPO Name]
      </p>

      <h2>Legal Basis for Processing</h2>
      <p>We process personal data under the following legal bases:</p>
      <ul>
        <li>
          <strong>Contract Performance (Art. 6(1)(b)):</strong> Processing necessary
          to provide our services — account management, payment processing, access
          control
        </li>
        <li>
          <strong>Legitimate Interest (Art. 6(1)(f)):</strong> Analytics and service
          improvement, fraud prevention, security
        </li>
        <li>
          <strong>Legal Obligation (Art. 6(1)(c)):</strong> Tax records, audit logs,
          regulatory compliance
        </li>
        <li>
          <strong>Consent (Art. 6(1)(a)):</strong> Marketing communications (opt-in only)
        </li>
      </ul>

      <h2>Your Rights Under GDPR</h2>
      <p>
        As a data subject, you have comprehensive rights under GDPR. Here&apos;s how to
        exercise them:
      </p>

      <h3>Right of Access (Art. 15)</h3>
      <p>
        Request a copy of all personal data we hold about you. Go to{' '}
        <strong>Dashboard → Settings → Export Data</strong> to download your data
        instantly, or email us for a complete Subject Access Request.
      </p>

      <h3>Right to Rectification (Art. 16)</h3>
      <p>
        Correct inaccurate data directly in your dashboard, or contact us to update
        information you cannot modify yourself.
      </p>

      <h3>Right to Erasure (Art. 17)</h3>
      <p>
        Request deletion of your account and associated data. Go to{' '}
        <strong>Dashboard → Settings → Delete Account</strong>. We will anonymize or
        delete your data within 30 days, except where retention is legally required.
      </p>

      <h3>Right to Data Portability (Art. 20)</h3>
      <p>
        Export your data in JSON format from{' '}
        <strong>Dashboard → Settings → Export Data</strong>. This includes your
        account information, products, customers, and transaction history.
      </p>

      <h3>Right to Object (Art. 21)</h3>
      <p>
        Object to processing based on legitimate interest. Contact our DPO to submit
        an objection, and we will review within 30 days.
      </p>

      <h3>Right to Restriction (Art. 18)</h3>
      <p>
        Request limited processing while we verify accuracy or assess an objection.
        Contact our DPO to request restriction.
      </p>

      <h2>Data Processing Activities</h2>
      <table className="w-full border-collapse border border-[#E9E3EF] my-6">
        <thead>
          <tr className="bg-[#FDFAFF]">
            <th className="border border-[#E9E3EF] p-3 text-left">Activity</th>
            <th className="border border-[#E9E3EF] p-3 text-left">Data</th>
            <th className="border border-[#E9E3EF] p-3 text-left">Retention</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[#E9E3EF] p-3">Account Management</td>
            <td className="border border-[#E9E3EF] p-3">Email, name, password hash</td>
            <td className="border border-[#E9E3EF] p-3">Until account deletion</td>
          </tr>
          <tr>
            <td className="border border-[#E9E3EF] p-3">Payment Processing</td>
            <td className="border border-[#E9E3EF] p-3">Transaction records (via Stripe)</td>
            <td className="border border-[#E9E3EF] p-3">7 years (legal requirement)</td>
          </tr>
          <tr>
            <td className="border border-[#E9E3EF] p-3">Access Control</td>
            <td className="border border-[#E9E3EF] p-3">Channel IDs, user IDs</td>
            <td className="border border-[#E9E3EF] p-3">Until subscription ends</td>
          </tr>
          <tr>
            <td className="border border-[#E9E3EF] p-3">Analytics</td>
            <td className="border border-[#E9E3EF] p-3">Aggregated usage data</td>
            <td className="border border-[#E9E3EF] p-3">2 years</td>
          </tr>
          <tr>
            <td className="border border-[#E9E3EF] p-3">Audit Logs</td>
            <td className="border border-[#E9E3EF] p-3">Security events</td>
            <td className="border border-[#E9E3EF] p-3">1 year</td>
          </tr>
        </tbody>
      </table>

      <h2>Sub-Processors</h2>
      <p>We use the following sub-processors, all with appropriate safeguards:</p>
      <ul>
        <li><strong>Stripe</strong> (USA) — Payment processing, Standard Contractual Clauses</li>
        <li><strong>Brevo</strong> (France) — Email delivery, EU-based</li>
        <li><strong>Vercel</strong> (USA) — Hosting, Standard Contractual Clauses</li>
        <li><strong>PostgreSQL hosting</strong> (EU) — Database, EU-based</li>
      </ul>

      <h2>International Transfers</h2>
      <p>
        When data is transferred outside the EU/EEA, we ensure appropriate safeguards
        through Standard Contractual Clauses (SCCs) or adequacy decisions.
      </p>

      <h2>Security Measures</h2>
      <p>We implement technical and organizational measures including:</p>
      <ul>
        <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
        <li>Regular security audits and penetration testing</li>
        <li>Access controls and authentication</li>
        <li>Employee training on data protection</li>
        <li>Incident response procedures</li>
      </ul>

      <h2>Data Breach Notification</h2>
      <p>
        In the event of a personal data breach, we will notify the relevant supervisory
        authority within 72 hours and affected individuals without undue delay when
        required by GDPR.
      </p>

      <h2>Contact Our DPO</h2>
      <p>
        For any GDPR-related requests or questions, contact our Data Protection Officer:
      </p>
      <p>
        <strong>Email:</strong>{' '}
        <a href="mailto:dpo@telegramplugin.com">dpo@telegramplugin.com</a><br />
        <strong>Response time:</strong> Within 30 days (as required by GDPR)
      </p>

      <h2>Supervisory Authority</h2>
      <p>
        You have the right to lodge a complaint with your local data protection
        authority. Our lead supervisory authority is [Authority Name].
      </p>

      <div className="mt-8 p-6 bg-purple-50 rounded-xl">
        <h3 className="text-purple-600 mt-0">Quick Actions</h3>
        <p className="mb-4">Access your data rights directly from your dashboard:</p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors no-underline"
          >
            Export My Data
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors no-underline"
          >
            Delete My Account
          </Link>
        </div>
      </div>
    </LegalLayout>
  );
}
