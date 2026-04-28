'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        body {
            background-color: #131318 !important;
            color: #e4e1e9 !important;
            font-family: 'Inter', sans-serif !important;
        }
        .landing-glass-card {
            background: rgba(53, 52, 58, 0.6);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(149, 142, 160, 0.15);
        }
        .hero-gradient {
            background: radial-gradient(circle at 50% -20%, #340080 0%, #131318 70%);
        }
        main.app-content {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            background: transparent !important;
        }
      `}} />

      <div className="selection:bg-primary-container selection:text-on-primary-container min-h-screen font-body text-on-surface bg-background dark">
        {/* Top Navigation Bar */}
        <nav className="fixed top-0 w-full flex justify-between items-center px-8 py-4 bg-[#131318]/80 backdrop-blur-xl z-50">
          <div className="text-2xl font-bold tracking-tight text-[#d0bcff] font-headline">PayFear</div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-slate-400 font-medium hover:text-white transition-all duration-300 ease-in-out" href="#">How It Works</Link>
            <Link className="text-slate-400 font-medium hover:text-white transition-all duration-300 ease-in-out" href="/tasks/browse">Browse</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-slate-400 font-medium hover:text-white transition-all duration-300">Log In</Link>
            <Link href="/tasks/create" className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0px_24px_48px_rgba(0,0,0,0.4)] inline-block">Post a Task</Link>
          </div>
        </nav>

        <div className="pt-32">
          {/* Hero Section */}
          <section className="hero-gradient px-8 md:px-20 py-24 mb-12">
            <div className="max-w-4xl">
              <h1 className="font-headline font-extrabold text-6xl md:text-8xl tracking-tight text-on-surface mb-8 leading-[1.1]">
                Delegate Your Fears, <span className="text-primary">Flawlessly</span>.
              </h1>
              <p className="font-body text-xl md:text-2xl text-on-surface-variant max-w-2xl mb-12 leading-relaxed font-light">
                Handle uncomfortable calls, awkward returns, and social friction without the anxiety. Secure, anonymous, and escrow-protected.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/tasks/create" className="bg-secondary text-on-secondary-fixed px-10 py-5 rounded-xl font-bold text-lg hover:brightness-110 transition-all duration-300 shadow-xl inline-block">
                  Post a Task
                </Link>
                <Link href="/signup" className="border-2 border-outline/30 text-on-surface px-10 py-5 rounded-xl font-bold text-lg hover:bg-surface-container-high transition-all duration-300 inline-block">
                  Become an Executor
                </Link>
              </div>
            </div>
          </section>

          {/* Use Cases Bento Grid */}
          <section className="px-8 md:px-20 py-24 bg-surface-container-low">
            <div className="mb-16">
              <span className="font-label text-sm tracking-[0.2em] text-primary-fixed-dim uppercase font-semibold">Specialized Solutions</span>
              <h2 className="font-headline text-4xl md:text-5xl font-bold mt-4">Where Anxiety Ends.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
              <div className="md:col-span-8 landing-glass-card rounded-md p-10 flex flex-col justify-between group overflow-hidden relative">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-primary text-3xl">call</span>
                  </div>
                  <h3 className="text-3xl font-headline font-bold mb-4">Uncomfortable Calls</h3>
                  <p className="text-on-surface-variant text-lg max-w-md">Cancel subscriptions, negotiate medical bills, or challenge unfair charges. Our executors speak the language of corporate bureaucracy so you don't have to.</p>
                </div>
                <img className="absolute bottom-0 right-0 w-2/3 h-2/3 object-cover opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-700 pointer-events-none" alt="Close-up of a vintage telephone receiver" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDP6g0Pez6rVBBWs6ouOq83WlH1PchDUhhFax10xUpNNl2RBUDsPv571FpiZo5XGgkQzYGqYc3xFAhDgjq_ImxwBD1TosWT9sNAwjNQUp-xQ-dSz9V5YqjFVhLyabVi4shFiJmguJivLEPpLyu6Xk0J2Clrwh8UVjPy0IC5DesJJcLkeHTB3eVEngBVs-Zf5Cg896sO2Z1_5g8FRepYo0qko6uYhbWvEl5RjL5eyG9dz72zgjiimvW4RyjRSpxFT2AN_98ZlNv0WpQk"/>
              </div>
              <div className="md:col-span-4 bg-surface-container-high rounded-md p-10 flex flex-col group">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-secondary text-3xl">assignment_return</span>
                </div>
                <h3 className="text-3xl font-headline font-bold mb-4">Awkward Returns</h3>
                <p className="text-on-surface-variant text-lg">Returning a purchase in person can be stressful. We'll handle the interaction, the receipt, and the refund process seamlessly.</p>
                <div className="mt-auto pt-8">
                  <div className="h-1 bg-surface-variant w-1/3"></div>
                </div>
              </div>
              <div className="md:col-span-4 bg-surface-container-highest rounded-md p-10 flex flex-col group">
                <div className="w-12 h-12 bg-tertiary/10 rounded-lg flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-tertiary text-3xl">diversity_3</span>
                </div>
                <h3 className="text-3xl font-headline font-bold mb-4">Social Buffers</h3>
                <p className="text-on-surface-variant text-lg">From breaking lease news to managing neighbor disputes, we provide a professional buffer for life's friction points.</p>
              </div>
              <div className="md:col-span-8 landing-glass-card rounded-md p-10 flex items-center gap-12 group overflow-hidden">
                <div className="flex-1">
                  <h3 className="text-3xl font-headline font-bold mb-4">Digital Stealth</h3>
                  <p className="text-on-surface-variant text-lg">Your identity is shielded behind our encrypted layer. We act as your proxy, ensuring your personal details never enter the friction zone.</p>
                </div>
                <div className="hidden lg:block w-1/3 h-full rounded-md overflow-hidden">
                  <img className="w-full h-full object-cover opacity-60" alt="Futuristic glowing digital mesh" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJOL3ObLFujziyYGV8sysc59ZT7T1dhAuHei_7Y8zoI7o5wFd2yw5bfFwOZfNy2fyY-aKbJi3Cfjt1fFZJAvqluSV1ywUDkaLtV5mDVITpQp3IrzMlaDPOd0FbKQsx_EDytos-hUGzgqwjADo40nuCpDvz_wEn3fU2OUdfai3G8OXRSvU9PSqEne1P9DvgtGTES-Yi5KNKxJVBCgHO3z9FGsp6ly6Tz-KVyhc_KwKyfNIrs2Y6n5rPIVlLRplSRa6rAmJpbz6CsTnr"/>
                </div>
              </div>
            </div>
          </section>

          {/* 4-Step Flow */}
          <section className="px-8 md:px-20 py-32 bg-surface">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-24">
                <h2 className="font-headline text-5xl font-bold mb-6">Simple. Secure. Silent.</h2>
                <div className="h-0.5 bg-surface-container-highest w-24 mx-auto"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="relative">
                  <span className="text-8xl font-black text-surface-container-high absolute -top-12 -left-4 z-0">01</span>
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-4 font-headline">Describe the Task</h4>
                    <p className="text-on-surface-variant font-light">Tell us what needs to be handled. Be as specific as you like—or keep it brief.</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="text-8xl font-black text-surface-container-high absolute -top-12 -left-4 z-0">02</span>
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-4 font-headline">Set Your Bounty</h4>
                    <p className="text-on-surface-variant font-light">Choose what you're willing to pay. Funds are held in our secure escrow vault.</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="text-8xl font-black text-surface-container-high absolute -top-12 -left-4 z-0">03</span>
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-4 font-headline">Select Executor</h4>
                    <p className="text-on-surface-variant font-light">Pick a verified professional based on their success rate and specialized skills.</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="text-8xl font-black text-surface-container-high absolute -top-12 -left-4 z-0">04</span>
                  <div className="relative z-10">
                    <h4 className="text-xl font-bold mb-4 font-headline">Release & Breathe</h4>
                    <p className="text-on-surface-variant font-light">Once the task is verified complete, release the funds. Peace of mind achieved.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trust & Safety */}
          <section className="px-8 md:px-20 py-32 bg-surface-container-low border-t border-outline-variant/10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                <div className="bg-tertiary-container/20 text-tertiary px-4 py-2 rounded-full inline-flex items-center gap-2 mb-8">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Enterprise Grade Protection</span>
                </div>
                <h2 className="font-headline text-5xl font-bold mb-8 leading-tight">Your Peace of Mind is our <span className="text-tertiary">Only Priority.</span></h2>
                <p className="text-on-surface-variant text-xl mb-10 leading-relaxed">We built PayFear on the principle of radical protection. From escrow services to encrypted communication, your data and your money never leave the sanctuary.</p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-surface-container-high p-3 rounded-lg">
                      <span className="material-symbols-outlined text-tertiary">lock</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg">Secured by Escrow</h5>
                      <p className="text-on-surface-variant text-sm">Payments are only released when you are 100% satisfied with the outcome.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-surface-container-high p-3 rounded-lg">
                      <span className="material-symbols-outlined text-tertiary">masks</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg">Total Anonymity</h5>
                      <p className="text-on-surface-variant text-sm">Executors never see your real phone number or email address.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                <div className="landing-glass-card p-8 rounded-md flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-primary text-5xl mb-4">payments</span>
                  <p className="text-primary font-bold text-lg">Escrow Certified</p>
                </div>
                <div className="bg-surface p-8 rounded-md flex flex-col items-center text-center border border-tertiary/10">
                  <span className="material-symbols-outlined text-tertiary text-5xl mb-4">shield</span>
                  <p className="text-tertiary font-bold text-lg">256-bit AES</p>
                </div>
                <div className="bg-surface p-8 rounded-md flex flex-col items-center text-center border border-outline/10">
                  <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4">support_agent</span>
                  <p className="text-on-surface-variant font-bold text-lg">24/7 Dispute Resolution</p>
                </div>
                <div className="landing-glass-card p-8 rounded-md flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-secondary text-5xl mb-4">stars</span>
                  <p className="text-secondary font-bold text-lg">Verified Experts</p>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="px-8 md:px-20 py-32 text-center">
            <div className="max-w-3xl mx-auto landing-glass-card p-16 rounded-xl relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full"></div>
              <h2 className="font-headline text-4xl md:text-5xl font-bold mb-8">Ready to shed the weight?</h2>
              <p className="text-on-surface-variant text-xl mb-12">Join thousands of users who have reclaimed their mental energy.</p>
              <Link href="/tasks/create" className="bg-primary text-on-primary px-12 py-5 rounded-full font-bold text-xl hover:scale-105 transition-all duration-300 shadow-2xl inline-block relative z-10">
                Post Your First Task
              </Link>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="px-8 md:px-20 py-16 bg-surface-container-lowest text-on-surface-variant relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <div className="text-2xl font-black text-[#d0bcff] mb-2 font-headline">PayFear</div>
              <p className="text-sm opacity-60">The Digital Sanctuary for your social obligations.</p>
            </div>
            <div className="flex gap-12 text-sm">
              <Link className="hover:text-primary transition-colors" href="#">Privacy Policy</Link>
              <Link className="hover:text-primary transition-colors" href="#">Terms of Service</Link>
              <Link className="hover:text-primary transition-colors" href="#">Support</Link>
              <Link className="hover:text-primary transition-colors" href="#">Careers</Link>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-outline-variant/5 text-xs opacity-40 flex justify-between">
            <span>© 2026 PayFear Inc. All rights reserved.</span>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-sm">public</span>
              <span>Global Ops</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
