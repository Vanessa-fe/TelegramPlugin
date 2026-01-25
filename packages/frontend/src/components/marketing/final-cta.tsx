import Link from 'next/link';

export function FinalCTA() {
  return (
    <section className="py-20 lg:py-28 bg-purple-600">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
        {/* Title */}
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
          Ready to monetize your community?
        </h2>

        {/* CTA */}
        <Link
          href="/register"
          className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-md hover:shadow-lg text-base"
        >
          Start free today →
        </Link>

        {/* Note */}
        <p className="mt-6 text-purple-200 text-sm">No credit card required</p>
      </div>
    </section>
  );
}
