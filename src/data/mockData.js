export const topNavItems = ["Personal", "Corporate", "International"];

export const bankingCategories = [
  "Accounts & Deposit",
  "Loan",
  "Cards",
  "Digital Banking",
  "Invest & Insure"
];

export const languages = [
  { name: "English", active: false },
  { name: "Hindi", active: true },
  { name: "Marathi", active: true },
  { name: "Gujarati", active: true }, // Set Gujarati to active since it's hardcoded to work
  { name: "Bengali", active: false },
  { name: "Tamil", active: false },
  { name: "Telugu", active: false },
  { name: "Punjabi", active: false },
  { name: "Kannada", active: false },
  { name: "Malayalam", active: false },
  { name: "Assamese", active: false },
  { name: "Odia", active: false }
];

export const productCards = [
  {
    title: "Accounts & Deposit",
    description: "Savings, salary and recurring deposit journeys with clearer onboarding steps.",
    icon: "account"
  },
  {
    title: "Retail Loan",
    description: "Home, vehicle and personal loan products organised for quick comparison.",
    icon: "loan"
  },
  {
    title: "MSME Loan",
    description: "Working capital, invoice finance and growth products for local businesses.",
    icon: "msme"
  },
  {
    title: "Gold Loan",
    description: "Fast collateral-backed lending with visible eligibility and branch support.",
    icon: "gold"
  }
];

export const marathiDemoScript = [
  // Turn 1
  {
    type: "customer_speaking",
    content: { language: "Marathi", text: "मला नवीन खाते उघडायचे आहे" }
  },
  {
    type: "translation_complete",
    content: { language: "English", text: "I want to open a new bank account" }
  },
  {
    type: "intent_detected",
    content: {
      intent: "Account Opening",
      confidence: 93,
      processTitle: "Account Opening Process",
      processSteps: ["Ask for Aadhaar", "Ask for PAN", "Capture mobile number", "Select account type"],
      requiredDocuments: ["Aadhaar", "PAN", "Passport photo"],
      suggestedReplyEnglish: "Do you have an Aadhaar card?",
      suggestedReplyMarathi: "तुमच्याकडे आधार कार्ड आहे का?"
    }
  },
  { type: "staff_speaking", content: null },

  // Turn 2
  {
    type: "customer_speaking",
    content: { language: "Marathi", text: "हो माझ्याकडे आहे. पण पॅन कार्ड नाहीये." }
  },
  {
    type: "translation_complete",
    content: { language: "English", text: "Yes, I have it. But I don't have a PAN card." }
  },
  {
    type: "intent_updated",
    content: {
      intent: "Account Opening",
      confidence: 98,
      processTitle: "Account Opening Process",
      processSteps: ["✅ Ask for Aadhaar", "❌ Ask for PAN (Missing)", "Capture mobile number", "Select account type"],
      requiredDocuments: ["Aadhaar", "Form 60 (Alternate)", "Passport photo"],
      suggestedReplyEnglish: "No problem. We can use Form 60 instead of a PAN card. What is your mobile number?",
      suggestedReplyMarathi: "काही हरकत नाही. आपण पॅन कार्ड ऐवजी फॉर्म 60 वापरू शकतो. तुमचा मोबाईल नंबर काय आहे?"
    }
  },
  { type: "staff_speaking", content: null },

  // Turn 3
  {
    type: "customer_speaking",
    content: { language: "Marathi", text: "माझा नंबर आहे ९८७६५४३२१०" }
  },
  {
    type: "translation_complete",
    content: { language: "English", text: "My number is 9876543210" }
  },
  {
    type: "intent_updated",
    content: {
      intent: "Account Opening",
      confidence: 99,
      processTitle: "Account Opening Process",
      processSteps: ["✅ Ask for Aadhaar", "✅ Ask for PAN (Missing)", "✅ Capture mobile number", "Select account type"],
      requiredDocuments: ["Aadhaar", "Form 60 (Alternate)", "Passport photo"],
      suggestedReplyEnglish: "Thank you. Would you like to open a Savings account or a Current account?",
      suggestedReplyMarathi: "धन्यवाद. तुम्हाला बचत खाते (Savings Account) उघडायचे आहे की चालू खाते (Current Account)?"
    }
  },
  { type: "staff_speaking", content: null },

  // Turn 4
  {
    type: "customer_speaking",
    content: { language: "Marathi", text: "मला बचत खाते उघडायचे आहे." }
  },
  {
    type: "translation_complete",
    content: { language: "English", text: "I want to open a Savings account." }
  },
  {
    type: "intent_updated",
    content: {
      intent: "Account Opening",
      confidence: 99,
      processTitle: "Account Opening Process",
      processSteps: ["✅ Ask for Aadhaar", "✅ Ask for PAN (Missing)", "✅ Capture mobile number", "✅ Select account type"],
      requiredDocuments: ["Aadhaar", "Form 60 (Alternate)", "Passport photo"],
      suggestedReplyEnglish: "Great. Please provide your documents and sign the form to complete the process.",
      suggestedReplyMarathi: "उत्तम. कृपया तुमची कागदपत्रे द्या आणि प्रक्रिया पूर्ण करण्यासाठी फॉर्मवर सही करा."
    }
  },
  { type: "staff_speaking", content: null }
];


export const gujaratiDemoScript = [
  // Turn 1
  {
    type: "customer_speaking",
    content: { language: "Gujarati", text: "મારે એક નવી લોન લેવી છે." }
  },
  {
    type: "translation_complete",
    content: { language: "English", text: "I want to take a new loan." }
  },
  {
    type: "intent_detected",
    content: {
      intent: "Loan Enquiry",
      confidence: 91,
      processTitle: "Loan Enquiry Process",
      processSteps: ["Ask loan type", "Check existing account", "Ask loan amount", "Inform interest rate"],
      requiredDocuments: ["Identity Proof", "Income Proof", "Bank Statement"],
      suggestedReplyEnglish: "Which type of loan are you looking for? Home, Auto, or Personal loan?",
      suggestedReplyGujarati: "તમે કયા પ્રકારની લોન શોધી રહ્યા છો? હોમ લોન, ઓટો લોન કે પર્સનલ લોન?"
    }
  },
  { type: "staff_speaking", content: null },

  // Turn 2
  {
    type: "customer_speaking",
    content: { language: "Gujarati", text: "મારે પર્સનલ લોન જોઈએ છે." }
  },
  {
    type: "translation_complete",
    content: { language: "English", text: "I want a personal loan." }
  },
  {
    type: "intent_updated",
    content: {
      intent: "Personal Loan",
      confidence: 96,
      processTitle: "Personal Loan Enquiry",
      processSteps: ["✅ Ask loan type", "Check existing account", "Ask loan amount", "Inform interest rate"],
      requiredDocuments: ["Identity Proof", "Salary Slips (3 months)", "Bank Statement (6 months)"],
      suggestedReplyEnglish: "Do you already have an account with Union Bank?",
      suggestedReplyGujarati: "શું તમારું યુનિયન બેંકમાં પહેલાથી કોઈ ખાતું છે?"
    }
  },
  { type: "staff_speaking", content: null },

  // Turn 3
  {
    type: "customer_speaking",
    content: { language: "Gujarati", text: "હા, મારું સેવિંગ એકાઉન્ટ છે અહીં." }
  },
  {
    type: "translation_complete",
    content: { language: "English", text: "Yes, I have a savings account here." }
  },
  {
    type: "intent_updated",
    content: {
      intent: "Personal Loan",
      confidence: 99,
      processTitle: "Personal Loan Enquiry",
      processSteps: ["✅ Ask loan type", "✅ Check existing account", "Ask loan amount", "Inform interest rate"],
      requiredDocuments: ["Account Number", "Salary Slips (3 months)"],
      suggestedReplyEnglish: "That makes it easier. How much loan amount do you need?",
      suggestedReplyGujarati: "તેનાથી પ્રક્રિયા સરળ બની જશે. તમારે કેટલી લોનની રકમની જરૂર છે?"
    }
  },
  { type: "staff_speaking", content: null },

  // Turn 4
  {
    type: "customer_speaking",
    content: { language: "Gujarati", text: "અંદાજે પાંચ લાખ રૂપિયા." }
  },
  {
    type: "translation_complete",
    content: { language: "English", text: "Around five lakh rupees." }
  },
  {
    type: "intent_updated",
    content: {
      intent: "Personal Loan",
      confidence: 99,
      processTitle: "Personal Loan Enquiry",
      processSteps: ["✅ Ask loan type", "✅ Check existing account", "✅ Ask loan amount", "Inform interest rate"],
      requiredDocuments: ["Account Number", "Salary Slips (3 months)"],
      suggestedReplyEnglish: "For 5 Lakhs, our interest rate starts from 11.4%. Please provide your account number and salary slips.",
      suggestedReplyGujarati: "5 લાખ માટે, અમારો વ્યાજ દર 11.4% થી શરૂ થાય છે. કૃપા કરીને તમારો એકાઉન્ટ નંબર અને સેલરી સ્લિપ આપો."
    }
  },
  { type: "staff_speaking", content: null }
];

export const sessionDetails = {
  staffLanguage: "English"
};
