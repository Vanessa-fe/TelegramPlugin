'use client';

import { useRef, useState } from 'react';
import { Navbar, Footer } from '@/components/marketing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { contactApi } from '@/lib/api';
import {
  TURNSTILE_SITE_KEY,
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from '@/components/turnstile-widget';

const EMPTY_FORM = { name: '', email: '', subject: '', message: '', website: '' };

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const awaitingTurnstile = Boolean(TURNSTILE_SITE_KEY) && !turnstileToken;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  // Right-side contact options removed (single email only).

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (awaitingTurnstile) {
      setError(t('form.captchaPending'));
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      await contactApi.sendMessage({
        ...formData,
        turnstileToken: turnstileToken ?? undefined,
      });
      setIsSubmitted(true);
      toast.success(t('toast.success'));
    } catch {
      setError(t('toast.error'));
      toast.error(t('toast.error'));
    } finally {
      // Turnstile tokens are single-use: get a fresh one for the next attempt.
      turnstileRef.current?.reset();
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact form */}
            <div>
              <div className="bg-white rounded-2xl border border-border-custom p-8">
                {!isSubmitted ? (
                  <>
                    <h2 className="text-xl font-semibold text-text-primary mb-6">
                      {t('form.title')}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isSubmitting}>
                      {error && (
                        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                          {error}
                        </p>
                      )}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-text-primary">
                            {t('form.fields.name')}
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                            placeholder={t('form.fields.namePlaceholder')}
                            className="h-11 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-text-primary">
                            {t('form.fields.email')}
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                            placeholder={t('form.fields.emailPlaceholder')}
                            className="h-11 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-text-primary">
                          {t('form.fields.subject')}
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          placeholder={t('form.fields.subjectPlaceholder')}
                          className="h-11 border-border-custom focus:border-purple-600 focus:ring-purple-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-text-primary">
                          {t('form.fields.message')}
                        </Label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          placeholder={t('form.fields.messagePlaceholder')}
                          rows={5}
                          className="w-full rounded-lg border border-border-custom px-3 py-2 text-sm focus:border-purple-600 focus:ring-purple-600 focus:outline-none focus:ring-1 disabled:opacity-50"
                        />
                      </div>

                      {/* Honeypot: invisible to visitors, bots fill it and get dropped. */}
                      <div
                        aria-hidden="true"
                        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                      >
                        <label htmlFor="website">Website</label>
                        <input
                          id="website"
                          name="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={formData.website}
                          onChange={handleChange}
                        />
                      </div>

                      {TURNSTILE_SITE_KEY && (
                        <TurnstileWidget
                          ref={turnstileRef}
                          siteKey={TURNSTILE_SITE_KEY}
                          action="contact"
                          language={locale}
                          onToken={setTurnstileToken}
                          onError={() => setError(t('form.captchaError'))}
                        />
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                        disabled={isSubmitting || awaitingTurnstile}
                      >
                        {isSubmitting && (
                          <span
                            aria-hidden="true"
                            className="mr-2 h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin"
                          />
                        )}
                        {isSubmitting ? t('form.submitting') : t('form.submit')}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-8" role="status">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      {t('success.title')}
                    </h3>
                    <p className="text-text-secondary mb-6">
                      {t('success.description')}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData(EMPTY_FORM);
                      }}
                      className="border-border-custom hover:bg-purple-50 hover:text-purple-600"
                    >
                      {t('success.cta')}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* FAQ link */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-border-custom p-6 text-center">
                <p className="text-text-secondary mb-3">
                  {t('faq.prompt')}
                </p>
                <a
                  href="/pricing#faq"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {t('faq.cta')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
