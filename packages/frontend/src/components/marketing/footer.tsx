import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'Pricing', href: '/pricing' },
    { label: 'Features', href: '/#features' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'GDPR', href: '/gdpr' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1A1523] text-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold">
              TelegramPlugin
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              The community monetization platform for European creators.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} TelegramPlugin. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">Made in Europe 🇪🇺</p>
        </div>
      </div>
    </footer>
  );
}
