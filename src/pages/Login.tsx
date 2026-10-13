import { apiFetch } from '@/lib/api';
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { toast } from "sonner";
import { Sparkles, ArrowRight, X, UserCheck } from "lucide-react";

export function Login() {
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get('email') || "";
  const prefillName = searchParams.get('name') || "";

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState(prefillEmail ? "Demo@2026Password!" : "");
  const [showPopup, setShowPopup] = useState(!prefillEmail); // Pop up if no persona selected yet
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
      setPassword("Demo@2026Password!");
      setShowPopup(false);
    }
  }, [prefillEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Login failed");
      
      if (data.token) localStorage.setItem('token', data.token);
      setUser(data.user);
      navigate("/");
      toast.success(prefillName ? `Signed in as ${prefillName}` : "Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-300 relative overflow-hidden">
      {/* Top-Right Walkthrough Dialogue Box - Scaled ~1.2x with tight 0.5cm boundary wave ripples */}
      {showPopup && (
        <div className="fixed top-5 right-5 z-50 w-full sm:w-[440px] max-w-[calc(100vw-2.5rem)] animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-400 ease-out">
          <style>{`
            @keyframes boundaryWaveRipple {
              0% {
                box-shadow: 0 0 0 0px rgba(198, 161, 91, 0.85);
                opacity: 1;
              }
              65% {
                box-shadow: 0 0 0 18px rgba(198, 161, 91, 0.25);
                opacity: 0.75;
              }
              100% {
                box-shadow: 0 0 0 20px rgba(198, 161, 91, 0);
                opacity: 0;
              }
            }
            @keyframes boundaryWaveRippleDelayed {
              0% {
                box-shadow: 0 0 0 0px rgba(198, 161, 91, 0.7);
                opacity: 1;
              }
              65% {
                box-shadow: 0 0 0 18px rgba(198, 161, 91, 0.2);
                opacity: 0.7;
              }
              100% {
                box-shadow: 0 0 0 20px rgba(198, 161, 91, 0);
                opacity: 0;
              }
            }
            .wave-ripple-primary {
              animation: boundaryWaveRipple 1.3s cubic-bezier(0.1, 0.2, 0.3, 1) infinite;
            }
            .wave-ripple-secondary {
              animation: boundaryWaveRippleDelayed 1.3s cubic-bezier(0.1, 0.2, 0.3, 1) infinite 0.65s;
            }
          `}</style>

          <div className="relative">
            {/* High-frequency boundary wave ripples extending max 0.5cm (18-20px) from border */}
            <span className="absolute inset-0 pointer-events-none wave-ripple-primary rounded-none" />
            <span className="absolute inset-0 pointer-events-none wave-ripple-secondary rounded-none" />

            {/* Subtle boundary border ambient glow */}
            <span className="absolute -inset-0.5 border border-[#C6A15B]/60 pointer-events-none animate-pulse" />

            {/* Main Dialogue Card Content - 1.2x scaled sizing */}
            <div className="relative bg-[#111111] text-white border-2 border-[#C6A15B] shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_15px_rgba(198,161,91,0.25)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6A15B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C6A15B]"></span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#C6A15B]">
                    Project Walkthrough
                  </span>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 cursor-pointer transition-colors"
                  title="Close dialogue"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2.5">
                <h3 className="text-base sm:text-[17px] font-bold text-white tracking-tight">
                  Start Project Walkthrough?
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed font-normal">
                  Explore this workspace as an <strong>Administrator</strong> or any <strong>Team Member</strong>. Select a persona to test features with auto-filled credentials.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2.5">
                <Button
                  onClick={() => navigate("/walkthrough")}
                  className="bg-[#1F4D3A] hover:bg-[#1F4D3A]/90 text-white font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-none flex items-center gap-1.5 cursor-pointer shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Yes, Start Walkthrough <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 font-medium cursor-pointer transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discreet re-open button if dialogue is closed */}
      {!showPopup && (
        <button
          onClick={() => navigate("/walkthrough")}
          className="fixed top-6 right-6 z-40 bg-white hover:bg-slate-50 text-[#111111] border border-[#D1CDC4] hover:border-[#1F4D3A] px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#C6A15B]" />
          Project Walkthrough
        </button>
      )}

      {/* Standard Clean Login Card */}
      <Card className="w-full max-w-md rounded-none border border-[#D1CDC4] shadow-none bg-white">
        <CardHeader className="space-y-1 text-center bg-slate-50 border-b border-[#D1CDC4] p-6">
          <div className="w-12 h-12 bg-[#111111] mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl tracking-tighter">
            TM
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#111111]">Sign in to workspace</CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
            Enter your email below to login
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6 bg-white">
            {/* Walkthrough Persona Pre-filled Notice */}
            {prefillEmail && (
              <div className="bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-950 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold truncate block">{prefillName || prefillEmail}</span>
                    <span className="text-[11px] text-emerald-800">
                      Credentials prefilled. Click <strong>Sign in</strong> below.
                    </span>
                  </div>
                </div>
                <Link
                  to="/walkthrough"
                  className="text-emerald-800 font-bold underline hover:text-emerald-950 text-[11px] whitespace-nowrap shrink-0"
                >
                  Change
                </Link>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-none border-[#D1CDC4] focus-visible:ring-[#C6A15B] focus-visible:border-[#C6A15B]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-[#C6A15B] hover:text-[#111111]">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-none border-[#D1CDC4] focus-visible:ring-[#C6A15B] focus-visible:border-[#C6A15B]"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 p-6 bg-slate-50 border-t border-[#D1CDC4]">
            <Button
              type="submit"
              className="w-full rounded-none bg-[#1F4D3A] hover:bg-[#1F4D3A]/90 text-white font-bold uppercase tracking-widest text-xs py-5 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Signing in..." : prefillName ? `Sign in as ${prefillName}` : "Sign in"}
            </Button>
            <div className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="underline underline-offset-4 hover:text-[#111111]">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}



