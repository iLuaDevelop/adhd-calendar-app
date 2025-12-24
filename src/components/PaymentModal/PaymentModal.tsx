import React, { useState, useEffect, useRef } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { loadScript } from '@paypal/paypal-js';
import { createPaymentIntent } from '../../services/stripe';

interface PaymentModalProps {
  isOpen: boolean;
  amount: number;
  price: string;
  onClose: () => void;
  onConfirm: () => void;
}

// Inner component that uses Elements with clientSecret
const PaymentForm: React.FC<{
  amount: number;
  price: string;
  clientSecret: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ amount, price, clientSecret, onClose, onConfirm }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardName, setCardName] = useState('');
  const [error, setError] = useState<string>('');

  const parsePrice = (priceStr: string): number => {
    const match = priceStr.match(/\d+\.?\d*/);
    return match ? parseFloat(match[0]) : 0;
  };

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setError('Payment system not loaded. Please refresh and try again.');
      return;
    }

    if (!cardName.trim()) {
      setError('Please enter cardholder name');
      return;
    }

    if (!clientSecret) {
      setError('Payment method not initialized. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Confirm payment with Payment Element (handles all payment methods: card, PayPal, Apple Pay, Google Pay, etc.)
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: {
              name: cardName.trim(),
            },
          },
        },
      });

      // Check if payment succeeded
      if (result.error) {
        setError(result.error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (result.paymentIntent?.status === 'succeeded') {
        setIsProcessing(false);
        alert(`✅ Payment successful!\n\n💎 ${amount} gems added to your account!`);
        onConfirm();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ display: 'block', marginBottom: 6, color: 'var(--text)', fontSize: '0.9rem' }}>
          Cardholder Name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 6,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text)',
            fontSize: '0.95rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 6, color: 'var(--text)', fontSize: '0.9rem' }}>
          Payment Method
        </label>
        <div
          style={{
            padding: 10,
            borderRadius: 6,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--input-bg)',
          }}
        >
          <PaymentElement
            options={{
              layout: 'tabs',
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#8b5cf6',
                  colorBackground: '#1f2937',
                  colorText: '#f3f4f6',
                  colorDanger: '#ef4444',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  spacingUnit: '4px',
                  borderRadius: '6px',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: 12,
            borderRadius: 6,
            fontSize: '0.9rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
        💡 Supports: Cards, Apple Pay, Google Pay, PayPal, Klarna, and more
        <br />For testing: Use card 4242 4242 4242 4242
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="btn ghost"
          style={{ flex: 1, padding: 12, opacity: isProcessing ? 0.6 : 1 }}
        >
          Back
        </button>
        <button
          onClick={handlePayment}
          disabled={isProcessing || !stripe || !elements}
          className="btn primary"
          style={{
            flex: 1,
            padding: 12,
            opacity: isProcessing || !stripe || !elements ? 0.6 : 1,
            cursor: isProcessing || !stripe || !elements ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          {isProcessing ? '⏳ Processing...' : '💳 Pay ' + price}
        </button>
      </div>
    </div>
  );
};

// PayPal Button Component
const PayPalButtonComponent: React.FC<{
  amount: number;
  price: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ amount, price, onClose, onConfirm }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initPayPal = async () => {
      try {
        const paypal = await loadScript({
          clientId: 'AczbjPw6UzKaee8uJYM7y3d-IwOHkJ6dZPrqQt2bcCL9bNdMXYnfYasEzh1BVQeG4eSSzS5qmHn2UAFa',
          currency: 'USD',
        });

        if (paypal && containerRef.current) {
          paypal.Buttons({
            createOrder: async (data: any, actions: any) => {
              // Create order on PayPal
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: price.replace('$', ''),
                    },
                    description: `ADHD Calendar - ${amount} Gems`,
                  },
                ],
              });
            },
            onApprove: async (data: any, actions: any) => {
              setIsProcessing(true);
              try {
                // Capture the payment
                const details = await actions.order.capture();
                alert(`✅ Payment successful!\n\n💎 ${amount} gems added to your account!`);
                onConfirm();
                onClose();
              } catch (err: any) {
                setError(err.message || 'Payment failed');
              } finally {
                setIsProcessing(false);
              }
            },
            onError: (err: any) => {
              setError('PayPal payment failed. Please try again.');
              console.error('PayPal error:', err);
            },
          }).render(containerRef.current);
        }
      } catch (err: any) {
        setError('Failed to load PayPal. Please try again.');
        console.error('PayPal load error:', err);
      }
    };

    initPayPal();
  }, [amount, price, onClose, onConfirm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ display: 'block', marginBottom: 6, color: 'var(--text)', fontSize: '0.9rem' }}>
          PayPal Payment
        </label>
        <div
          style={{
            padding: 16,
            borderRadius: 6,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--input-bg)',
            minHeight: 60,
          }}
          ref={containerRef}
        />
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: 12,
            borderRadius: 6,
            fontSize: '0.9rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="btn ghost"
          style={{ flex: 1, padding: 12, opacity: isProcessing ? 0.6 : 1 }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

// Main PaymentModal component
const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  amount,
  price,
  onClose,
  onConfirm,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | null>(null);
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoadingPaymentMethod, setIsLoadingPaymentMethod] = useState(false);
  const [stripePromise, setStripePromise] = useState<any>(null);

  // Extract amount from price string (e.g., "$9.99" -> 9.99)
  const parsePrice = (priceStr: string): number => {
    const match = priceStr.match(/\d+\.?\d*/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientSecret('');
      setPaymentMethod(null);
      setError('');
      setIsLoadingPaymentMethod(false);
    }
  }, [isOpen]);

  // Fetch payment intent when user selects card payment
  const handleSelectCardPayment = async () => {
    setIsLoadingPaymentMethod(true);
    setError('');
    
    try {
      const numericPrice = parsePrice(price);
      
      // Create payment intent
      const intentResponse = await createPaymentIntent(
        numericPrice,
        'usd',
        `ADHD Calendar - ${amount} Gems`
      );

      if (intentResponse.error) {
        setError(intentResponse.error);
        setIsLoadingPaymentMethod(false);
        return;
      }

      // Initialize Stripe with clientSecret
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_live_51ShqzUARhyJ31JUPUENyN04pttCJ0nNGb0vVnop5A87hKE2BOYCT5Pm0o0hV0EhItcSopqnuHT8HSD42smN4b28l00Tt8lpjJy');
      setStripePromise(stripe);
      setClientSecret(intentResponse.clientSecret);
      setPaymentMethod('card');
    } catch (err: any) {
      setError(err.message || 'Failed to load payment method');
    } finally {
      setIsLoadingPaymentMethod(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        className="panel custom-scrollbar"
        style={{
          maxWidth: 500,
          padding: 32,
          backgroundColor: 'var(--panel)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          borderRadius: 12,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 style={{ marginTop: 0, marginBottom: 24, color: 'var(--text)', textAlign: 'center' }}>
          💎 Purchase {amount} Gems
        </h2>

        {/* Order Summary */}
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Order Total</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>
            {price}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              padding: 12,
              borderRadius: 6,
              marginBottom: 20,
              fontSize: '0.9rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Payment Method Selection */}
        {!paymentMethod ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setPaymentMethod('paypal')}
              disabled={isLoadingPaymentMethod}
              className="btn primary"
              style={{
                padding: 16,
                fontSize: '1rem',
                textAlign: 'left',
                opacity: isLoadingPaymentMethod ? 0.6 : 1,
                backgroundColor: '#0070ba',
              }}
            >
              {isLoadingPaymentMethod ? '⏳ Loading...' : '🅿️ Pay with PayPal'}
            </button>
            <button
              onClick={handleSelectCardPayment}
              disabled={isLoadingPaymentMethod}
              className="btn primary"
              style={{
                padding: 16,
                fontSize: '1rem',
                textAlign: 'left',
                opacity: isLoadingPaymentMethod ? 0.6 : 1,
              }}
            >
              {isLoadingPaymentMethod ? '⏳ Loading...' : '💳 Pay with Card or Digital Wallet'}
            </button>
          </div>
        ) : paymentMethod === 'paypal' ? (
          <PayPalButtonComponent
            amount={amount}
            price={price}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        ) : paymentMethod === 'card' && stripePromise && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              amount={amount}
              price={price}
              clientSecret={clientSecret}
              onClose={onClose}
              onConfirm={onConfirm}
            />
          </Elements>
        ) : null}
      </div>
    </div>
  );
};

export default PaymentModal;
