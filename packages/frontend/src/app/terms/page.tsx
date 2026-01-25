import { LegalLayout } from '@/components/marketing';

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="January 25, 2026">
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using TelegramPlugin (&quot;the Service&quot;), you agree to be bound
        by these Terms of Service. If you do not agree to these terms, do not use
        the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        TelegramPlugin provides a platform for creators to monetize their communities
        on Telegram, Discord, and WhatsApp through subscriptions and one-time payments.
        We facilitate:
      </p>
      <ul>
        <li>Payment processing via Stripe Connect</li>
        <li>Automatic access management to your channels</li>
        <li>Customer and subscription management tools</li>
        <li>Analytics and reporting</li>
      </ul>

      <h2>3. Account Registration</h2>
      <p>To use the Service, you must:</p>
      <ul>
        <li>Be at least 18 years old</li>
        <li>Provide accurate and complete registration information</li>
        <li>Maintain the security of your account credentials</li>
        <li>Accept responsibility for all activities under your account</li>
      </ul>

      <h2>4. Fees and Payment</h2>
      <h3>4.1 Subscription Fee</h3>
      <p>
        The Service is offered at a flat monthly fee of €39. We charge 0% commission
        on your sales. Standard Stripe processing fees apply separately.
      </p>

      <h3>4.2 Free Trial</h3>
      <p>
        New accounts receive a 14-day free trial. No credit card is required to start.
        At the end of the trial, you must subscribe to continue using the Service.
      </p>

      <h3>4.3 Billing</h3>
      <p>
        Subscription fees are billed monthly in advance. You may cancel at any time;
        service continues until the end of the billing period.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Violate any applicable laws or regulations</li>
        <li>Sell illegal content or services</li>
        <li>Infringe on intellectual property rights</li>
        <li>Distribute malware or harmful content</li>
        <li>Engage in fraud or deceptive practices</li>
        <li>Harass, abuse, or harm others</li>
        <li>Circumvent platform restrictions on Telegram, Discord, or WhatsApp</li>
      </ul>

      <h2>6. Your Responsibilities</h2>
      <p>As a creator using our platform, you are responsible for:</p>
      <ul>
        <li>Complying with tax obligations in your jurisdiction</li>
        <li>Providing accurate descriptions of your products</li>
        <li>Delivering the access and content promised to your customers</li>
        <li>Handling customer support for your products</li>
        <li>Complying with the terms of service of connected platforms</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <p>
        You retain ownership of your content. By using the Service, you grant us a
        limited license to display and process your content as necessary to provide
        the Service.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, TelegramPlugin shall not be liable
        for any indirect, incidental, special, consequential, or punitive damages,
        including loss of profits, data, or business opportunities.
      </p>

      <h2>9. Service Availability</h2>
      <p>
        We strive for high availability but do not guarantee uninterrupted service.
        We may perform maintenance or updates that temporarily affect availability.
      </p>

      <h2>10. Termination</h2>
      <p>
        We may suspend or terminate your account for violation of these terms or
        for any other reason at our discretion. You may cancel your account at any
        time through your dashboard.
      </p>

      <h2>11. Changes to Terms</h2>
      <p>
        We may modify these terms at any time. We will notify you of material changes
        via email. Continued use of the Service after changes constitutes acceptance.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These terms are governed by the laws of the European Union. Any disputes
        shall be resolved in the courts of [Jurisdiction].
      </p>

      <h2>13. Contact</h2>
      <p>
        For questions about these terms, contact us at{' '}
        <a href="mailto:legal@telegramplugin.com">legal@telegramplugin.com</a>.
      </p>
    </LegalLayout>
  );
}
