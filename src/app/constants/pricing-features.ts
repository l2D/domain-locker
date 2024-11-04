

type Plan = 'free' | 'starter' | 'pro' | 'self-hosted' | 'sponsor' | 'complimentary' | 'enterprise' | 'tester';
// Free: 5 domains and basic features
// Starter: 20 domains
// Pro: 100 domains, all features
// Self-Hosted: All features, no cloud access
// Sponsor: Starter features, free for sponsors
// Complimentary: Starter features, but for free
// Enterprise: All features
// Tester: All features, debugging and logging enabled

export interface PricingFeature {
  title: string;
  priceMonth: string;
  priceAnnual: string;
  features: string[];
  antiFeatures?: string[];
};

export const pricingFeatures = [
  {
    title: 'Free',
    priceMonth: '0',
    priceAnnual: '0',
    features: [
      '5 Domains',
      'Expiry Notifications',
      'Basic Statistics',
    ]
  },
  {
    title: 'Starter',
    priceMonth: '7',
    priceAnnual: '5',
    features: [
      '20 Domains',
      'Expiry Notifications',
      'Change Notifications',
      'Domain Change History',
      'Detailed Statistics',
      'Advanced Alerts',
    ]
  },
  {
    title: 'Pro',
    priceMonth: '25',
    priceAnnual: '20', 
    features: [
      '100 Domains',
      'Expiry Notifications',
      'Change Notifications',
      'Domain Change History',
      'Detailed Statistics',
      'Advanced Alerts',
      'Domain Monitoring',
      'Custom Branding',
      'Support',
    ]
  },
];

export const selfHostedFeatures =  {
  title: 'Self-Hosted',
  priceMonth: '0',
  priceAnnual: '0', 
  features: [
    'All the features of Pro',
    'Highly configurable with code',
    'Docker Deployment Supported',
  ],
  antiFeatures: [
    'You provision and maintain your own infrastructure',
    'You\'re responsible for server security, backups and availability',
    'Community support only',
  ],
};

export const billingFaq = [
  {
    question: 'What happens if I cancel my subscription?',
    answer: `
      You will be notified, and advised to export your data (if you want to move it to another platform).
      You will be able to use the service until the end of the current billing period`,
  },
  {
    question: 'I can\'t afford the Pro plan, can I get a discount?',
    answer: `
      We offer a smaller Starter plan at an affordable price, as well as a discount for paying annually instead of monthly.
      And since the code is open source, you can also run Domain Locker locally for free.\n
      If you're a student, open-source maintainer, residing in a low income country, or cannot otherwise afford a paid plan,
      then reach out and I will try and help you out :) 
    `,
  },
  {
    question: 'What happens if I exceed the domain limit?',
    answer: 'You will be notified and given the option to upgrade your plan or remove domains',
  },
  {
    question: 'Do you offer a lifetime plan?',
    answer: 'Not currently, because the monthly/annual subscriptions are needed to cover the ongoing server costs',
  },
  {
    question: 'What payment methods do you accept?',
    answer: `We accept all major debit and credit cards from almost every country.
    In the future we will also look into accepting digital wallets, Apple/Google Pay, and cryptocurrencies (BTC, ETH, XMR).
    If you need to pay with a different method, please reach out.`,
  },
  {
    question: 'What is your refund policy?',
    answer: `If you're unhappy with anything at all, we offer a 30-day money-back guarantee, no questions asked.
    You can also export all your data and cancel your subscription easily at any time.`,
  },
  {
    question: 'Can I get an invoice for my subscription?',
    answer: `Yes, under Settings --> Billing, you can download a PDF invoice for all of your transactions.`
  },
];
