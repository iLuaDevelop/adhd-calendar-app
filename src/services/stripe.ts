import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe - replace with your publishable key
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_live_51ShqzUARhyJ31JUPUENyN04pttCJ0nNGb0vVnop5A87hKE2BOYCT5Pm0o0hV0EhItcSopqnuHT8HSD42smN4b28l00Tt8lpjJy';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

interface CreatePaymentIntentResponse {
  clientSecret: string;
  error?: string;
}

/**
 * Create a payment intent on the backend
 * Desktop: Uses Electron IPC to main process
 * Web: Uses Vercel API endpoint
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  description: string = ''
): Promise<CreatePaymentIntentResponse> => {
  try {
    // For desktop (Electron with file:// protocol), use IPC to main process
    if (window.location.protocol === 'file:') {
      const electron = (window as any).electron;
      if (electron && electron.ipcRenderer) {
        try {
          const result = await electron.ipcRenderer.invoke('create-payment-intent', [amount, currency, description]);
          return result;
        } catch (error: any) {
          return { clientSecret: '', error: error.message };
        }
      } else {
        return { clientSecret: '', error: 'Stripe not initialized' };
      }
    }

    // For web deployment (http/https), use real API
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { clientSecret: '', error: 'Failed to create payment intent' };
  }
};

/**
 * Confirm card payment
 */
export const confirmCardPayment = async (
  stripe: Stripe,
  elements: any,
  clientSecret: string,
  cardElement: any
) => {
  try {
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'Guest User',
        },
      },
    });

    return result;
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};
