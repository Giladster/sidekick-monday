// Mock answer library and sample content.
// The real backend replaces this with the approved library + Claude API.
window.COACH_DATA = {
  library: [
    {
      id: "training", category: "Data",
      keywords: ["train", "training", "learn from"],
      worry: "Our data will train someone else's AI.",
      answer: "Your data is not used to train AI models. It is processed only to answer your request, under the same security terms you already have with monday.",
      keyPoints: [["not used to train", "won't train", "doesn't train", "never train", "not train"], ["security", "terms", "contract"]],
      next: "Send the AI data-use page to their security lead.",
      sources: [{ title: "Trust Center: AI and your data", url: "https://monday.com/trustcenter" }]
    },
    {
      id: "residency", category: "Data",
      keywords: ["residency", "region", "physically", "lives", "where does", "where that information", "legal"],
      worry: "Our data has to stay in our region.",
      answer: "AI follows your account's data region. If your account is hosted in the EU, AI processing stays in the EU.",
      keyPoints: [["region", "eu", "us", "residency"], ["stays", "hosted"]],
      next: "Confirm their account region and share it with Legal.",
      sources: [{ title: "Data residency", url: "https://monday.com/trustcenter" }]
    },
    {
      id: "vendor", category: "Trust",
      keywords: ["which ai model", "vendor", "sub-processor", "subprocessor", "under the hood", "vetted", "security team"],
      worry: "We don't know who is behind the AI.",
      answer: "We use vetted model providers, listed on our sub-processor list. Each one passes our security review and is bound by contract not to train on your data.",
      keyPoints: [["vetted", "review", "approved"], ["sub-processor", "subprocessor", "list"]],
      next: "Share the sub-processor list today.",
      sources: [{ title: "Sub-processor list", url: "https://monday.com/trustcenter" }]
    },
    {
      id: "bill", category: "Cost",
      keywords: ["bill", "budget", "ceiling", "predictable", "variable cost", "blows through", "blow through", "surprise", "limit"],
      worry: "A surprise bill nobody planned for.",
      answer: "You set a monthly credit cap. When it is reached, AI pauses. Nothing goes over unless you choose it.",
      keyPoints: [["cap", "limit"], ["pause", "stop", "no overage", "never go over", "won't go over"]],
      next: "Offer a 2-user pilot with a small credit cap.",
      sources: [{ title: "AI credits and caps", url: "https://support.monday.com" }]
    },
    {
      id: "credits", category: "Cost",
      keywords: ["credits", "black box", "consuming", "usage", "billing", "how many", "cfo", "depends on complexity", "different answers"],
      worry: "Credits feel like a black box.",
      answer: "Admins see credit use by user, board, and feature in one view. Run a 2-week pilot and you forecast from your own numbers, not guesses.",
      keyPoints: [["usage view", "see", "view", "dashboard", "track"], ["pilot", "forecast", "real numbers"]],
      next: "Book a 2-week pilot, then review usage together.",
      sources: [{ title: "Credit usage view", url: "https://support.monday.com" }]
    },
    {
      id: "control", category: "Control",
      keywords: ["turn it on", "who can", "lock", "enable", "permissions", "admin", "on their own"],
      worry: "People will switch things on without approval.",
      answer: "Admins decide who can use AI, by user or team. Nothing turns on unless an admin allows it.",
      keyPoints: [["admin"], ["user", "team", "who can", "permission"]],
      next: "Walk their admin through the AI settings.",
      sources: [{ title: "AI admin controls", url: "https://support.monday.com" }]
    },
    {
      id: "killswitch", category: "Control",
      keywords: ["shut", "turn it off", "turning the whole thing off", "switch off", "compliance asks", "turn off"],
      worry: "They need a way out.",
      answer: "Yes. An admin can turn AI off for the whole account in one click, and turn it back on anytime.",
      keyPoints: [["one click", "turn off", "switch off", "shut"], ["admin", "anytime"]],
      next: "Show the off switch live in the admin panel.",
      sources: [{ title: "AI admin controls", url: "https://support.monday.com" }]
    },
    {
      id: "review", category: "Trust",
      keywords: ["wrong", "accountable", "write access", "human", "checking", "mistake", "glitch"],
      worry: "AI will make a mistake in front of a client.",
      answer: "Set agents to suggest, not act. A person approves each change before it goes live.",
      keyPoints: [["suggest", "draft"], ["approve", "review", "human", "person"]],
      next: "Pilot on an internal board first.",
      sources: [{ title: "Agent approval settings", url: "https://support.monday.com" }]
    },
    {
      id: "audit", category: "Trust",
      keywords: ["log", "what it did", "see things", "shouldn't", "step by step", "prompt", "where does"],
      worry: "They can't see what the AI does.",
      answer: "Agents only see what their user can see. Every action is logged with what it did and why.",
      keyPoints: [["permission", "only see", "can see"], ["log", "audit", "history"]],
      next: "Open the activity log on a sample board.",
      sources: [{ title: "Agent activity log", url: "https://support.monday.com" }]
    },
    {
      id: "pilot", category: "Control",
      keywords: ["two people", "pilot", "whole team", "go slow", "day one", "reckless", "everyone at once", "test case", "controlled"],
      worry: "Rolling out to everyone is too risky.",
      answer: "Agreed. Start with 2 to 5 people on one workflow, cap the credits, and review after 2 weeks.",
      keyPoints: [["2", "two", "five", "few", "small"], ["review", "weeks", "cap"]],
      next: "Pick the pilot group and one workflow.",
      sources: [{ title: "Pilot playbook", url: "https://support.monday.com" }]
    },
    {
      id: "chatgpt", category: "Value",
      keywords: ["chatgpt", "already pay", "openai", "copilot", "pay more"],
      worry: "We already pay for AI.",
      answer: "ChatGPT only sees what you paste in. monday AI works inside your boards, with your data and permissions, and can take action there.",
      keyPoints: [["boards", "inside", "your data", "context"], ["action", "act", "do"]],
      next: "Show one board task ChatGPT can't do.",
      sources: [{ title: "monday AI overview", url: "https://monday.com/w/ai" }]
    },
    {
      id: "jobs", category: "Change",
      keywords: ["replace", "jobs", "scared"],
      worry: "AI will replace my people.",
      answer: "It takes the busywork, not the role. Teams spend the time they get back on clients and judgment calls.",
      keyPoints: [["busywork", "repetitive", "manual"], ["not replace", "not the role", "people", "team"]],
      next: "Ask which task their team would happily give away.",
      sources: [{ title: "Customer stories", url: "https://monday.com/customers" }]
    },
    {
      id: "roi", category: "Value",
      keywords: ["roi", "save you time", "in it for me", "upside", "time saved"],
      worry: "No proof it pays off.",
      answer: "Let's measure one workflow before and after. Hours saved times hourly cost gives you a real ROI in 2 weeks.",
      keyPoints: [["measure", "before and after", "baseline"], ["hours", "roi", "cost"]],
      next: "Agree on one workflow and its current time cost.",
      sources: [{ title: "ROI worksheet", url: "https://support.monday.com" }]
    },
    {
      id: "bandwidth", category: "Change",
      keywords: ["bandwidth", "initiatives", "retrain", "old workflow", "months", "small team", "migration", "a lot to take on", "where it actually fits", "nobody on my team asked", "pushed on us"],
      worry: "No time for another change.",
      answer: "Start with one workflow that already hurts. We set it up together in under an hour, and nothing else changes.",
      keyPoints: [["one workflow", "one", "small"], ["together", "we set", "help"]],
      next: "Ask which weekly task wastes the most time.",
      sources: [{ title: "Quick-start workflows", url: "https://support.monday.com" }]
    },
    {
      id: "hype", category: "Value",
      keywords: ["hype", "didn't deliver", "skeptical", "magic", "never even used", "like us", "industry", "guinea pig", "experimental", "reliable", "game-changing"],
      worry: "We've been burned by hype before.",
      answer: "Fair. Don't trust the pitch, test it. One workflow, 2 weeks, and your own data decides.",
      keyPoints: [["test", "try", "pilot", "prove"], ["your data", "your own", "numbers"]],
      next: "Share one story from a customer in their industry.",
      sources: [{ title: "Customer stories", url: "https://monday.com/customers" }]
    }
  ],

  fallback: {
    id: "new", category: "New",
    worry: "Something new.",
    answer: "Ask what's behind it: “What would need to be true for this to work for you?”",
    keyPoints: [],
    next: "We logged it so the team can add an approved answer.",
    sources: []
  },

  sampleEmail:
`Hi Dana,

Thanks for the demo last week. The team liked it.

Before we move on, a few things. How do I know our data isn't being used to train your models down the line? I'm also worried we turn this on and get hit with a bill nobody budgeted for. And honestly, we already pay for ChatGPT Enterprise, so why would we pay for AI inside monday too?

Happy to talk next week.

Mark`,

  demoCall: [
    { who: "You", text: "Thanks for joining, Mark. How did the team find the AI demo?" },
    { who: "Customer", text: "They liked it. But legal will ask where this data physically lives." },
    { who: "You", text: "Good question. Let me pull that up." },
    { who: "Customer", text: "And I don't want something automated having write access without a human checking first." },
    { who: "You", text: "Makes sense. What else is on your mind?" },
    { who: "Customer", text: "Turning this on for everyone at once feels reckless. I'd rather go slow." }
  ],

  // Collected from real conversations. Practice draws from this pool.
  practicePool: [
    "How do I know our data isn't being used to train your models somewhere down the line?",
    "I'm worried we turn this on and get hit with a bill nobody budgeted for.",
    "Can I lock this down so people can't just go enable things on their own?",
    "What happens if the agent gets something wrong and it goes straight to a client?",
    "We already pay for ChatGPT Enterprise. Why would we pay more for AI inside monday too?",
    "Some people on my team are scared this is here to replace their jobs.",
    "I need ROI numbers, not just “it'll save you time.”",
    "Turning this on for everyone at once feels reckless. I'd rather go slow.",
    "If compliance asks, I want the option to just shut the whole thing off.",
    "Credits feel like a black box. How do we know what's consuming them?"
  ],

  insights: {
    period: "Last 30 days",
    heard: 412,
    change: 14,
    weekly: [
      { label: "Sep 8", count: 62 }, { label: "Sep 15", count: 71 },
      { label: "Sep 22", count: 68 }, { label: "Sep 29", count: 84 },
      { label: "Oct 6", count: 90 }, { label: "Oct 13", count: 97 },
      { label: "Oct 20", count: 104 }, { label: "Oct 27", count: 121 }
    ],
    categories: [
      { label: "Cost", count: 124 }, { label: "Data", count: 98 },
      { label: "Control", count: 76 }, { label: "Trust", count: 52 },
      { label: "Value", count: 40 }, { label: "Change", count: 22 }
    ],
    trending: [
      { label: "Surprise bills", category: "Cost", count: 64, change: 18, example: "I'm worried about a surprise bill." },
      { label: "Data used for training", category: "Data", count: 51, change: 9, example: "Is our data used to train your models?" },
      { label: "Who controls AI", category: "Control", count: 43, change: 4, example: "Who can turn AI on in our account?" },
      { label: "Already have ChatGPT", category: "Value", count: 32, change: 12, example: "We already pay for ChatGPT." },
      { label: "Fear of job loss", category: "Change", count: 21, change: -3, example: "Will this replace people on my team?" }
    ],
    unanswered: [
      { text: "Can agents work with our Salesforce data?", count: 9 },
      { text: "Does AI work in Hebrew and Arabic?", count: 6 },
      { text: "Will AI credits roll over to next month?", count: 4 }
    ]
  }
};
