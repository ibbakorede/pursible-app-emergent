import { ArrowLeft, MessageCircle, Mail, FileText, Clock, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const FAQS = [
  { id: 'withdrawal-time', q: 'How long do withdrawals take?', a: 'NGN withdrawals typically arrive within 1–24 hours depending on your bank.' },
  { id: 'conversion-fees', q: 'What are the conversion fees?', a: 'A small percentage fee applies per conversion. Check the rate displayed before confirming.' },
  { id: 'kyc-complete', q: 'How do I complete KYC?', a: 'Go to Profile → KYC Verification and follow the steps to upload your documents.' },
  { id: 'multiple-banks', q: 'Can I add multiple bank accounts?', a: 'Yes, you can link up to 5 Nigerian bank accounts for withdrawals.' },
  { id: 'supported-currencies', q: 'What currencies are supported?', a: 'We support USD, USDC, USDT, and NGN wallets with live conversions between them.' },
];

export default function Support() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Help & Support</h1>
            <p className="text-xs text-muted-foreground">We're here to help</p>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold mb-1">How can we help?</h2>
          <p className="text-sm opacity-70">Our support team typically responds within a few hours</p>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs opacity-80">
            <Clock className="w-3.5 h-3.5" />
            <span>Available Mon–Fri, 9am–6pm WAT</span>
          </div>
        </div>

        {/* Contact channels */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact Us</p>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {/* Live Chat — opens Crisp widget */}
            <button
              className="w-full flex items-center gap-3.5 px-4 py-4 hover:bg-muted/50 transition-colors cursor-pointer text-left"
              onClick={() => window.$crisp?.push(['do', 'chat:open'])}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Live Chat</p>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Online</span>
                </div>
                <p className="text-xs text-muted-foreground">Chat with our support team now</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Email Support */}
            <a
              href="mailto:support@paysible.com?subject=Pursible%20Support%20Request"
              className="flex items-center gap-3.5 px-4 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-purple-50">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Email Support</p>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Online</span>
                </div>
                <p className="text-xs text-muted-foreground">support@paysible.com</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Links</p>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/legal" className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50">
                <FileText style={{ width: '1.1rem', height: '1.1rem' }} className="text-slate-600" />
              </div>
              <p className="text-sm font-medium">Terms of Service</p>
            </Link>
            <a href="https://status.paysible.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50">
                <Zap style={{ width: '1.1rem', height: '1.1rem' }} className="text-amber-600" />
              </div>
              <p className="text-sm font-medium">System Status</p>
            </a>
          </div>
        </div>

        {/* FAQs */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Frequently Asked Questions</p>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {FAQS.map((faq) => (
              <div key={faq.id}>
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium pr-3">{faq.q}</p>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === faq.id ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === faq.id && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}