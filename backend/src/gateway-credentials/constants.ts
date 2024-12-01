export const GATEWAYS = {
  RAZORPAY: {
    id: 'RAZORPAY',
    name: 'Razorpay',
    credentials: {
      id: 'razorpayKeyId',
      secret: 'razorpayKeySecret',
      enabled: 'isRazorpayEnabled',
    },
  },
  PHONEPE: {
    id: 'PHONEPE',
    name: 'PhonePe',
    credentials: {
      id: 'phonepeMerchantId',
      secret: 'phonepeMerchantSecret',
      enabled: 'isPhonepeEnabled',
    },
  },
  STRIPE: {
    id: 'STRIPE',
    name: 'Stripe',
    credentials: {
      id: 'stripePublishableKey',
      secret: 'stripeSecretKey',
      enabled: 'isStripeEnabled',
    },
  },
};
