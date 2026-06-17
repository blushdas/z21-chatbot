export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FAQCategory {
  id: string;
  label: string;
  icon: string;
}

export const faqData: FAQItem[] = [
  // Getting Started - Set #1: What It Is and Who It's For
  {
    id: 'what-is-daryle-ai',
    question: 'What is Daryle.AI in simple terms?',
    answer: "Daryle.AI is an interactive leadership and wisdom companion built from the life work of Daryle Doden. It allows you to ask questions - big or small - and receive guidance based on his decades of experience in business, leadership, faith, and people development. Think of it as having on-demand access to Daryle's perspective, anytime.",
    category: 'getting-started',
  },
  {
    id: 'different-from-chatgpt',
    question: 'How is Daryle.AI different from tools like ChatGPT or Google?',
    answer: "Unlike general-purpose AI tools that answer questions using the entire internet, Daryle.AI is built from one source: Daryle's own teachings, stories, lived experience, and worldview. It doesn't guess, browse the web, or pull from outside information. Instead, it delivers insight grounded in a consistent set of principles, values, and leadership practices shaped by Daryle's life and the culture he built at Ambassador Enterprises.",
    category: 'getting-started',
  },
  {
    id: 'who-is-daryle-doden',
    question: 'Who is Daryle Doden, and why build an AI around his wisdom?',
    answer: "Daryle Doden is a lifelong entrepreneur, founder of Ambassador Enterprises, and a leader known for his Christ-centered approach to business, stewardship, investing, and human flourishing. After decades of mentoring leaders, building teams, and helping organizations pursue \"the better way,\" his wisdom has shaped thousands of decisions and lives. Daryle.AI makes that wisdom more accessible - preserving his voice, principles, and insights so the next generation of leaders can learn from and build upon them.",
    category: 'getting-started',
  },
  {
    id: 'who-is-it-for',
    question: 'Who is Daryle.AI designed for?',
    answer: "Daryle.AI is built for: Ambassador Enterprises employees, leaders and managers across industries, portfolio companies and partners, emerging leaders, students, and interns, business owners and founders, and anyone seeking values-driven guidance rooted in biblical principles and real-world experience. If you want practical advice framed through a Christ-centered worldview, Daryle.AI is for you.",
    category: 'getting-started',
  },
  {
    id: 'day-to-day-use',
    question: 'How can I use Daryle.AI in my day-to-day work or leadership?',
    answer: "You can use Daryle.AI to: clarify decisions, prepare for meetings or conversations, work through leadership or team challenges, strengthen your own habits, character, and mindset, reflect on culture, strategy, and vision, and gain perspective on conflict, accountability, and growth. It's available whenever you need perspective - no scheduling, no waiting.",
    category: 'getting-started',
  },
  {
    id: 'what-questions',
    question: 'What kinds of questions can I ask Daryle.AI?',
    answer: "You can ask about leadership, people, conflict, culture, stewardship, investing, purpose, family business dynamics, organizational health, and faith in the workplace. Examples include: \"How would you approach a difficult team member?\", \"What should I consider before making a major decision?\", \"How do I build trust on a struggling team?\", \"What does biblical stewardship look like in business?\" If Daryle has taught it, lived it, or written about it, the AI can speak to it.",
    category: 'getting-started',
  },
  {
    id: 'problem-examples',
    question: 'What are some examples of problems Daryle.AI can help me solve?',
    answer: "Daryle.AI can help you: navigate leadership or personnel issues, strengthen culture and trust within a team, think through investment or stewardship decisions, resolve tension or misalignment, evaluate opportunities through values and wisdom, prepare for hard conversations, and build clarity around purpose, priorities, and next steps. It won't make decisions for you, but it will help you think more clearly about them.",
    category: 'getting-started',
  },
  {
    id: 'replace-mentors',
    question: 'Does Daryle.AI replace mentors, coaches, or advisors?',
    answer: "No. Daryle.AI isn't meant to replace human guidance - it's designed to augment it. It gives you immediate access to grounded wisdom and principled thinking, but real mentorship still depends on relationships, accountability, and lived experience. Most users find that Daryle.AI actually enhances their mentoring relationships by helping them prepare better, think deeper, and ask more meaningful questions.",
    category: 'getting-started',
  },
  
  // How It Works - Set #2
  {
    id: 'how-it-works-behind-scenes',
    question: 'How does Daryle.AI actually work behind the scenes?',
    answer: "Daryle.AI works by combining two things: a curated library of Daryle Doden's teachings, and advanced AI models that help interpret and communicate those insights. When you ask a question, the system searches Daryle's source materials, finds the most relevant pieces, and then uses a modern AI model to form a clear, conversational answer based on those materials. It's not guessing or pulling from the internet - it's grounding every response in real content tied to Daryle's life, experience, and worldview.",
    category: 'how-it-works',
  },
  {
    id: 'what-is-rag',
    question: 'What does "retrieval-augmented generation (RAG)" mean in plain language?',
    answer: "RAG means the AI doesn't respond from memory alone. It first retrieves relevant information from Daryle's archive, and then generates an answer based on that information. A simple way to think about it: 1) Search - The system looks through Daryle's writings, talks, and lessons. 2) Understand - It selects the most relevant insights. 3) Respond - It forms a clear, conversational answer rooted in those insights. This keeps answers accurate, trustworthy, and aligned with Daryle's actual voice.",
    category: 'how-it-works',
  },
  {
    id: 'what-ai-models',
    question: 'What AI models does Daryle.AI use?',
    answer: "Daryle.AI uses multiple leading AI models, including: OpenAI GPT-5.0, Claude Opus, and Claude Sonnet. These models are known for strong reasoning, clarity, safety, and long-context understanding. Using more than one model allows the system to produce well-rounded, consistent, and high-fidelity answers.",
    category: 'how-it-works',
  },
  {
    id: 'why-multiple-models',
    question: 'Why does Daryle.AI use multiple large language models?',
    answer: "Each model has its strengths - some are more analytical, some are more narrative, and some are particularly strong at safety and accuracy. By blending multiple models, Daryle.AI: cross-checks information, reduces errors, preserves nuance and tone, and produces more reliable, thoughtful answers. It's similar to having multiple experts review the same question before responding.",
    category: 'how-it-works',
  },
  {
    id: 'model-selection',
    question: 'How do you decide which model to use for a given question?',
    answer: "The system automatically chooses the best model (or combination of models) based on the type of question. For example: reflective or values-based questions may use models optimized for tone and depth, strategy or leadership questions may use models that excel at reasoning, and long, context-heavy questions may use models with large context windows. This selection happens behind the scenes so every answer is strong, stable, and aligned with Daryle's principles.",
    category: 'how-it-works',
  },
  {
    id: 'internet-vs-curated',
    question: 'Is Daryle.AI trained on the open internet, or just on Ambassador / Daryle content?',
    answer: "Daryle.AI is not trained on the open internet. It is built entirely from: Daryle's personal writings, talks, interviews, and transcripts, internal memos and leadership lessons, and Ambassador-approved content. The AI models themselves have general language skills, but the knowledge Daryle.AI uses to answer your questions comes only from curated, first-party materials.",
    category: 'how-it-works',
  },
  {
    id: 'content-sources',
    question: 'What sources of content does Daryle.AI draw from when answering questions?',
    answer: "Every answer is grounded in structured and vetted materials, such as: decades of Daryle's leadership teaching, AE culture documents and principles, interviews, talks, and recorded sessions, and writings and reflections from Daryle's life and work. These materials form the \"knowledge library\" the system searches before crafting an answer.",
    category: 'how-it-works',
  },
  {
    id: 'voice-preservation',
    question: "How is Daryle's unique voice, values, and perspective preserved in the AI?",
    answer: "Because all answers are rooted in Daryle's actual words and teachings, the system naturally reflects his tone, conviction, and worldview. The AI doesn't imitate Daryle - it is shaped by the content he has created. This means: insights come from real stories and principles he taught, the Christ-centered worldview he lives out remains intact, and the tone stays consistent: practical, humble, relational, and direct.",
    category: 'how-it-works',
  },
  {
    id: 'making-things-up',
    question: 'Does Daryle.AI ever "make things up" or go beyond what Daryle has said?',
    answer: "The system is designed to minimize speculation by grounding answers in verified source materials. If the archive contains relevant insights, the AI will use them. If not, it will answer based on Daryle's principles and patterns of thinking - or acknowledge when the information isn't available. It will not speak as if Daryle said something he did not. Its purpose is to reflect his wisdom responsibly, not manufacture new doctrine or personal opinions.",
    category: 'how-it-works',
  },
  
  // Content, Sourcing, and Accuracy - Set #3
  {
    id: 'content-inputs',
    question: 'What kinds of inputs were used to build Daryle.AI?',
    answer: "Daryle.AI is built entirely from authenticated, first‑party content that reflects Daryle Doden's real voice, worldview, and leadership history. No outside internet material is used. The goal is to ensure every answer flows from what Daryle has actually taught or lived.\n\n**Primary Sources include:**\n\n* Recorded talks and keynote messages\n* Long‑form video and audio interviews\n* Internal memos, leadership letters, and written reflections\n* Articles, book excerpts, and authored materials\n* Teachings on Scripture, stewardship, character, and faith\n\n**Secondary Sources include:**\n\n* Leadership summaries and meeting notes created by AE leaders\n* Historical AE culture and values documents\n* Recorded conversations (when permission is granted)\n\nAll materials are reviewed, verified, categorized, and tagged before being added to the knowledge system.",
    category: 'content-accuracy',
  },
  {
    id: 'content-updates',
    question: 'How do you keep the content current as Daryle continues to teach, write, and lead?',
    answer: "Daryle.AI functions as a living, continually updated knowledge base. As Daryle creates new content—through teaching, speaking, writing, or mentoring—these materials are added through a structured process.\n\n**Updates include:**\n\n* Transcripts of new talks and leadership sessions\n* New letters, reflections, or essays\n* Summaries from retreats, interviews, or Q&A sessions\n* Updates to AE frameworks and terminology\n\n**Each new item undergoes:**\n\n1. Verification for authenticity\n2. Curation and organization by topic\n3. Tagging for principles, themes, and stories\n4. Integration into the retrieval system\n\nThis ensures the AI reflects both Daryle's long‑standing principles *and* his ongoing growth.",
    category: 'content-accuracy',
  },
  {
    id: 'source-attribution',
    question: 'Will Daryle.AI tell me where its answers are coming from?',
    answer: "Yes. While answers remain conversational, the system can point to the underlying themes or content categories used to form a response.\n\n**Source indicators may reflect:**\n\n* Leadership principles Daryle taught repeatedly\n* AE cultural values\n* A specific story or experience\n* Segments from a talk, memo, or recorded session\n\nThe goal is transparency without overwhelming users with academic-style citations.",
    category: 'content-accuracy',
  },
  {
    id: 'request-sources',
    question: 'Can I see or request the original source behind an answer?',
    answer: "In most cases, yes. When you want to dig deeper, you can request supporting information.\n\n**What you can request:**\n\n* A summary of the referenced source\n* A direct excerpt (where permissions allow)\n* Identification of the talk, event, or document it relates to\n\nSome materials are proprietary or sensitive, so the system may paraphrase, but all content is traceable and auditable.",
    category: 'content-accuracy',
  },
  {
    id: 'no-direct-quote',
    question: 'How do you handle topics where there is no direct quote or story from Daryle?',
    answer: "If no exact source exists, Daryle.AI draws from Daryle's documented principles and patterns of thinking. It never fabricates new beliefs or claims.\n\n**Principle-based reasoning draws from:**\n\n* Christ-centered leadership\n* Stewardship and accountability\n* Long-term thinking and legacy\n* People-first decision making\n* Culture-building and trust stewardship\n\n**When no direct material exists, the AI:**\n\n1. Identifies relevant principles\n2. Applies known decision-making patterns\n3. Responds in Daryle's tone and values\n4. Acknowledges limits when appropriate",
    category: 'content-accuracy',
  },
  {
    id: 'inaccurate-answers',
    question: "What happens if Daryle.AI gives an answer that doesn't sound like Daryle or doesn't feel accurate?",
    answer: "If something feels \"off,\" users are encouraged to flag it. Misalignment is rare but valuable—it helps improve clarity and accuracy.\n\n**Flagged responses trigger:**\n\n* A review of the source pathway\n* Evaluation for incomplete or missing content\n* Checks for tagging or categorization errors\n* Model behavior review and guardrail updates\n\nOften, issues indicate an area where more source material should be added.",
    category: 'content-accuracy',
  },
  {
    id: 'feedback-improvements',
    question: 'How is feedback on answers used to improve the system over time?',
    answer: "Feedback is essential to refining the accuracy, tone, and consistency of Daryle.AI.\n\n**When feedback is submitted:**\n\n1. The exchange is reviewed in context\n2. Source references are re-evaluated\n3. Missing or unclear content is added\n4. System instructions or routing rules are improved\n5. A record is kept to prevent repeat issues\n\n**Feedback leads to:**\n\n* More grounded and specific answers\n* Stronger worldview alignment\n* Improved handling of complex scenarios\n* Greater consistency with Daryle's authentic voice\n\nOver time, this continuous loop makes the system wiser, clearer, and more aligned with Daryle's heart, intent, and leadership legacy.",
    category: 'content-accuracy',
  },
  
  // Asking Questions and Getting the Best Answers - Set #4
  {
    id: 'how-to-ask',
    question: 'How should I ask questions to get the most helpful response from Daryle.AI?',
    answer: "Ask questions the same way you would speak to a trusted mentor - clear, honest, and with a bit of context. The more background you provide, the more specific and practical the response will be. You don't need to write paragraphs; a sentence or two about your situation is enough for the system to give meaningful guidance.",
    category: 'using-daryle-ai',
  },
  {
    id: 'follow-up-questions',
    question: 'Can I ask follow-up questions and have a real "conversation" with Daryle.AI?',
    answer: "Yes. Daryle.AI is designed for back-and-forth dialogue. It remembers the flow of your conversation and can go deeper, clarify, or reframe based on your follow-up questions. You can treat the interaction like a real mentoring conversation.",
    category: 'using-daryle-ai',
  },
  {
    id: 'great-prompts',
    question: 'What are some examples of great prompts to use?',
    answer: 'Here are effective ways to prompt Daryle.AI: "How would you approach a conflict between two team members?", "I\'m facing a tough decision about a partnership - what factors should I weigh?", "What does strong stewardship look like in this situation?", "How do I rebuild trust after a leadership mistake?", "What questions should I ask myself before hiring someone?", "I\'m preparing for a difficult conversation - how should I think about it?" Great prompts are clear, specific, and share the context of your challenge.',
    category: 'using-daryle-ai',
  },
  {
    id: 'personal-questions',
    question: 'Can I ask personal or situation-specific questions about my team, company, or investment?',
    answer: "Yes. Daryle.AI can help you think through real scenarios, decisions, and challenges. While it cannot access your private files or real-time data, it can help you consider principles, frameworks, and perspectives that apply to your situation. Treat it as a sounding board for wisdom - not as a source of confidential operational detail.",
    category: 'using-daryle-ai',
  },
  {
    id: 'what-to-avoid',
    question: 'What should I avoid asking Daryle.AI?',
    answer: "Daryle.AI isn't designed for: legal, medical, or financial advice, sensitive personal data or private confidential details, harmful, unethical, or manipulative requests, or information about individuals that isn't already part of Daryle's content. If the question falls outside Daryle's voice, values, or expertise, the system will redirect or decline.",
    category: 'using-daryle-ai',
  },
  {
    id: 'disagreements-tension',
    question: 'How does Daryle.AI handle disagreements, tension, or controversial topics?',
    answer: "Daryle.AI responds with humility, clarity, and principle. When dealing with disagreement or tension: it focuses on reconciliation, understanding, and stewardship, it avoids taking sides and instead emphasizes biblical wisdom, relational clarity, and long-term thinking, and it never escalates conflict or encourages divisive behavior. When a topic is controversial, the AI reflects Daryle's tone: calm, grounded, and centered on values rather than debate.",
    category: 'using-daryle-ai',
  },
  
  // Privacy, Security, and Data Governance - Set #5
  {
    id: 'data-safety',
    question: 'Is my data safe when I use Daryle.AI?',
    answer: "Protecting your information is a top priority. Daryle.AI is designed with strict privacy and security standards so every interaction remains confidential and secure. The platform uses encrypted communication, secure storage, and restricted internal access to ensure your data never leaves trusted systems. Nothing you share is sold, used for marketing, or exposed to outside parties.\n\n**Key protections include:**\n\n* End-to-end encrypted communication\n* Secure storage within controlled infrastructure\n* No external sharing of personal or organizational data\n* No use of conversations for advertising or profiling\n* Strictly limited internal access for system maintenance only\n\nYour data is treated with the same seriousness and care as any high-trust leadership or organizational tool.",
    category: 'privacy-security',
  },
  {
    id: 'conversation-privacy',
    question: 'Who can see the questions I ask and the conversations I have with Daryle.AI?',
    answer: "Your conversations are private and not visible to other users, leaders, or external systems. The platform is intentionally designed so that what you ask stays between you and the AI.\n\n**The only individuals who may see anonymized snippets are:**\n\n* A very small internal team focused on platform safety and system reliability\n* Engineers reviewing flagged errors or performance issues\n\nThese reviews are extremely limited and exist solely to maintain quality—not to monitor users.",
    category: 'privacy-security',
  },
  {
    id: 'training-data',
    question: 'Are my questions used to train the AI models?',
    answer: "No. Your questions are never used to train OpenAI, Anthropic, or any third-party models. They also do not become part of public datasets or external training material.\n\n**This means:**\n\n* Your data does not improve or influence external AI systems\n* Your prompts are not stored by model providers\n* No part of your content becomes publicly accessible or used elsewhere\n\nYour conversations stay within the secure Daryle.AI environment at all times.",
    category: 'privacy-security',
  },
  {
    id: 'company-information',
    question: 'Will my company- or project-specific information be shared with outside parties or platforms?',
    answer: "No. Any scenario-based or organizational examples you share remain fully confidential. They are processed only within the Daryle.AI environment and are never shared with outside vendors, platforms, or partners.\n\n**The platform does NOT:**\n\n* Distribute sensitive or strategic information\n* Share prompts with third-party services\n* Export scenario-based conversations for external analysis\n\nEverything you share stays fully contained and protected.",
    category: 'privacy-security',
  },
  {
    id: 'sensitive-info-protection',
    question: 'How does Daryle.AI protect sensitive or confidential information?',
    answer: "Daryle.AI uses both technical and operational safeguards to ensure sensitive information remains secure. The system is built on modern cloud infrastructure with multiple layers of protection. In addition, internal policies ensure that only essential personnel have access to limited, anonymized data when necessary.\n\n**Technical safeguards include:**\n\n* Strong encryption for data in transit and at rest\n* Hardened cloud environments with network isolation\n* Role-based access controls\n* Continuous monitoring and automated security alerts\n* API-level isolation and restricted access pathways\n\n**Operational safeguards include:**\n\n* Strict internal access permissions\n* Minimal data retention practices\n* Guardrails preventing exposure of confidential details\n* Ethical policies aligned with AE's values and culture\n\nIf you enter highly sensitive information, the AI encourages safer communication to avoid unnecessary risk.",
    category: 'privacy-security',
  },
  {
    id: 'data-deletion',
    question: 'Can I request that my data or conversations be deleted?',
    answer: "Yes. You can request deletion of your history at any time if you prefer not to keep a record of past conversations. Deletion ensures your interactions are removed from logs and internal systems.\n\n**The process includes:**\n\n* Submitting a deletion request to the support team\n* Secure removal of conversation data\n* Confirmation once the process is complete\n\nYou remain fully in control of your information.",
    category: 'privacy-security',
  },
  {
    id: 'hosting-security',
    question: 'Where is Daryle.AI hosted and how is it secured?',
    answer: "Daryle.AI is hosted on secure, industry-leading cloud infrastructure with modern safeguards. Every layer—from data transmission to storage to internal access—is governed by best practices.\n\n**Security measures include:**\n\n* Encrypted traffic end-to-end\n* Regular vulnerability scanning and monitoring\n* Isolated production environments\n* Strict access-control policies for administrators\n* Compliance with modern cloud security and encryption standards\n\nThese protections ensure your use of the platform remains private, safe, and trustworthy.",
    category: 'privacy-security',
  },
  
  // Relationship to Ambassador Enterprises and Partners - Set #6
  {
    id: 'ae-mission-fit',
    question: "How does Daryle.AI fit into Ambassador Enterprises' mission and Three Returns philosophy?",
    answer: "Daryle.AI was created to extend and scale the leadership principles that have shaped Ambassador Enterprises for decades. It reflects AE's commitment to People, Performance, and Purpose - the Three Returns - by making Daryle's wisdom accessible to more leaders, teams, and partners. People: It equips individuals with mentorship, guidance, and character-shaping perspective. Performance: It helps leaders make clearer, wiser decisions. Purpose: It reinforces a Christ-centered view of business, stewardship, and human flourishing. Daryle.AI is a tool designed to strengthen AE's culture and carry its founding principles into the future.",
    category: 'ae-partners',
  },
  {
    id: 'ae-only-or-broader',
    question: 'Is Daryle.AI only for Ambassador Enterprises, or can outside partners and organizations use it?',
    answer: "While the initial beta is focused on Ambassador Enterprises employees and select partners, Daryle.AI is intentionally being built for broader use. Values-aligned organizations, portfolio companies, co-ventures, educators, and external leaders will have access as the platform expands. The long-term vision is to make Daryle's wisdom available well beyond AE.",
    category: 'ae-partners',
  },
  {
    id: 'portfolio-support',
    question: 'How will Daryle.AI support portfolio companies, co-ventures, and community partners?',
    answer: "Daryle.AI helps these groups by: providing leadership support and decision-making frameworks, reinforcing shared principles and cultural alignment, offering guidance on stewardship, strategy, culture, and investing, and helping founders, executives, and frontline leaders think more clearly about challenges. Whether a partner is facing growth issues, people challenges, or mission questions, Daryle.AI provides principled, steady perspective.",
    category: 'ae-partners',
  },
  {
    id: 'different-modes',
    question: 'Will there be different modes or experiences (e.g., coaching, investing, legacy, family)?',
    answer: "Yes. Daryle.AI is being developed with multiple modes that reflect Daryle's most influential domains: Coaching Mode - leadership, culture, character, personal growth; Investor Mode - stewardship, decision frameworks, due diligence thinking; Ambassador/AE Mode - organizational culture, Three Returns, partnering well; Faith & Formation Mode - spiritual growth, purpose, worldview; and Legacy & Family Mode - family, generational leadership, relationships. These modes allow users to explore Daryle's wisdom through different lenses.",
    category: 'ae-partners',
  },
  {
    id: 'specific-organizations',
    question: 'How does Daryle.AI handle questions about specific organizations or investments?',
    answer: "Daryle.AI does not access confidential business data or private investment information. Instead, it responds with principles, not specifics - drawing from Daryle's known approach to stewardship, risk, relationships, culture, accountability, and long-term thinking. If a question requires details the system does not have, it will: speak to the principles that apply, avoid naming or speculating about real organizations, and encourage thoughtful, values-based decision-making. Its goal is to guide - not to disclose sensitive information or speak beyond its proper scope.",
    category: 'ae-partners',
  },
  
  // Theology, Worldview, and Values Alignment - Set #7
  {
    id: 'christ-centered-worldview',
    question: 'How does Daryle.AI reflect a Christ-centered worldview?',
    answer: "Daryle.AI is grounded in the same biblical principles that have guided Daryle Doden's life and leadership. Because the system is built entirely from Daryle's own teachings, writings, and lived experience, its responses naturally reflect his Christ-centered view of work, relationships, stewardship, and purpose. It emphasizes humility, integrity, forgiveness, accountability, and the pursuit of human flourishing - core themes that shape how Daryle leads and mentors. Daryle.AI doesn't preach; it simply answers from the worldview Daryle has consistently lived out.",
    category: 'theology-values',
  },
  {
    id: 'faith-scripture',
    question: 'Will Daryle.AI answer questions about faith, Scripture, and spiritual formation?',
    answer: "Yes. Daryle has spent decades integrating faith and work, and his content includes teachings on spiritual formation, calling, Scripture, and Christian leadership. Daryle.AI can offer biblical perspective, principles, and reflections aligned with Daryle's own approach. It will not attempt to create new doctrine or speak outside the scope of Daryle's recorded beliefs - it stays rooted in what he has actually taught.",
    category: 'theology-values',
  },
  {
    id: 'values-alignment',
    question: "How do you ensure that answers stay aligned with Daryle's convictions and Ambassador's values?",
    answer: "Every response is grounded in curated, first-party content created or approved by Daryle. The system is not influenced by outside data or internet sources. In addition: all source materials reflect Daryle's convictions and AE's values, guardrails ensure answers remain consistent with biblical principles and AE's Three Returns framework, and feedback loops allow the team to refine responses that need clarity or better alignment. The AI cannot adopt a worldview other than the one it was built on.",
    category: 'theology-values',
  },
  {
    id: 'differing-perspectives',
    question: "What happens when a user's perspective or values differ from Daryle's?",
    answer: "Daryle.AI responds with respect, humility, and clarity. It does not argue or dismiss. Instead, it: explains Daryle's principles with gentleness and conviction, focuses on shared values like wisdom, stewardship, and human flourishing, and avoids debate and prioritizes understanding. If a user approaches a topic from a different worldview, Daryle.AI offers Daryle's perspective without pressure - inviting reflection, not confrontation.",
    category: 'theology-values',
  },
  
  // Access, Accounts, and Roadmap - Set #8
  {
    id: 'beta-access-eligibility',
    question: 'Who can sign up for early/beta access to Daryle.AI?',
    answer: "Beta access is currently available to Ambassador Enterprises employees, portfolio companies, co-venture partners, and a small group of trusted external leaders. This allows the team to refine the experience with focused feedback before a broader release.",
    category: 'access-roadmap',
  },
  {
    id: 'external-access-request',
    question: "How do I request access if I'm outside Ambassador Enterprises?",
    answer: "If you're not part of Ambassador Enterprises but would like to participate, you can request access through the beta sign-up form. External requests are reviewed individually, with priority given to values-aligned organizations, leadership teams, and community partners.",
    category: 'access-roadmap',
  },
  {
    id: 'beta-features',
    question: 'What does the beta include, and what will change over time?',
    answer: "The beta includes: full access to Daryle.AI's conversational experience, core leadership, culture, stewardship, and worldview content, early versions of emerging modes (e.g., Coaching, Ambassador/AE), and ability to submit feedback and feature requests. Over time, the beta will expand with: additional content libraries, more refined modes, improved accuracy and personalization, and enhanced organizational tools.",
    category: 'access-roadmap',
  },
  {
    id: 'tiers-offerings',
    question: 'Will there be different tiers or offerings (e.g., personal coaching, team licenses, enterprise integrations)?',
    answer: "Yes. The long-term vision includes multiple tiers such as: Individual access for personal leadership development, Team licenses for departments, boards, or staff groups, Organizational plans for portfolio companies or partners, and Enterprise integrations with tools like email, project management, and HR systems. These tiers will roll out after the beta as the platform matures.",
    category: 'access-roadmap',
  },
  {
    id: 'roadmap-2026',
    question: "What's on the roadmap for Daryle.AI in 2026 and beyond?",
    answer: "Planned future developments include: expanded interaction modes (Coaching, Investor, Family, Faith & Formation, Legacy), customizable organizational experiences, deeper integrations with leadership development programs, team dashboards and shared learning tools, mobile and desktop apps, voice input and audio-based experiences, and additional content from future Daryle teachings. The roadmap prioritizes accuracy, alignment with Daryle's voice, and real-world usefulness.",
    category: 'access-roadmap',
  },
  {
    id: 'updates-communication',
    question: 'How will you communicate updates and new features to users?',
    answer: "Users will receive updates through: in-platform notifications, email announcements, release notes on the Daryle.AI site, and occasional video updates or walkthroughs. Beta users will also have opportunities to preview upcoming features and shape the direction of the platform through feedback.",
    category: 'access-roadmap',
  },
  
  // Using Daryle.AI in Organizations and Teams - Set #9
  {
    id: 'leadership-team-usage',
    question: 'How can our leadership team use Daryle.AI together?',
    answer: "Leadership teams can use Daryle.AI as a shared wisdom companion—helping clarify decisions, align around values, and strengthen conversations. Teams often use it to: prepare for leadership meetings, reflect on challenges from multiple angles, explore principles that shape culture, and facilitate discussion using a common framework. Rather than replacing dialogue, Daryle.AI enhances it by giving teams a shared starting point rooted in Daryle's principles.",
    category: 'org-teams',
  },
  {
    id: 'board-meetings-prep',
    question: 'Can Daryle.AI help us prepare for board meetings, strategy sessions, or investments?',
    answer: "Yes. Daryle.AI can help leaders: frame the right questions before big decisions, clarify stewardship principles, think through long-term consequences, and prepare talking points or reflection prompts. It won't provide confidential data or make decisions for you, but it will help you approach major conversations with wisdom, clarity, and conviction.",
    category: 'org-teams',
  },
  {
    id: 'tool-integrations',
    question: 'Can we integrate Daryle.AI with our existing tools (email, documents, project management, etc.)?',
    answer: "Full integrations will be available in future phases. The long-term roadmap includes: email and document extensions, workflow support inside project management tools, and leadership development integrations for teams. During the beta, Daryle.AI is a standalone experience focused on accuracy, stability, and reliability.",
    category: 'org-teams',
  },
  {
    id: 'training-onboarding',
    question: 'Will there be training or onboarding resources to help our team use Daryle.AI well?',
    answer: "Yes. Guided onboarding, example prompts, team trainings, and best-practice resources are being developed to help leaders and teams get the most from the platform. Workshops and internal demos are also available for partners and portfolio organizations.",
    category: 'org-teams',
  },
  {
    id: 'org-customization',
    question: 'Can Daryle.AI be customized for our organization, portfolio, or context?',
    answer: "Customization options will expand over time. The vision includes: organization-specific modes, custom content libraries, tailored prompts and workflows, and dedicated experiences for portfolio companies and co-ventures. In the beta phase, Daryle.AI focuses on delivering Daryle's wisdom consistently. Future versions will allow deeper integration with a team's unique context and needs.",
    category: 'org-teams',
  },
  
  // Ethics, Limitations, and Boundaries - Set #10
  {
    id: 'platform-limits',
    question: 'What are the limits of what Daryle.AI can and should do?',
    answer: "Daryle.AI is a wisdom and leadership companion—not an all-knowing expert or a replacement for human judgment. It cannot: make decisions for you, provide confidential or insider information, access your internal systems, emails, or documents, replace pastors, mentors, attorneys, or medical professionals, or predict the future or give real-time data. Its purpose is to offer clarity, principles, and perspective—not to remove the need for thoughtful, responsible leadership.",
    category: 'ethics-limitations',
  },
  {
    id: 'responsible-use',
    question: 'How do you ensure Daryle.AI is used responsibly and not as a shortcut for hard decisions?',
    answer: "The system is intentionally designed to emphasize principles over prescriptions. Rather than telling you exactly what to do, Daryle.AI helps you: ask better questions, reflect on priorities and stewardship, consider long-term consequences, and think biblically and wisely. It always points users back to personal responsibility, community, and accountability.",
    category: 'ethics-limitations',
  },
  {
    id: 'professional-advice',
    question: 'Will Daryle.AI give legal, financial, or medical advice?',
    answer: "No. Daryle.AI will not provide: legal rulings or contract guidance, financial planning or investment instructions, or medical diagnoses or treatment recommendations. It will offer general principles about stewardship, diligence, or seeking wise counsel—but it will always direct you to qualified professionals for specialized advice.",
    category: 'ethics-limitations',
  },
  {
    id: 'ai-human-responsibility',
    question: 'How do you think about AI, human responsibility, and wisdom working together?',
    answer: "Daryle.AI is a tool—not a decision-maker. It provides perspective shaped by Daryle's life and convictions, but you remain responsible for any action you take. The healthiest approach is: use the AI to clarify your thinking, seek counsel from mentors and teammates, pray, reflect, and evaluate carefully, and make decisions grounded in wisdom and accountability. Daryle.AI is most powerful when paired with thoughtful leadership, not used in place of it.",
    category: 'ethics-limitations',
  },
  {
    id: 'uncertain-advice',
    question: "What should I do if I'm unsure about acting on advice from Daryle.AI?",
    answer: "If you feel uncertain, treat the AI's response as a starting point—not the final answer. You can: ask follow-up questions, discuss the situation with a leader, mentor, or advisor, compare the guidance with Scripture and AE's values, and seek additional input from trusted experts. The goal is to help you think more clearly, not pressure you into a direction.",
    category: 'ethics-limitations',
  },
  
  // Feedback and Support - Set #11
  {
    id: 'share-feedback',
    question: 'How can I share feedback on my experience with Daryle.AI?',
    answer: "You can share feedback directly through the in-platform feedback option or by emailing the support team. We welcome suggestions, corrections, and ideas—your input helps refine the system and strengthen future versions.",
    category: 'feedback-support',
  },
  {
    id: 'report-bug',
    question: 'What should I do if I encounter a problem or bug?',
    answer: "If something isn't working correctly, you can: report the issue through the in-app feedback tool, or email our support team with a brief description of the problem. Providing screenshots or specific details helps us resolve issues quickly.",
    category: 'feedback-support',
  },
  {
    id: 'suggest-features',
    question: 'How can I suggest new features, topics, or content for Daryle.AI?',
    answer: "We actively collect feature requests and content suggestions. You can submit ideas through the feedback form or by contacting support. Whether it's a new domain, a type of scenario, or an organizational context you'd like Daryle.AI to address, we want to hear from you.",
    category: 'feedback-support',
  },
  {
    id: 'partnerships',
    question: "Who do I contact if I'm interested in partnering around Daryle.AI or bringing it to my organization?",
    answer: "For partnerships, enterprise access, or organizational rollout, please reach out to the Daryle.AI team directly. We can discuss: custom onboarding, expanded access for teams or partners, integration into leadership development programs, and specialized use cases or co-venture opportunities. We're excited to explore values-aligned partnerships that extend the impact of Daryle's wisdom.",
    category: 'feedback-support',
  },
];

export const faqCategories: FAQCategory[] = [
  { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
  { id: 'how-it-works', label: 'How It Works', icon: '⚙️' },
  { id: 'content-accuracy', label: 'Content & Accuracy', icon: '✓' },
  { id: 'using-daryle-ai', label: 'Using Daryle.AI', icon: '💬' },
  { id: 'privacy-security', label: 'Privacy & Security', icon: '🔒' },
  { id: 'ae-partners', label: 'AE & Partners', icon: '🤝' },
  { id: 'theology-values', label: 'Theology & Values', icon: '✝️' },
  { id: 'access-roadmap', label: 'Access & Roadmap', icon: '🗓️' },
  { id: 'org-teams', label: 'Organizations & Teams', icon: '👥' },
  { id: 'ethics-limitations', label: 'Ethics & Limitations', icon: '⚖️' },
  { id: 'feedback-support', label: 'Feedback & Support', icon: '💬' },
];
