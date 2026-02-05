import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/marketing';
import { getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import {
  UserPlus,
  CreditCard,
  Bot,
  MessageCircle,
  Settings,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('faq');
  return buildMetadata({
    canonical: '/faq',
    title: t('meta.title'),
    description: t('meta.description'),
  });
}

export default async function FaqPage() {
  const t = await getTranslations('faq');

  const gettingStartedSteps = [
    {
      icon: UserPlus,
      title: t('gettingStarted.steps.step1.title'),
      description: t('gettingStarted.steps.step1.description'),
    },
    {
      icon: CreditCard,
      title: t('gettingStarted.steps.step2.title'),
      description: t('gettingStarted.steps.step2.description'),
    },
    {
      icon: Settings,
      title: t('gettingStarted.steps.step3.title'),
      description: t('gettingStarted.steps.step3.description'),
    },
    {
      icon: Bot,
      title: t('gettingStarted.steps.step4.title'),
      description: t('gettingStarted.steps.step4.description'),
    },
    {
      icon: MessageCircle,
      title: t('gettingStarted.steps.step5.title'),
      description: t('gettingStarted.steps.step5.description'),
    },
  ];

  const botSetupSteps = [
    t('botSetup.steps.step1'),
    t('botSetup.steps.step2'),
    t('botSetup.steps.step3'),
    t('botSetup.steps.step4'),
    t('botSetup.steps.step5'),
  ];

  const faqs = [
    {
      question: t('questions.q1.question'),
      answer: t('questions.q1.answer'),
    },
    {
      question: t('questions.q2.question'),
      answer: t('questions.q2.answer'),
    },
    {
      question: t('questions.q3.question'),
      answer: t('questions.q3.answer'),
    },
    {
      question: t('questions.q4.question'),
      answer: t('questions.q4.answer'),
    },
    {
      question: t('questions.q5.question'),
      answer: t('questions.q5.answer'),
    },
    {
      question: t('questions.q6.question'),
      answer: t('questions.q6.answer'),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1A1523] mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-[#6F6E77] leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16 lg:py-20 bg-[#FDFAFF]">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#1A1523] mb-4">
            {t('gettingStarted.title')}
          </h2>
          <p className="text-[#6F6E77] mb-10 max-w-2xl">
            {t('gettingStarted.subtitle')}
          </p>

          <div className="space-y-6">
            {gettingStartedSteps.map((step, index) => (
              <div
                key={step.title}
                className="flex items-start gap-4 bg-white rounded-xl border border-[#E9E3EF] p-6"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <step.icon className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-[#1A1523]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-[#6F6E77]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bot Setup */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Bot className="w-4 h-4" />
                {t('botSetup.badge')}
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#1A1523] mb-4">
                {t('botSetup.title')}
              </h2>
              <p className="text-[#6F6E77] mb-6">
                {t('botSetup.subtitle')}
              </p>

              <div className="space-y-4">
                {botSetupSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <ChevronRight className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[#1A1523]">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FDFAFF] rounded-2xl border border-[#E9E3EF] p-6">
              <h3 className="font-semibold text-[#1A1523] mb-4">
                {t('botSetup.permissions.title')}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-[#6F6E77]">
                    {t('botSetup.permissions.invite')}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-[#6F6E77]">
                    {t('botSetup.permissions.ban')}
                  </span>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>{t('botSetup.important.label')}</strong>{' '}
                  {t('botSetup.important.text')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-20 bg-[#FDFAFF]">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-8 h-8 text-purple-600" />
            <h2 className="text-2xl lg:text-3xl font-bold text-[#1A1523]">
              {t('questions.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="bg-white rounded-xl border border-[#E9E3EF] p-6"
              >
                <h3 className="font-semibold text-[#1A1523] mb-3">
                  {faq.question}
                </h3>
                <p className="text-[#6F6E77] text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-purple-600">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-purple-200 mb-8 max-w-xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-md"
            >
              {t('cta.register')}
            </Link>
            <Link
              href="/contact"
              className="inline-block bg-purple-500 hover:bg-purple-400 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-150"
            >
              {t('cta.contact')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
