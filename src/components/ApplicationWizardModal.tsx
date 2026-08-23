import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Smartphone, ArrowRight, Loader2, AlertCircle, FileText, Upload, RefreshCw, Check, Building2, Clock } from 'lucide-react';
import { Job, Application } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface ApplicationWizardModalProps {
  job: Job | null;
  onClose: () => void;
  onSuccess: () => void;
  onOpenAuth: () => void;
}

export const ApplicationWizardModal: React.FC<ApplicationWizardModalProps> = ({
  job,
  onClose,
  onSuccess,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportFileName, setPassportFileName] = useState<string | null>(null);

  const [createdApp, setCreatedApp] = useState<Application | null>(null);
  
  // Payment states
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [stkSent, setStkSent] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Timeout state (60s window for PIN entry)
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Countdown timer for M-Pesa PIN authorization
  React.useEffect(() => {
    if (step !== 2 || paymentConfirmed || isTimedOut) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimedOut(true);
          // Notify backend of payment timeout
          if (createdApp && !paymentConfirmed) {
            api.markPaymentTimeout(
              createdApp.id,
              'Payment timed out: No PIN entered on phone within 60 seconds.'
            ).catch(() => {});
            setCreatedApp((curr) => (curr ? { ...curr, current_status: 'failed' } : null));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, paymentConfirmed, isTimedOut, createdApp?.id]);

  // Real-time status polling effect after STK push is triggered or in Step 2
  React.useEffect(() => {
    if (step !== 2 || !createdApp || paymentConfirmed || isTimedOut) return;

    let isSubscribed = true;

    const checkPaymentStatus = async () => {
      try {
        const res = await api.getPaymentStatus(createdApp.id);
        if (!isSubscribed) return;

        if (res.status === 'paid' || res.application?.current_status === 'paid') {
          setPaymentConfirmed(true);
          setIsTimedOut(false);
          setPaymentReceipt(res.payment_reference || res.application?.payment_reference || 'MPESA_APPROVED');
          if (res.application) {
            setCreatedApp(res.application);
          }
          setTimeout(() => {
            if (isSubscribed) {
              setStep(3);
            }
          }, 800);
        } else if (res.status === 'failed' || res.application?.current_status === 'failed') {
          setIsTimedOut(true);
          if (res.application) {
            setCreatedApp(res.application);
          }
        }
      } catch (e) {
        // Silent poll error
      }
    };

    // Run an immediate check on mount/trigger
    checkPaymentStatus();

    // Poll every 2 seconds for instant feedback upon callback completion
    const interval = setInterval(checkPaymentStatus, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [step, createdApp?.id, paymentConfirmed, isTimedOut, stkSent]);

  if (!job) return null;

  const isKenyaJob = job.country?.toLowerCase() === 'kenya';

  // Handle Step 1 submit: Create application in DB & Auto-dispatch STK Push
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      onOpenAuth();
      return;
    }

    if (!passportNumber.trim()) {
      setErrorMsg(isKenyaJob ? 'National ID number is required to proceed.' : 'Passport number is required to proceed with visa processing.');
      return;
    }

    try {
      const app = await api.createApplication({
        job_id: job.id,
        passport_number: passportNumber.trim(),
        phone_number: phone.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
      });

      setCreatedApp(app);

      if (job.fee_amount === 0 || app.current_status === 'paid') {
        setStep(3);
      } else {
        setStep(2);
        setTimeLeft(60);
        setIsTimedOut(false);
        // Automatically dispatch STK push prompt to client's Safaricom phone
        setPaymentLoading(true);
        try {
          const stkRes = await api.sendStkPush(app.id, phone.trim(), {
            amount: job.fee_amount,
            job_id: job.id,
            passport_number: passportNumber.trim(),
            full_name: fullName.trim(),
            email: email.trim(),
          });
          setStkSent(true);
          setPaymentMessage(stkRes.message || `M-Pesa STK Push prompt sent to ${phone.trim()}. Please check your phone.`);
        } catch (stkErr: any) {
          setErrorMsg(stkErr.message || 'Could not auto-dispatch STK push. Please check your Safaricom number and try again.');
        } finally {
          setPaymentLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize application.');
    }
  };

  // Handle Step 2: Trigger Pay Hero M-Pesa STK Push
  const handleInitiateStkPush = async () => {
    if (!createdApp) return;
    if (!phone || !phone.trim()) {
      setErrorMsg('Please enter a valid Safaricom phone number for STK Push (e.g. 0712345678).');
      return;
    }
    setPaymentLoading(true);
    setErrorMsg(null);
    setPaymentMessage(null);
    setTimeLeft(60);
    setIsTimedOut(false);

    try {
      const res = await api.sendStkPush(createdApp.id, phone.trim(), {
        amount: job.fee_amount,
        job_id: job.id,
        passport_number: passportNumber.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
      });
      setStkSent(true);
      setPaymentMessage(res.message || 'STK Push prompt sent to your M-Pesa phone number.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Pay Hero STK Push request failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-white relative shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Header & Step Indicator */}
        <div className="mb-6">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-1">
            Application Wizard
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">
            Apply for {job.title}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Destination: <strong className="text-slate-200">{job.country}</strong> | Fee: <strong className="text-emerald-400">KES {job.fee_amount.toLocaleString()}</strong>
          </p>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className={`h-2 rounded-full transition-all ${step >= 1 ? 'bg-red-500 shadow-md shadow-red-500/30' : 'bg-slate-800'}`} />
            <div className={`h-2 rounded-full transition-all ${step >= 2 ? 'bg-red-500 shadow-md shadow-red-500/30' : 'bg-slate-800'}`} />
            <div className={`h-2 rounded-full transition-all ${step >= 3 ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-slate-800'}`} />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2">
            <span className={step === 1 ? 'text-red-400' : ''}>1. Personal Info</span>
            <span className={step === 2 ? 'text-red-400' : ''}>2. Pay Hero Payment</span>
            <span className={step === 3 ? 'text-emerald-400' : ''}>3. Confirmation</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-500/50 rounded-2xl flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notice</p>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        {/* STEP 1: PERSONAL DETAILS & PASSPORT */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Full Name (as on Passport) *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Otieno Mwangi"
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  M-Pesa Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678 or 254712345678"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isKenyaJob ? 'National ID Number *' : 'Passport Number *'}
              </label>
              <input
                type="text"
                required
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder={isKenyaJob ? 'e.g. 12345678' : 'e.g. A09281734'}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 uppercase font-mono tracking-wider focus:outline-none focus:border-red-500"
              />
            </div>

            {/* ID / Passport Attachment Dropzone Placeholder */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {isKenyaJob ? 'Upload National ID Copy (PDF / Image)' : 'Upload Passport Copy (PDF / Image)'}
              </label>
              <div 
                onClick={() => setPassportFileName(isKenyaJob ? 'National_ID_12345678.pdf' : 'Passport_BioPage_A09281734.pdf')}
                className="border-2 border-dashed border-slate-700 hover:border-red-500/60 bg-slate-950/60 p-4 rounded-2xl text-center cursor-pointer transition-colors"
              >
                {passportFileName ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Attached: {passportFileName}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-slate-400 text-xs">
                    <Upload className="w-6 h-6 text-slate-500" />
                    <span className="font-medium text-slate-300">
                      {isKenyaJob ? 'Click to upload or drag National ID scan' : 'Click to upload or drag passport scan'}
                    </span>
                    <span className="text-[10px] text-slate-500">Supports PDF, JPG, PNG (Max 5MB)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-600/25 flex items-center gap-2"
              >
                Proceed to Payment <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: PAY HERO PAYMENT VERIFICATION */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                <span className="text-slate-400">Position Applied:</span>
                <span className="font-bold text-white">{job.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                <span className="text-slate-400">{isKenyaJob ? 'National ID Number:' : 'Passport Number:'}</span>
                <span className="font-mono text-amber-300 font-bold">{passportNumber}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Pay Hero Application Fee:</span>
                <span className="text-base font-black text-emerald-400">KES {job.fee_amount.toLocaleString()}</span>
              </div>
            </div>

            {/* M-Pesa Phone Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Confirm M-Pesa Phone Number for STK Push
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="flex-1 bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={handleInitiateStkPush}
                  disabled={paymentLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 shrink-0"
                >
                  {paymentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                  <span>Send STK Push</span>
                </button>
              </div>
            </div>

            {paymentMessage && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{paymentMessage}</span>
              </div>
            )}

            {/* Real-time Status Polling & Timeout Bar */}
            {!paymentConfirmed && !isTimedOut && (
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2 text-slate-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium text-slate-200">
                      {stkSent ? 'Waiting for M-Pesa PIN input on phone...' : 'Awaiting payment authorization...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>0:{timeLeft < 10 ? '0' : ''}{timeLeft}s</span>
                  </div>
                </div>

                {/* Live Countdown Progress Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* TIMEOUT / FAILED STATE */}
            {isTimedOut && !paymentConfirmed && (
              <div className="bg-red-950/70 border-2 border-red-500/80 p-5 rounded-2xl text-left space-y-3 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-red-200 uppercase tracking-wide">
                      Payment Authorization Timed Out (Marked as Failed)
                    </h4>
                    <p className="text-xs text-red-300/90 mt-1 leading-relaxed">
                      No PIN was entered on your phone or no funds were received within the 60-second authorization window. Your application payment has been recorded as <strong>FAILED</strong>. No funds were deducted.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleInitiateStkPush}
                    disabled={paymentLoading}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Retry M-Pesa STK Push</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all text-center"
                  >
                    Edit Phone Number
                  </button>
                </div>
              </div>
            )}

            {/* Pay Hero M-Pesa Live Network Processing Box (Active state) */}
            {!isTimedOut && (
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-4">
                <div className="inline-flex p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Smartphone className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">M-Pesa STK Push Prompt Active</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    An M-Pesa prompt has been dispatched to your Safaricom mobile phone. Please input your secret M-Pesa PIN to authorize <strong className="text-emerald-400">KES {job.fee_amount.toLocaleString()}</strong> before the timer expires.
                  </p>
                </div>

                {/* Waiting for network callback authorization state */}
                <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-center gap-3 text-xs font-semibold text-emerald-400">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400 shrink-0" />
                    <span className="tracking-wide">Waiting for network callback authorization...</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Do not refresh or close this window. Your application will automatically unlock as soon as the secure payment gateway confirms your transaction.
                  </p>
                </div>

                {/* Sandbox Instant Simulation for Demo/Testing */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!createdApp) return;
                      setPaymentLoading(true);
                      try {
                        const simRes = await api.simulateStkConfirm(createdApp.id, phone.trim() || '254712345678');
                        setPaymentConfirmed(true);
                        setPaymentReceipt(simRes.receipt);
                        if (simRes.application) setCreatedApp(simRes.application);
                        setTimeout(() => setStep(3), 600);
                      } catch (err: any) {
                        setErrorMsg(err.message || 'Simulation failed');
                      } finally {
                        setPaymentLoading(false);
                      }
                    }}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono transition-colors flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-800/60"
                  >
                    <span>⚡ Quick Test Sandbox: Confirm Payment Instantly</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white font-semibold"
              >
                &larr; Back to Personal Info
              </button>
              <span className="text-[11px] text-slate-400 italic">
                🔒 End-to-end encrypted mobile authorization
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION & RECEIPT */}
        {step === 3 && (
          <div className="text-center space-y-6 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white mb-1">
                Application Successfully Submitted!
              </h3>
              <p className="text-xs text-slate-300">
                Your application for <strong className="text-white">{job.title}</strong> is now registered under Adecco Group Agency.
              </p>
            </div>

            {/* Application Receipt Details */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Application Reference:</span>
                <span className="text-white font-bold">{createdApp?.id || 'APP_PENDING'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isKenyaJob ? 'National ID Number:' : 'Passport Number:'}</span>
                <span className="text-amber-300 font-bold">{passportNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Status:</span>
                <span className={`font-bold uppercase ${createdApp?.current_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {createdApp?.current_status || 'Paid'}
                </span>
              </div>
              {paymentReceipt && (
                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                  <span>M-Pesa Receipt Code:</span>
                  <span className="text-emerald-400 font-bold">{paymentReceipt}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed text-left">
              <p className="font-bold text-slate-200 mb-1">📋 Next Recruitment Steps:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>
                  {isKenyaJob 
                    ? 'Our recruitment officers will verify your National ID and credentials.' 
                    : 'Our recruitment officers will verify your passport scan and credentials.'}
                </li>
                <li>You will receive an SMS and email notification regarding medical screening schedules.</li>
                <li>Track your application anytime via the <strong>My Applications</strong> panel.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all"
            >
              Done & Return to Jobs
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
