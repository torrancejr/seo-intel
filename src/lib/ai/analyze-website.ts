import { generateContent, AI_MODEL, AI_MAX_TOKENS } from './client';

interface WebsiteAnalysis {
  businessType: string;
  industry: string;
  targetAudience: string;
  keyServices: string[];
  uniqueValueProps: string[];
  contentThemes: string[];
  toneAndVoice: string;
  competitiveAdvantages: string[];
}

export async function analyzeWebsite(websiteUrl: string): Promise<WebsiteAnalysis> {
  // In a production app, you'd scrape the website first
  // For now, we'll use a placeholder that asks the AI to analyze based on URL
  
  const prompt = `Analyze the business at ${websiteUrl} and extract key information for content generation.

Based on the website URL and your knowledge, provide a comprehensive business analysis in the following JSON format:

{
  "businessType": "Type of business (e.g., Law Firm, SaaS Company, Healthcare Provider)",
  "industry": "Primary industry (e.g., Legal Services, Technology, Healthcare)",
  "targetAudience": "Primary target audience description",
  "keyServices": ["Service 1", "Service 2", "Service 3"],
  "uniqueValueProps": ["Value prop 1", "Value prop 2"],
  "contentThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "toneAndVoice": "Recommended tone (e.g., Professional and authoritative, Friendly and approachable)",
  "competitiveAdvantages": ["Advantage 1", "Advantage 2"]
}

Return ONLY the JSON object, no other text.`;

  const response = await generateContent({
    model: AI_MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  const text = textBlock?.text || '';

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from AI response');
  }

  const analysis: WebsiteAnalysis = JSON.parse(jsonMatch[0]);
  return analysis;
}

export async function suggestTopics(businessContext: WebsiteAnalysis): Promise<string[]> {
  const prompt = `Based on this business profile, suggest 10-15 blog topic ideas that would be valuable for location-specific content:

Business Type: ${businessContext.businessType}
Industry: ${businessContext.industry}
Target Audience: ${businessContext.targetAudience}
Key Services: ${businessContext.keyServices.join(', ')}
Content Themes: ${businessContext.contentThemes.join(', ')}

Requirements:
- Topics should be relevant to the business and industry
- Topics should work well with city-specific variations (e.g., "Legal Tech Adoption in [City]")
- Topics should address pain points or interests of the target audience
- Mix of educational, thought leadership, and practical topics
- Each topic should be 3-8 words

Return ONLY a JSON array of topic strings:
["Topic 1", "Topic 2", "Topic 3", ...]`;

  const response = await generateContent({
    model: AI_MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  const text = textBlock?.text || '';

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON array from AI response');
  }

  const topics: string[] = JSON.parse(jsonMatch[0]);
  return topics;
}
