import { Navbar, Footer } from '@/components/marketing';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 lg:px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              {title}
            </h1>
            <p className="text-text-secondary">{lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none prose-headings:text-text-primary prose-headings:font-semibold prose-p:text-text-secondary prose-p:leading-relaxed prose-li:text-text-secondary prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-text-primary">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
