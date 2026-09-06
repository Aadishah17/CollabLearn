import React, { useState } from 'react';
import GooglePayButton from '@google-pay/button-react';
import { CheckCircle, Crown, ArrowLeft, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import MainNavbar from '../../navbar/mainNavbar';
import { API_URL } from '../../config';

export default function GooglePayExample() {
  const [paymentData, setPaymentData] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLoadPaymentData = (paymentRequest) => {
    const pm = paymentRequest?.paymentMethodData || {};
    const info = pm.info || {};
    const tokenization = pm.tokenizationData || {};

    const displayData = {
      cardNetwork: info.cardNetwork || null,
      cardDetails: info.cardDetails || null,
      token: tokenization.token || null,
    };

    const tokenAuth = localStorage.getItem('token');
    if (tokenAuth) {
      fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAuth}`,
        },
        body: JSON.stringify({ isPremium: true }),
      })
        .then(async (res) => {
          try {
            const json = await res.json();
            if (res.ok && json.success) {
              localStorage.setItem('isPremium', 'true');
              window.dispatchEvent(
                new CustomEvent('profileUpdated', { detail: { isPremium: true } })
              );
            } else {
              console.error('Failed to update premium status', json);
            }
          } catch (e) {
            console.error('Error parsing response when updating premium status', e);
          }
        })
        .catch((err) => {
          console.error('Network error updating premium status', err);
        });
    }

    setPaymentData(displayData);
    setSuccess(true);
  };

  const order = {
    amount: '499.00',
    currency: 'INR',
    description: 'CollabLearn Pro Accelerator Membership (Monthly)',
  };

  return (
    <div className="glass-page min-h-screen text-zinc-100 font-sans">
      <MainNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-6">
          <Link
            to="/get-premium"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Membership Plans
          </Link>
        </div>

        <div className="surface-card card-spotlight p-7 md:p-10 rounded-3xl overflow-hidden relative">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-400/15 blur-[80px]" />

          <div className="relative grid md:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            {/* Left: Order Details */}
            <div>
              <div className="eyebrow mb-3">
                <Crown size={14} className="text-amber-400" />
                Secure Checkout
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Confirm Pro Membership
              </h1>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Unlock instant video sessions, AI synthesis tools, and verified instructor access.
              </p>

              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Plan</span>
                  <span className="font-bold text-white">Pro Accelerator</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Cycle</span>
                  <span className="text-zinc-200">Monthly auto-renew</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-sm font-bold text-white">Total Due</span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {order.currency} {order.amount}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  'In-browser WebRTC 1v1 video rooms',
                  'Unlimited AI Studio synthesis & quizzes',
                  'Priority booking with verified 5.0 mentors',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Payment Method Container */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-center">
              {!success ? (
                <div className="w-full space-y-4">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 inline-flex items-center justify-center text-zinc-300 mx-auto mb-2">
                    <ShieldCheck size={24} className="text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Select Payment Provider</h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    Test sandbox enabled for Google Pay verification.
                  </p>

                  <div className="flex justify-center">
                    <GooglePayButton
                      environment="TEST"
                      buttonColor="black"
                      buttonType="pay"
                      buttonSizeMode="fill"
                      paymentRequest={{
                        apiVersion: 2,
                        apiVersionMinor: 0,
                        allowedPaymentMethods: [
                          {
                            type: 'CARD',
                            parameters: {
                              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                              allowedCardNetworks: ['MASTERCARD', 'VISA'],
                            },
                            tokenizationSpecification: {
                              type: 'PAYMENT_GATEWAY',
                              parameters: {
                                gateway: 'example',
                                gatewayMerchantId: 'exampleGatewayMerchantId',
                              },
                            },
                          },
                        ],
                        merchantInfo: {
                          merchantId: '12345678901234567890',
                          merchantName: 'CollabLearn',
                        },
                        transactionInfo: {
                          totalPriceStatus: 'FINAL',
                          totalPriceLabel: 'Total',
                          totalPrice: order.amount,
                          currencyCode: order.currency,
                          countryCode: 'IN',
                        },
                      }}
                      onLoadPaymentData={handleLoadPaymentData}
                    />
                  </div>

                  <p className="text-[11px] text-zinc-500 mt-4">
                    Encrypted with 256-bit TLS protocol. Cancel anytime in your profile settings.
                  </p>
                </div>
              ) : (
                <div className="w-full text-center py-4 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Payment Successful!</h3>
                  <p className="text-xs text-zinc-300">
                    Your account has been upgraded to{' '}
                    <span className="text-amber-400 font-bold">Pro Accelerator</span>.
                  </p>

                  {paymentData?.cardNetwork && (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-zinc-400 font-mono">
                      Charged to {paymentData.cardNetwork} (Token: Verified)
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="glass-cta justify-center py-2.5 text-xs font-bold w-full mt-4"
                  >
                    Go to Workspace Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
