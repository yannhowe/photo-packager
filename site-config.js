window.SITE = {
  pressName: "Photo Packager",
  operator: "Studio operator",
  location: "Local fulfilment",
  currencySymbol: "$",
  printPrice: 88,
  included: "Prints, metadata backs, fitted no-glue sleeve, and tracked postage",
  photoLimit: 24,
  // Operator inbox for mailed order slips. Example: "hello@example.com"
  email: "",
  stripe: {
    // Dashboard → Payment Links.
    // 1. Four fixed-amount links: $88, $96, $106, $116 (print + tip chips).
    // 2. One customer-chooses-amount link for the free-studio tip jar.
    // Currency should match the amounts shown on the site.
    // Success message: ask the customer to keep their order number
    // and wait for an email requesting a private photo link.
    print: "",
    tips: {
      88: "",
      96: "",
      106: "",
      116: "",
    },
    tipJar: "",
  },
};
