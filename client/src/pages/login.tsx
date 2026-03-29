import { MdVerifiedUser, MdShield, MdDescription, MdSearch, MdTimeline } from 'react-icons/md';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useDataStore } from '@/lib/data-store';

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useDataStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    login('adebayo.ogunlesi@gov.ng');
    setIsLoading(false);
    setLocation('/');
  };

  const features = [
    { icon: MdDescription, text: 'Centralised document repository with OCR & full-text search' },
    { icon: MdTimeline, text: 'Multi-step approval workflows with SLA tracking & escalation' },
    { icon: MdShield, text: 'Immutable audit trail for compliance & regulatory review' },
    { icon: MdSearch, text: 'Role-based access control & document-level encryption' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* LEFT SIDE — Government Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#0a2e1a] via-[#0f3d23] to-[#1a5c35]">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
            style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}
          />
          <div className="absolute top-20 -left-20 w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-emerald-300/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top - Coat of Arms */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex items-center gap-4"
          >
            <img src="/nigeria-coat-of-arms.svg" alt="Federal Republic of Nigeria" className="h-16 w-auto drop-shadow-lg" />
            <div>
              <p className="text-white/90 font-bold text-lg leading-tight">Federal Republic</p>
              <p className="text-emerald-300/70 text-sm leading-tight">of Nigeria</p>
            </div>
          </motion.div>

          {/* Center - Hero */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <p className="text-emerald-400/60 text-sm font-semibold uppercase tracking-[0.2em] mb-4">Electronic Document Management System</p>
              <h1 className="text-5xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                Secure. Centralised.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">Accountable.</span>
              </h1>
              <p className="text-lg text-white/50 mb-12 leading-relaxed max-w-md">
                The official document management platform for federal government agencies. Manage the full document lifecycle with confidence.
              </p>
            </motion.div>

            {/* Features */}
            <div className="space-y-5">
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.12 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                    <feat.icon className="h-5 w-5 text-emerald-400/70" />
                  </div>
                  <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">{feat.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.2 }} className="flex items-center justify-between">
            <p className="text-xs text-white/20">Powered by Qucoon Limited &middot; Huawei Cloud</p>
            <p className="text-xs text-white/20">Unity and Faith, Peace and Progress</p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE — Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/[0.02] to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/nigeria-coat-of-arms.svg" alt="Federal Republic of Nigeria" className="h-20 w-auto" />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to the Federal EDMS</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 border-0 rounded-xl"
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 21 21" fill="none">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  Sign in with Microsoft
                </>
              )}
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 text-muted-foreground bg-background">Government Single Sign-On</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <MdVerifiedUser className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Secured Access</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Authentication is managed through your agency's directory service. All sessions are encrypted and activity is logged.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center space-y-3">
            <p className="text-xs text-muted-foreground/60">
              By signing in, you agree to the Federal EDMS terms of use and data handling policy.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
              <button className="hover:text-foreground transition-colors">Terms</button>
              <span>&middot;</span>
              <button className="hover:text-foreground transition-colors">Privacy</button>
              <span>&middot;</span>
              <button className="hover:text-foreground transition-colors">Support</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
