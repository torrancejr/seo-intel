import { generateContent, AI_MODEL, AI_MAX_TOKENS } from './client';
import { db } from '../db';

interface GenerateIdeasInput {
  tenantId: string;
  topicId: string;
  cityIds: string[];
  count?: number;
}

interface ArticleIdea {
  suggestedTitle: string;
  suggestedOutline: {
    sections: string[];
    keyPoints: string[];
  };
  seoKeywords: string[];
  estimatedVolume: number;
}

export async function generateArticleIdeas({
  tenantId,
  topicId,
  cityIds,
  count = 3,
}: GenerateIdeasInput): Promise<ArticleIdea[]> {
  // Fetch tenant, topic, and cities
  const [tenant, topic, cities] = await Promise.all([
    db.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    db.topic.findUniqueOrThrow({ where: { id: topicId } }),
    db.city.findMany({ where: { id: { in: cityIds } } }),
  ]);

  const cityNames = cities.map(c => `${c.name}, ${c.stateCode}`).join(', ');

  const prompt = `You are a content strategist helping generate article ideas for a business.

Business: ${tenant.name}
${tenant.businessDescription ? `Description: ${tenant.businessDescription}` : ''}
Topic: ${topic.name}
${topic.description ? `Topic Description: ${topic.description}` : ''}
Target Cities: ${cityNames}

Generate ${count} unique article ideas for this topic that would work well across these cities. Each idea should:
1. Be specific and actionable
2. Include SEO-friendly title suggestions
3. Have a clear outline with 4-6 main sections
4. Include relevant SEO keywords
5. Estimate monthly search volume (rough estimate)

Return ONLY a JSON array with this structure:
[
  {
    "suggestedTitle": "Article title here",
    "suggestedOutline": {
      "sections": ["Section 1", "Section 2", "Section 3", "Section 4"],
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
    },
    "seoKeywords": ["keyword1", "keyword2", "keyword3"],
    "estimatedVolume": 1200
  }
]

Generate ${count} diverse ideas that would appeal to people searching for ${topic.name} information in these cities.`;

  const response = await generateContent({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  const text = textBlock?.text || '';

  try {
    const jsonStr = extractJSON(text);
    const ideas = JSON.parse(jsonStr);
    return ideas;
  } catch (error: any) {
    console.error('Failed to parse ideas:', error);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

function extractJSON(text: string): string {
  // Try to find JSON in the response
  const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }
  
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return text;
}
