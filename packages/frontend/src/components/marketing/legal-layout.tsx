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
            <h1 className="text-3xl lg:text-4xl font-bold text-[#1A1523] mb-4">
              {title}
            </h1>
            <p className="text-[#6F6E77]">Last updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none prose-headings:text-[#1A1523] prose-headings:font-semibold prose-p:text-[#6F6E77] prose-p:leading-relaxed prose-li:text-[#6F6E77] prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-[#1A1523]">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
