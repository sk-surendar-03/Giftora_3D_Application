// DRAFT policy content for JAS 3D PRINTING. Awaiting owner review and approval.
// Text wrapped in [[double brackets]] is a placeholder the business owner must
// replace with real, approved information before publication. No durations,
// guarantees or legal commitments are stated here on the owner's behalf.

export const BUSINESS_NAME = 'JAS 3D PRINTING'

export const POLICIES = {
  'shipping-delivery': {
    path: '/shipping-delivery',
    eyebrow: 'Policies',
    title: 'Shipping & Delivery',
    intro: `This page explains how orders placed with ${BUSINESS_NAME} are prepared, shipped and delivered.`,
    sections: [
      {
        heading: 'Made-to-order production',
        body: [
          `Products from ${BUSINESS_NAME}, including personalised and custom 3D printed items, are produced after an order is placed. Production time is separate from shipping time.`,
          'Estimated production time: [[PRODUCTION TIME – to be confirmed by the owner]].',
        ],
      },
      {
        heading: 'Delivery areas',
        body: ['We currently deliver to: [[DELIVERY AREAS / COUNTRIES – to be confirmed by the owner]].'],
      },
      {
        heading: 'Shipping methods and estimated delivery times',
        body: [
          'Courier partner(s): [[COURIER PARTNER(S)]].',
          'Estimated delivery time after dispatch: [[DELIVERY TIME BY REGION]].',
          'Delivery estimates are not guaranteed unless the owner states otherwise: [[CONFIRM WORDING]].',
        ],
      },
      {
        heading: 'Shipping charges',
        body: ['Shipping charges are: [[SHIPPING CHARGES / FREE-SHIPPING THRESHOLD – to be confirmed by the owner]].'],
      },
      {
        heading: 'Order tracking',
        body: [
          'Once an order is dispatched, its status can be followed on the Track Order page of this website. How tracking details are shared: [[TRACKING NOTIFICATION METHOD]].',
        ],
      },
      {
        heading: 'Delayed, lost or damaged shipments',
        body: ['Process for delayed, lost or damaged parcels: [[PROCESS AND TIME LIMIT FOR REPORTING – to be confirmed by the owner]].'],
      },
      {
        heading: 'Contact',
        body: ['For delivery questions, please use our Contact page or write to [[SUPPORT EMAIL / PHONE]].'],
      },
    ],
  },

  'returns-refunds': {
    path: '/returns-refunds',
    eyebrow: 'Policies',
    title: 'Returns & Refunds',
    intro: `This page sets out how returns, replacements and refunds are handled at ${BUSINESS_NAME}.`,
    sections: [
      {
        heading: 'Personalised and custom items',
        body: [
          'Many products are personalised or made to a customer’s own design. Whether such items can be returned or refunded: [[POLICY FOR PERSONALISED / CUSTOM ITEMS – to be confirmed by the owner]].',
        ],
      },
      {
        heading: 'Eligibility for a return or replacement',
        body: ['Conditions under which a return or replacement is accepted: [[ELIGIBILITY CONDITIONS]].', 'Time limit to request a return: [[RETURN WINDOW]].'],
      },
      {
        heading: 'Damaged, defective or incorrect items',
        body: [
          'If an item arrives damaged, defective or different from what was ordered, the customer should contact us with: [[REQUIRED INFORMATION, e.g. order number and photos]].',
          'Resolution offered (replacement, refund or other): [[RESOLUTION – to be confirmed by the owner]].',
        ],
      },
      {
        heading: 'How to request a return',
        body: ['Steps to request a return or refund: [[RETURN REQUEST PROCESS]].', 'Return shipping costs: [[WHO PAYS RETURN SHIPPING]].'],
      },
      {
        heading: 'Refunds',
        body: ['Refund method: [[REFUND METHOD]].', 'Refund processing time: [[REFUND TIMELINE]].', 'Order cancellation rules: [[CANCELLATION POLICY]].'],
      },
      {
        heading: 'Contact',
        body: ['Questions about returns and refunds can be sent through our Contact page or to [[SUPPORT EMAIL / PHONE]].'],
      },
    ],
  },

  'privacy-policy': {
    path: '/privacy-policy',
    eyebrow: 'Policies',
    title: 'Privacy Policy',
    intro: `This draft describes how ${BUSINESS_NAME} may collect and use personal information through this website. It must be reviewed by the owner, and by legal counsel where appropriate, before publication.`,
    sections: [
      {
        heading: 'Information we collect',
        body: [
          'Depending on how the website is used, we may collect: account details (such as name and email), delivery addresses and phone numbers, order and payment-related information, customisation details entered in the 3D customiser, and messages sent through the Contact form.',
          'Confirm the exact list: [[FINAL LIST OF DATA COLLECTED]].',
        ],
      },
      {
        heading: 'How we use information',
        body: [
          'Information is used to process and deliver orders, produce personalised items, provide customer support and operate the website.',
          'Any additional purposes: [[ADDITIONAL USES, IF ANY]].',
        ],
      },
      {
        heading: 'Payments',
        body: ['Payment processing provider(s): [[PAYMENT PROVIDER(S) AND HOW PAYMENT DATA IS HANDLED]].'],
      },
      {
        heading: 'Sharing of information',
        body: ['Information may be shared with service providers needed to fulfil orders, such as couriers and payment providers: [[LIST OF THIRD PARTIES]].'],
      },
      {
        heading: 'Cookies and similar technologies',
        body: ['Use of cookies, local storage or analytics: [[COOKIES / ANALYTICS DISCLOSURE – to be confirmed by the owner]].'],
      },
      {
        heading: 'Data retention and security',
        body: ['How long information is kept: [[RETENTION PERIOD]].', 'Security measures to be described: [[SECURITY STATEMENT – to be confirmed by the owner]].'],
      },
      {
        heading: 'Your choices and rights',
        body: ['How customers can access, correct or request deletion of their information: [[DATA REQUEST PROCESS AND APPLICABLE LAW]].'],
      },
      {
        heading: 'Contact and updates',
        body: ['Privacy questions can be sent to [[PRIVACY CONTACT EMAIL]]. Registered business details: [[LEGAL ENTITY NAME AND ADDRESS]].', 'Effective date: [[EFFECTIVE DATE]].'],
      },
    ],
  },

  'terms-of-service': {
    path: '/terms-of-service',
    eyebrow: 'Policies',
    title: 'Terms of Service',
    intro: `These draft terms describe the conditions for using the ${BUSINESS_NAME} website and placing orders. They must be reviewed and approved by the owner, and by legal counsel where appropriate, before publication.`,
    sections: [
      {
        heading: 'About these terms',
        body: [`By using this website or placing an order, you agree to these terms. The website is operated by ${BUSINESS_NAME}: [[LEGAL ENTITY NAME, ADDRESS AND REGISTRATION DETAILS]].`],
      },
      {
        heading: 'Orders and pricing',
        body: [
          'Orders are subject to acceptance. Prices, taxes and charges are shown at checkout. Currency and tax treatment: [[PRICING AND TAX WORDING]].',
          'Right to refuse or cancel an order: [[CONDITIONS – to be confirmed by the owner]].',
        ],
      },
      {
        heading: 'Personalised products and customer content',
        body: [
          'Customers are responsible for the text and design details they enter in the customiser, including spelling and content. Previews are an approximation of the finished item: [[PREVIEW / TOLERANCE DISCLAIMER – to be confirmed by the owner]].',
          'Content that we may refuse to produce: [[CONTENT RESTRICTIONS]].',
        ],
      },
      {
        heading: 'Production, shipping and returns',
        body: ['Production, delivery and returns are governed by the Shipping & Delivery and Returns & Refunds pages.'],
      },
      {
        heading: 'Accounts',
        body: ['Customers are responsible for keeping their account details accurate and secure: [[ACCOUNT TERMS]].'],
      },
      {
        heading: 'Intellectual property',
        body: ['Website content, branding and designs belong to their respective owners: [[IP OWNERSHIP WORDING]].'],
      },
      {
        heading: 'Limitation of liability',
        body: ['Liability terms: [[LIABILITY WORDING – legal review required]].'],
      },
      {
        heading: 'Governing law and disputes',
        body: ['Governing law and jurisdiction: [[GOVERNING LAW AND JURISDICTION]].'],
      },
      {
        heading: 'Changes and contact',
        body: ['How changes to these terms are communicated: [[CHANGE NOTICE PROCESS]]. Questions: [[SUPPORT EMAIL / PHONE]].', 'Effective date: [[EFFECTIVE DATE]].'],
      },
    ],
  },
}
