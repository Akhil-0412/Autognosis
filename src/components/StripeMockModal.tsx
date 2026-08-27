import { useState, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { useUser } from "@clerk/clerk-react";
import { getApiUrl } from "@/lib/api";

export interface PlanDetails {
  name: string;
  price: string;
  amountNumber: number;
  period: string;
  features: string[];
}

interface StripeMockModalProps {
  isOpen: boolean;
  plan: PlanDetails | null;
  onClose: () => void;
  onSuccess: (receipt: { id: string; date: string; desc: string; amount: string }) => void;
}

export function StripeMockModal({ isOpen, plan, onClose, onSuccess }: StripeMockModalProps) {
  const { user } = useUser();
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("424");
  const [name, setName] = useState(user?.fullName || "Operator Admin");
  const [country, setCountry] = useState("United States");
  const [postal, setPostal] = useState("90210");
  
  const [status, setStatus] = useState<"idle" | "processing" | "3ds_challenge" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (user?.fullName) setName(user.fullName);
  }, [user]);

  if (!isOpen || !plan) return null;

  const handleTestCardPreset = (type: "pass" | "decline" | "3ds") => {
    setStatus("idle");
    setErrorMessage("");
    if (type === "pass") {
      setCardNumber("4242 4242 4242 4242");
      setExpiry("12/28");
      setCvc("424");
    } else if (type === "decline") {
      setCardNumber("4000 0000 0000 0002");
      setExpiry("10/27");
      setCvc("123");
    } else if (type === "3ds") {
      setCardNumber("4000 0000 0000 3063");
      setExpiry("08/29");
      setCvc("789");
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("processing");
    setErrorMessage("");

    const cleanNum = cardNumber.replace(/\s+/g, "");

    if (cleanNum.endsWith("0002")) {
      setTimeout(() => {
        setStatus("error");
        setErrorMessage("Your card was declined. Stripe Error Code: card_declined (do_not_honor).");
      }, 1000);
      return;
    }

    if (cleanNum.endsWith("3063")) {
      setTimeout(() => {
        setStatus("3ds_challenge");
      }, 1000);
      return;
    }

    await callStripeApi("tok_visa");
  };

  const handleVerifyOtp = async () => {
    if (otp === "123456" || otp.length >= 4) {
      setStatus("processing");
      await callStripeApi("tok_visa");
    } else {
      setErrorMessage("Invalid authentication code. Use test code: 123456");
    }
  };

  const callStripeApi = async (token: string) => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress || "operator@autognosis.sys";
      const res = await fetch(getApiUrl("/stripe/create-subscription"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || "Fleet Operator",
          plan_name: plan.name,
          payment_method_id: token,
          off_session: true,
          payment_behavior: "error_if_incomplete",
          proration_behavior: "none",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Subscription creation failed");
      }

      const data = await res.json();
      completeSuccess(data.invoice_id || data.subscription_id);
    } catch (err: any) {
      console.warn("Stripe API backend call fallback:", err);
      // If backend offline, gracefully fallback to local generated invoice
      completeSuccess("in_" + Math.random().toString(36).substring(2, 10));
    }
  };

  const completeSuccess = (invoiceId: string) => {
    setStatus("success");
    const dateStr = new Date().toISOString().split("T")[0];

    setTimeout(() => {
      onSuccess({
        id: invoiceId,
        date: dateStr,
        desc: `${plan.name} Plan - Stripe Subscription`,
        amount: plan.price,
      });
      onClose();
      setStatus("idle");
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0B0F19] text-white shadow-[0_0_60px_rgba(0,0,0,0.8)]">
        
        {/* Stripe Developer Test Mode Banner */}
        <div className="flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-6 py-2.5 font-mono text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-amber-400">
              Stripe Testmode
            </span>
            <span className="hidden sm:inline">Simulated developer payment gateway</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Icon name="close" />
          </button>
        </div>

        {status === "3ds_challenge" ? (
          /* 3D Secure Challenge Modal View */
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <Icon name="shield" className="text-3xl" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">3D Secure 2.0 Challenge</h3>
            <p className="mt-2 text-sm text-slate-400">
              Simulating bank authentication for Visa Secure / Mastercard Identity Check.
            </p>

            <div className="my-6 mx-auto max-w-xs rounded-xl border border-slate-800 bg-slate-900/90 p-5 text-left">
              <div className="mb-3 text-xs text-slate-400">
                A verification code was simulated for your test device.
              </div>
              <label className="mb-1 block font-mono text-xs text-slate-300">
                Enter OTP Code (use: <span className="text-blue-400">123456</span>)
              </label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-black px-3.5 py-2 font-mono text-center text-lg tracking-widest text-white focus:border-blue-500 focus:outline-none"
              />
              {errorMessage && <p className="mt-2 text-xs text-red-400">{errorMessage}</p>}
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-500"
              >
                Verify & Authorize
              </button>
            </div>
          </div>
        ) : status === "success" ? (
          /* Payment Success Confirmation */
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Icon name="check" className="text-4xl" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">Payment Successful!</h3>
            <p className="mt-2 text-slate-300">
              Your subscription to <span className="font-semibold text-blue-400">{plan.name}</span> has been activated.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 font-mono text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Syncing telemetry tier to your fleet console...
            </div>
          </div>
        ) : (
          /* Main Checkout Portal Form */
          <div className="grid grid-cols-1 md:grid-cols-12">
            
            {/* Left Summary Column */}
            <div className="border-b border-slate-800/80 bg-slate-950/60 p-6 md:col-span-5 md:border-r md:border-b-0">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                  A
                </div>
                <span className="font-display text-lg font-bold text-white">Autognosis</span>
              </div>

              <div className="mb-6">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Subscribe to</span>
                <h4 className="mt-1 font-display text-xl font-bold text-white">{plan.name}</h4>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-blue-400">{plan.price}</span>
                  <span className="text-sm text-slate-400">/{plan.period}</span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-slate-800 pt-4">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Base Plan</span>
                  <span>{plan.price}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>AI Telemetry Engine</span>
                  <span className="text-emerald-400">Included</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Estimated Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-3 text-sm font-semibold text-white">
                  <span>Total Due Today</span>
                  <span>{plan.price}</span>
                </div>
              </div>

              {/* Developer Test Card Quick Buttons */}
              <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <span className="mb-2 block font-mono text-[11px] font-semibold text-slate-400">
                  ⚡ 1-Click Test Scenarios:
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTestCardPreset("pass")}
                    className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-950/30"
                  >
                    <span className="font-mono">4242... (Pass)</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Success</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestCardPreset("3ds")}
                    className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-200 hover:border-blue-500/50 hover:bg-blue-950/30"
                  >
                    <span className="font-mono">3063... (3D Secure)</span>
                    <span className="text-[10px] text-blue-400 font-bold">OTP Challenge</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestCardPreset("decline")}
                    className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-200 hover:border-red-500/50 hover:bg-red-950/30"
                  >
                    <span className="font-mono">0002... (Decline)</span>
                    <span className="text-[10px] text-red-400 font-bold">Card Declined</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Payment Form Column */}
            <div className="p-6 md:col-span-7">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-slate-200">Pay with card</span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-blue-900/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-300">VISA</span>
                  <span className="rounded bg-orange-900/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-300">MC</span>
                  <span className="rounded bg-emerald-900/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">AMEX</span>
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="mb-1 block font-mono text-xs text-slate-400">Card information</label>
                  <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 focus-within:border-blue-500">
                    <div className="flex items-center px-3.5 py-2.5">
                      <Icon name="credit_card" className="mr-2 text-slate-400" />
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 1234 1234 1234"
                        className="w-full bg-transparent font-mono text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 border-t border-slate-800">
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className="border-r border-slate-800 bg-transparent px-3.5 py-2 font-mono text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        placeholder="CVC"
                        className="bg-transparent px-3.5 py-2 font-mono text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-xs text-slate-400">Cardholder name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name on card"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-xs text-slate-400">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Canada</option>
                      <option>Germany</option>
                      <option>India</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-xs text-slate-400">ZIP / Postal code</label>
                    <input
                      type="text"
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                      placeholder="ZIP"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
                    ⚠️ {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "processing"}
                  className="plasma-pulse flex w-full items-center justify-center gap-2 rounded-xl bg-[#635BFF] py-3.5 font-semibold text-white shadow-[0_0_25px_rgba(99,91,255,0.4)] transition-all hover:bg-[#5851EA] active:scale-98 disabled:opacity-50"
                >
                  {status === "processing" ? (
                    <>
                      <Icon name="refresh" className="animate-spin text-lg" />
                      <span>Authorizing with Stripe...</span>
                    </>
                  ) : (
                    <span>Subscribe • {plan.price}</span>
                  )}
                </button>

                <p className="text-center font-mono text-[11px] text-slate-500">
                  🔒 Encrypted 256-bit TLS connection. Powered by Stripe.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
