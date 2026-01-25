'use client';

import { useState } from 'react';
import { Navbar, Footer } from '@/components/marketing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, MessageSquare, Clock, Loader2 } from 'lucide-react';

const contactOptions = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'For general inquiries and support requests',
    contact: 'support@telegramplugin.com',
    href: 'mailto:support@telegramplugin.com',
  },
  {
    icon: MessageSquare,
    title: 'Sales',
    description: 'Questions about pricing or enterprise plans',
    contact: 'sales@telegramplugin.com',
    href: 'mailto:sales@telegramplugin.com',
  },
  {
    icon: Clock,
    title: 'Response Time',
    description: 'We typically respond within 24 hours',
    contact: 'Mon-Fri, 9am-6pm CET',
    href: null,
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    setIsSubmitting(true);

    try {
      // TODO: Implement API call to send contact form
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast.success('Message sent successfully');
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
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
            <h1 className="text-4xl lg:text-5xl font-bold text-[#1A1523] mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-[#6F6E77] max-w-2xl mx-auto">
              Have a question or need help? We&apos;re here to assist you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact form */}
            <div>
              <div className="bg-white rounded-2xl border border-[#E9E3EF] p-8">
                {!isSubmitted ? (
                  <>
                    <h2 className="text-xl font-semibold text-[#1A1523] mb-6">
                      Send us a message
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-[#1A1523]">
                            Name
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                            placeholder="Your name"
                            className="h-11 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-[#1A1523]">
                            Email
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                            placeholder="you@example.com"
                            className="h-11 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-[#1A1523]">
                          Subject
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          placeholder="How can we help?"
                          className="h-11 border-[#E9E3EF] focus:border-purple-600 focus:ring-purple-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-[#1A1523]">
                          Message
                        </Label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          placeholder="Tell us more about your question..."
                          rows={5}
                          className="w-full rounded-lg border border-[#E9E3EF] px-3 py-2 text-sm focus:border-purple-600 focus:ring-purple-600 focus:outline-none focus:ring-1 disabled:opacity-50"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isSubmitting ? 'Sending...' : 'Send message'}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-[#1A1523] mb-2">
                      Message sent!
                    </h3>
                    <p className="text-[#6F6E77] mb-6">
                      Thank you for reaching out. We&apos;ll get back to you within
                      24 hours.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="border-[#E9E3EF] hover:bg-purple-50 hover:text-purple-600"
                    >
                      Send another message
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Contact options */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1A1523]">
                Other ways to reach us
              </h2>

              <div className="space-y-4">
                {contactOptions.map((option) => (
                  <div
                    key={option.title}
                    className="bg-[#FDFAFF] rounded-xl border border-[#E9E3EF] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <option.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1A1523]">
                          {option.title}
                        </h3>
                        <p className="text-sm text-[#6F6E77] mt-0.5">
                          {option.description}
                        </p>
                        {option.href ? (
                          <a
                            href={option.href}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block"
                          >
                            {option.contact}
                          </a>
                        ) : (
                          <p className="text-sm text-[#1A1523] font-medium mt-2">
                            {option.contact}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQ link */}
              <div className="bg-white rounded-xl border border-[#E9E3EF] p-6 text-center">
                <p className="text-[#6F6E77] mb-3">
                  Looking for quick answers?
                </p>
                <a
                  href="/pricing#faq"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Check our FAQ →
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
