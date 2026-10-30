// Mock answer library and sample content.
// The real backend replaces this with the approved library + Claude API.
window.COACH_DATA = {
  library: [
    {
      id: "training", category: "Data",
      keywords: ["train", "training", "learn from"],
      short: "We never train AI models on your data.",
      worry: "Our data will train someone else's AI.",
      answer: "Your data is not used to train AI models. It is processed only to answer your request, under the same security terms you already have with monday.",
      keyPoints: [["not used to train", "won't train", "doesn't train", "never train", "not train"], ["security", "terms", "contract"]],
      next: "Send the AI data-use page to their security lead.",
      sources: [{ title: "Trust Center: AI and your data", url: "https://monday.com/trustcenter" }]
    },
    {
      id: "residency", category: "Data",
      keywords: ["residency", "region", "physically", "lives", "where does", "where that information", "legal"],
      short: "Your data stays in your region, AI processing included.",
      worry: "Our data has to stay in our region.",
      answer: "AI follows your account's data region. If your account is hosted in the EU, AI processing stays in the EU.",
      keyPoints: [["region", "eu", "us", "residency"], ["stays", "hosted"]],
      next: "Confirm their account region and share it with Legal.",
      sources: [{ title: "Data residency", url: "https://monday.com/trustcenter" }]
    },
    {
      id: "vendor", category: "Trust",
      keywords: ["which ai model", "vendor", "sub-processor", "subprocessor", "under the hood", "vetted", "security team"],
      short: "We only use vetted model providers, and they're all on our sub-processor list.",
      worry: "We don't know who is behind the AI.",
      answer: "We use vetted model providers, listed on our sub-processor list. Each one passes our security review and is bound by contract not to train on your data.",
      keyPoints: [["vetted", "review", "approved"], ["sub-processor", "subprocessor", "list"]],
      next: "Share the sub-processor list today.",
      sources: [{ title: "Sub-processor list", url: "https://monday.com/trustcenter" }]
    },
    {
      id: "bill", category: "Cost",
      keywords: ["bill", "budget", "ceiling", "predictable", "variable cost", "blows through", "blow through", "surprise", "limit"],
      short: "There's a monthly credit cap, so AI simply pauses when you hit it.",
      worry: "A surprise bill nobody planned for.",
      answer: "You set a monthly credit cap. When it is reached, AI pauses. Nothing goes over unless you choose it.",
      keyPoints: [["cap", "limit"], ["pause", "stop", "no overage", "never go over", "won't go over"]],
      next: "Offer a 2-user pilot with a small credit cap.",
      sources: [{ title: "AI credits and caps", url: "https://support.monday.com" }]
    },
    {
      id: "credits", category: "Cost",
      keywords: ["credits", "black box", "consuming", "usage", "billing", "how many", "cfo", "depends on complexity", "different answers"],
      short: "You can see exactly where every credit goes, by user and by board.",
      worry: "Credits feel like a black box.",
      answer: "Admins see credit use by user, board, and feature in one view. Run a 2-week pilot and you forecast from your own numbers, not guesses.",
      keyPoints: [["usage view", "see", "view", "dashboard", "track"], ["pilot", "forecast", "real numbers"]],
      next: "Book a 2-week pilot, then review usage together.",
      sources: [{ title: "Credit usage view", url: "https://support.monday.com" }]
    },
    {
      id: "control", category: "Control",
      keywords: ["turn it on", "who can", "lock", "enable", "permissions", "admin", "on their own"],
      short: "You decide who gets AI. It stays off until an admin turns it on.",
      worry: "People will switch things on without approval.",
      answer: "Admins decide who can use AI, by user or team. Nothing turns on unless an admin allows it.",
      keyPoints: [["admin"], ["user", "team", "who can", "permission"]],
      next: "Walk their admin through the AI settings.",
      sources: [{ title: "AI admin controls", url: "https://support.monday.com" }]
    },
    {
      id: "killswitch", category: "Control",
      keywords: ["shut", "turn it off", "turning the whole thing off", "switch off", "compliance asks", "turn off"],
      short: "You can turn AI off for the whole account in one click.",
      worry: "They need a way out.",
      answer: "Yes. An admin can turn AI off for the whole account in one click, and turn it back on anytime.",
      keyPoints: [["one click", "turn off", "switch off", "shut"], ["admin", "anytime"]],
      next: "Show the off switch live in the admin panel.",
      sources: [{ title: "AI admin controls", url: "https://support.monday.com" }]
    },
    {
      id: "review", category: "Trust",
      keywords: ["wrong", "accountable", "write access", "human", "checking", "mistake", "glitch"],
      short: "Agents can just suggest, and a person approves every change.",
      worry: "AI will make a mistake in front of a client.",
      answer: "Set agents to suggest, not act. A person approves each change before it goes live.",
      keyPoints: [["suggest", "draft"], ["approve", "review", "human", "person"]],
      next: "Pilot on an internal board first.",
      sources: [{ title: "Agent approval settings", url: "https://support.monday.com" }]
    },
    {
      id: "audit", category: "Trust",
      keywords: ["log", "what it did", "see things", "shouldn't", "step by step", "prompt", "where does"],
      short: "Agents only see what their user sees, and everything they do is logged.",
      worry: "They can't see what the AI does.",
      answer: "Agents only see what their user can see. Every action is logged with what it did and why.",
      keyPoints: [["permission", "only see", "can see"], ["log", "audit", "history"]],
      next: "Open the activity log on a sample board.",
      sources: [{ title: "Agent activity log", url: "https://support.monday.com" }]
    },
    {
      id: "pilot", category: "Control",
      keywords: ["two people", "pilot", "whole team", "go slow", "day one", "reckless", "everyone at once", "test case", "controlled"],
      short: "Let's start small: a few people, one workflow, two weeks.",
      worry: "Rolling out to everyone is too risky.",
      answer: "Agreed. Start with 2 to 5 people on one workflow, cap the credits, and review after 2 weeks.",
      keyPoints: [["2", "two", "five", "few", "small"], ["review", "weeks", "cap"]],
      next: "Pick the pilot group and one workflow.",
      sources: [{ title: "Pilot playbook", url: "https://support.monday.com" }]
    },
    {
      id: "chatgpt", category: "Value",
      keywords: ["chatgpt", "already pay", "openai", "copilot", "pay more"],
      short: "ChatGPT only sees what you paste. monday AI works right inside your boards.",
      worry: "We already pay for AI.",
      answer: "ChatGPT only sees what you paste in. monday AI works inside your boards, with your data and permissions, and can take action there.",
      keyPoints: [["boards", "inside", "your data", "context"], ["action", "act", "do"]],
      next: "Show one board task ChatGPT can't do.",
      sources: [{ title: "monday AI overview", url: "https://monday.com/w/ai" }]
    },
    {
      id: "jobs", category: "Change",
      keywords: ["replace", "jobs", "scared"],
      short: "It takes away the busywork, not the people.",
      worry: "AI will replace my people.",
      answer: "It takes the busywork, not the role. Teams spend the time they get back on clients and judgment calls.",
      keyPoints: [["busywork", "repetitive", "manual"], ["not replace", "not the role", "people", "team"]],
      next: "Ask which task their team would happily give away.",
      sources: [{ title: "Customer stories", url: "https://monday.com/customers" }]
    },
    {
      id: "roi", category: "Value",
      keywords: ["roi", "save you time", "in it for me", "upside", "time saved"],
      short: "Let's measure one workflow before and after, so you get real numbers in two weeks.",
      worry: "No proof it pays off.",
      answer: "Let's measure one workflow before and after. Hours saved times hourly cost gives you a real ROI in 2 weeks.",
      keyPoints: [["measure", "before and after", "baseline"], ["hours", "roi", "cost"]],
      next: "Agree on one workflow and its current time cost.",
      sources: [{ title: "ROI worksheet", url: "https://support.monday.com" }]
    },
    {
      id: "bandwidth", category: "Change",
      keywords: ["bandwidth", "initiatives", "retrain", "old workflow", "months", "small team", "migration", "a lot to take on", "where it actually fits", "nobody on my team asked", "pushed on us"],
      short: "Let's start with one workflow that already hurts. Setup takes under an hour.",
      worry: "No time for another change.",
      answer: "Start with one workflow that already hurts. We set it up together in under an hour, and nothing else changes.",
      keyPoints: [["one workflow", "one", "small"], ["together", "we set", "help"]],
      next: "Ask which weekly task wastes the most time.",
      sources: [{ title: "Quick-start workflows", url: "https://support.monday.com" }]
    },
    {
      id: "automations", category: "Value",
      keywords: ["automations", "already have", "built ourselves", "different from"],
      short: "Keep your automations. AI handles the messy work that rules can't.",
      worry: "Our own automations already do this.",
      answer: "Keep your automations. They follow fixed rules. AI handles the work rules can't, like reading requests, summarizing updates, and drafting replies, and it can trigger your automations too.",
      keyPoints: [["fixed rules", "rules"], ["keep", "together", "trigger"]],
      next: "Find one step in their automations that still needs a person.",
      sources: [{ title: "monday AI overview", url: "https://monday.com/w/ai" }]
    },
    {
      id: "hype", category: "Value",
      keywords: ["hype", "didn't deliver", "skeptical", "magic", "never even used", "like us", "industry", "guinea pig", "experimental", "reliable", "game-changing"],
      short: "Fair enough. Don't trust the pitch, let's test it on your own data.",
      worry: "We've been burned by hype before.",
      answer: "Fair. Don't trust the pitch, test it. One workflow, 2 weeks, and your own data decides.",
      keyPoints: [["test", "try", "pilot", "prove"], ["your data", "your own", "numbers"]],
      next: "Share one story from a customer in their industry.",
      sources: [{ title: "Customer stories", url: "https://monday.com/customers" }]
    }
  ],

  fallback: {
    id: "new", category: "New",
    short: "We don't have an approved answer yet, so start with a question.",
    worry: "Something new.",
    answer: "Ask what's behind it: “What would need to be true for this to work for you?”",
    keyPoints: [],
    next: "We logged it so the team can add an approved answer.",
    sources: []
  },

  user: { name: "Hen", role: "Enablement team", initials: "H" },

  // Practice: sample history and the team board (mock until scores are stored per person).
  practiceHistory: [
    { month: "May", avg: 5.1, count: 14 }, { month: "Jun", avg: 5.8, count: 19 },
    { month: "Jul", avg: 6.0, count: 22 }, { month: "Aug", avg: 6.6, count: 25 },
    { month: "Sep", avg: 7.1, count: 31 }
  ],
  leaderboard: [
    { name: "Noa Levi", initials: "NL", avg: 8.6, count: 42 },
    { name: "Daniel Cohen", initials: "DC", avg: 8.1, count: 37 },
    { name: "Maya Shapiro", initials: "MS", avg: 7.7, count: 29 },
    { name: "Omer Katz", initials: "OK", avg: 7.2, count: 33 },
    { name: "Yael Ben-David", initials: "YB", avg: 6.9, count: 18 }
  ],

  // The 50 objections from the assignment brief: the starting objection pool.
  // id = matching answer library entry, count = how often we've heard it (sample numbers).
  objections: [
    { n: 1, text: "How do I know our data isn't being used to train your models somewhere down the line?", id: "training", category: "Data", count: 51 },
    { n: 2, text: "Once we put our workflows into an AI feature, where does that information actually go?", id: "residency", category: "Data", count: 22 },
    { n: 3, text: "We have strict data residency requirements. Can you guarantee AI processing stays in our region?", id: "residency", category: "Data", count: 18 },
    { n: 4, text: "Legal is going to ask where this data physically lives before they'll sign off on anything.", id: "residency", category: "Data", count: 15 },
    { n: 5, text: "Which AI model are you even using under the hood? Has that vendor been vetted?", id: "vendor", category: "Trust", count: 12 },
    { n: 6, text: "I need a sub-processor list before I can take this to our security team.", id: "vendor", category: "Trust", count: 14 },
    { n: 7, text: "I'm worried we turn this on and get hit with a bill nobody budgeted for.", id: "bill", category: "Cost", count: 64 },
    { n: 8, text: "Credits feel like a black box. How do we actually know what's consuming them?", id: "credits", category: "Cost", count: 29 },
    { n: 9, text: "Before anyone touches this, I need to know who can turn it on, who can turn it off, and who's watching usage.", id: "control", category: "Control", count: 24 },
    { n: 10, text: "Can I lock this down so people can't just go enable things on their own?", id: "control", category: "Control", count: 19 },
    { n: 11, text: "If we roll this out, how do we even see where the usage is going after the fact?", id: "credits", category: "Cost", count: 17 },
    { n: 12, text: "Nobody can tell me how many credits we'll actually need before we commit to anything.", id: "credits", category: "Cost", count: 21 },
    { n: 13, text: "I can't take “it depends on complexity” back to my CFO as an answer.", id: "credits", category: "Cost", count: 11 },
    { n: 14, text: "What happens if the agent gets something wrong and it goes straight to a client? Who's accountable for that?", id: "review", category: "Trust", count: 26 },
    { n: 15, text: "I don't love the idea of something automated having write access to our boards without a human checking first.", id: "review", category: "Trust", count: 23 },
    { n: 16, text: "Can an agent see things it really shouldn't be able to see?", id: "audit", category: "Trust", count: 13 },
    { n: 17, text: "We're not rolling this out to the whole team on day one. I need something more controlled than that.", id: "pilot", category: "Control", count: 16 },
    { n: 18, text: "If compliance asks, I want the option to just shut the whole thing off.", id: "killswitch", category: "Control", count: 15 },
    { n: 19, text: "Last time an automation glitched mid-workflow, the easy fix was just turning the whole thing off.", id: "killswitch", category: "Control", count: 6 },
    { n: 20, text: "How is this actually different from what we already have with the automations we built ourselves?", id: "automations", category: "Value", count: 12 },
    { n: 21, text: "I don't want us to be the test case while you work out the kinks.", id: "hype", category: "Value", count: 9 },
    { n: 22, text: "Even if I trust the model, I don't trust that every person on my team will use it responsibly.", id: "control", category: "Control", count: 10 },
    { n: 23, text: "Show me exactly what happens to a prompt after we send it, step by step.", id: "audit", category: "Trust", count: 8 },
    { n: 24, text: "Our compliance team already flagged concerns about AI tools generally. This isn't going to be a quick yes.", id: "vendor", category: "Trust", count: 14 },
    { n: 25, text: "What's the actual limit before someone on my team accidentally blows through a month of credits in a day?", id: "bill", category: "Cost", count: 18 },
    { n: 26, text: "I need this to be predictable. Right now it feels like signing up for a variable cost with no ceiling.", id: "bill", category: "Cost", count: 20 },
    { n: 27, text: "If an agent takes an action on a client-facing board, I want a log of exactly what it did and why.", id: "audit", category: "Trust", count: 11 },
    { n: 28, text: "We'll pilot this with two people before anyone else touches it.", id: "pilot", category: "Control", count: 7 },
    { n: 29, text: "I've asked three times how billing actually works here and gotten three slightly different answers.", id: "credits", category: "Cost", count: 13 },
    { n: 30, text: "Turning this on for everyone at once feels reckless. I'd rather go slow.", id: "pilot", category: "Control", count: 12 },
    { n: 31, text: "We already pay for ChatGPT Enterprise. Why would we pay more for AI inside monday too?", id: "chatgpt", category: "Value", count: 32 },
    { n: 32, text: "Honestly, my team just got used to the old workflow. I don't want to retrain everyone again.", id: "bandwidth", category: "Change", count: 9 },
    { n: 33, text: "We tried an AI pilot last year with another vendor and it just didn't deliver. I'm skeptical this will be different.", id: "hype", category: "Value", count: 11 },
    { n: 34, text: "This feels like a lot to take on right now. We've got three other initiatives already in flight.", id: "bandwidth", category: "Change", count: 8 },
    { n: 35, text: "What's actually in it for me if my team adopts this? I don't see the personal upside.", id: "roi", category: "Value", count: 10 },
    { n: 36, text: "Everyone's talking about AI like it's magic. I've seen enough hype cycles to be careful.", id: "hype", category: "Value", count: 7 },
    { n: 37, text: "Is this going to replace people on my team? Because if so, I need to think about this very differently.", id: "jobs", category: "Change", count: 21 },
    { n: 38, text: "My manager hasn't greenlit any new tools this quarter. Budget's frozen.", id: "roi", category: "Value", count: 6 },
    { n: 39, text: "Some people on my team are genuinely scared this is here to replace their jobs. That's a hard conversation to have.", id: "jobs", category: "Change", count: 14 },
    { n: 40, text: "We're mid-migration on another system. Anything new right now is a no from me.", id: "bandwidth", category: "Change", count: 5 },
    { n: 41, text: "Nobody on my team asked for this. It feels like it's being pushed on us rather than something we need.", id: "bandwidth", category: "Change", count: 7 },
    { n: 42, text: "I need ROI numbers, not just “it'll save you time.” Time saved doing what, exactly?", id: "roi", category: "Value", count: 15 },
    { n: 43, text: "Every time we adopt something new, it takes months before it actually sticks. I don't have the appetite for another rollout.", id: "bandwidth", category: "Change", count: 6 },
    { n: 44, text: "We're a small team. I don't have a dedicated person to own rolling this out properly.", id: "bandwidth", category: "Change", count: 5 },
    { n: 45, text: "How much of this is actually reliable versus still experimental? I don't want to be a guinea pig.", id: "hype", category: "Value", count: 9 },
    { n: 46, text: "I don't know what “bring your own agent” even means for us practically. It sounds complicated.", id: null, category: "New", count: 4 },
    { n: 47, text: "I'm not against AI. I just don't have bandwidth to figure out where it actually fits in our process.", id: "bandwidth", category: "Change", count: 8 },
    { n: 48, text: "The last “game-changing” feature you shipped, half my team never even used. Why will this be different?", id: "hype", category: "Value", count: 6 },
    { n: 49, text: "Some of my most senior people are the most resistant. They don't trust it and they set the tone for the team.", id: "hype", category: "Value", count: 7 },
    { n: 50, text: "Show me one customer like us who's actually gotten value from this, not just a case study from a totally different industry.", id: "hype", category: "Value", count: 10 }
  ],

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
