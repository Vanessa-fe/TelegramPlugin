export function SocialProof() {
  return (
    <section className="py-12 border-b border-[#E9E3EF]">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {/* Stats option */}
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1A1523]">€250K+</p>
            <p className="text-sm text-[#6F6E77]">processed for creators</p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-[#E9E3EF]" />
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1A1523]">500+</p>
            <p className="text-sm text-[#6F6E77]">creators across Europe</p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-[#E9E3EF]" />
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1A1523]">0%</p>
            <p className="text-sm text-[#6F6E77]">commission</p>
          </div>
        </div>
      </div>
    </section>
  );
}
