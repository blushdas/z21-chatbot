
// This is a mock API endpoint for development
// In production, this would be handled by your backend

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, mode, length } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Mock response generation
  const responses = {
    coach: `As a coach, I understand you're asking about "${message}". Let me share some insights on leadership and growth. The key is to approach this with intentionality and focus on developing others while staying true to your values.`,
    family: `From a family perspective regarding "${message}", I think about legacy and relationships. Family is the foundation of everything we do, and maintaining strong bonds while teaching important values is crucial.`,
    investor: `Looking at "${message}" from an investment standpoint, we need to consider both financial returns and mission alignment. Every decision should create sustainable value while staying true to our core principles.`,
    ambassador: `As an ambassador addressing "${message}", I focus on representing our mission with integrity. It's about being a bridge between different perspectives while maintaining authenticity.`,
    faith: `Considering "${message}" through a faith lens, I'm reminded that wisdom comes from above. Our decisions should be grounded in eternal principles and guided by prayer.`
  };

  let response = responses[mode] || responses.coach;

  // Adjust length
  if (length === 'short') {
    response = response.split('.').slice(0, 2).join('.') + '.';
  } else if (length === 'long') {
    response += ' This principle has guided me throughout my career, and I've seen it work in countless situations. The important thing is to remain consistent and authentic in your approach.';
  }

  // Mock citation
  const citation = {
    source: `Project SMART ${mode.charAt(0).toUpperCase() + mode.slice(1)} Guide`,
    title: `Leadership Insights: ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`
  };

  res.status(200).json({
    response,
    citation,
    intent: 'guidance'
  });
}
