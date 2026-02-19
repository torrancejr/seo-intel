import { generateContent, AI_MODEL, AI_MAX_TOKENS } from './client';
import { ARTICLE_GENERATION_PROMPT } from './prompts';
import { db } from '../db';
import slugify from 'slugify';

interface GenerateArticleInput {
  tenantId: string;
  topicId: string;
  cityId: string;
  customInstructions?: string;
  preview?: boolean;
}

interface GeneratedArticle {
  metaTitle: string;
  metaDescription: string;
  content: string;
  wordCount: number;
}

export async function generateArticle({
  tenantId,
  topicId,
  cityId,
  customInstructions,
  preview = false,
}: GenerateArticleInput) {
  // 1. Fetch tenant, topic, city with all data
  const [tenant, topic, city] = await Promise.all([
    db.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    db.topic.findUniqueOrThrow({ where: { id: topicId } }),
    db.city.findUniqueOrThrow({ where: { id: cityId } }),
  ]);

  // 2. Format city data for prompt
  const cityDataDetails = formatCityData(city);

  // 3. Generate article title
  const articleTitle = `${topic.name} in ${city.name}, ${city.stateCode}`;

  // 4. Build prompt with real data
  let prompt = ARTICLE_GENERATION_PROMPT
    .replace('{businessName}', tenant.name)
    .replace('{businessType}', 'content generation platform')
    .replace('{businessDescription}', tenant.businessDescription || '')
    .replace('{articleTitle}', articleTitle)
    .replace('{topicName}', topic.name)
    .replaceAll('{cityName}', city.name)
    .replaceAll('{stateCode}', city.stateCode)
    .replace('{population}', city.population?.toLocaleString() || 'N/A')
    .replace('{metroPopulation}', city.metroPopulation?.toLocaleString() || 'N/A')
    .replace('{cityDataDetails}', cityDataDetails);

  if (customInstructions) {
    prompt += `\n\nAdditional Instructions: ${customInstructions}`;
  }

  // 5. Call Claude via Bedrock or Direct API
  const response = await generateContent({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  });

  // 6. Parse response
  const textBlock = response.content.find(block => block.type === 'text');
  const text = textBlock?.text || '';
  
  console.log('📄 Raw AI response (first 500 chars):', text.substring(0, 500));
  
  let parsed: GeneratedArticle;
  try {
    const jsonStr = extractJSON(text);
    parsed = JSON.parse(jsonStr);
  } catch (parseError: any) {
    console.error('❌ JSON Parse Error:', parseError.message);
    console.error('📄 Attempted to parse:', text.substring(0, 1000));
    throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
  }

  // 7. Generate slug
  const baseSlug = slugify(articleTitle, { lower: true, strict: true });
  const slug = await generateUniqueSlug(tenantId, baseSlug);

  // 8. Calculate reading time (avg 200 words per minute)
  const readingTimeMin = Math.ceil(parsed.wordCount / 200);

  // If preview mode, return without saving
  if (preview) {
    return {
      metaTitle: parsed.metaTitle,
      metaDescription: parsed.metaDescription,
      content: parsed.content,
      wordCount: parsed.wordCount,
    };
  }

  // 9. Save article to database
  const article = await db.article.create({
    data: {
      tenantId,
      topicId,
      cityId,
      title: articleTitle,
      slug,
      content: parsed.content,
      metaTitle: parsed.metaTitle,
      metaDescription: parsed.metaDescription,
      wordCount: parsed.wordCount,
      readingTimeMin,
      status: 'REVIEW',
      aiModelUsed: AI_MODEL,
      aiPromptSnapshot: { prompt, customInstructions },
    },
    include: {
      topic: true,
      city: true,
    },
  });

  return article;
}

function formatCityData(city: any): string {
  const parts: string[] = [];

  if (city.metroData) {
    const md = city.metroData as any;
    if (md.medianIncome) parts.push(`Median Income: $${md.medianIncome.toLocaleString()}`);
    if (md.costOfLiving) parts.push(`Cost of Living Index: ${md.costOfLiving} (US avg: 100)`);
    if (md.medianHomePrice) parts.push(`Median Home Price: $${md.medianHomePrice.toLocaleString()}`);
    if (md.averageRent) parts.push(`Average Rent: $${md.averageRent}/month`);
  }

  if (city.demographics) {
    const demo = city.demographics as any;
    if (demo.medianAge) parts.push(`Median Age: ${demo.medianAge}`);
    if (demo.collegeEducated) parts.push(`College Educated: ${demo.collegeEducated}%`);
  }

  if (city.economicData) {
    const ed = city.economicData as any;
    if (ed.unemploymentRate) parts.push(`Unemployment Rate: ${ed.unemploymentRate}%`);
    if (ed.majorEmployers) parts.push(`Major Employers: ${ed.majorEmployers.slice(0, 3).join(', ')}`);
  }

  if (city.legalData) {
    const ld = city.legalData as any;
    if (ld.totalCourts) parts.push(`Courts in Metro: ${ld.totalCourts}`);
    if (ld.firmCount) parts.push(`Law Firms: ${ld.firmCount}`);
  }

  return parts.join('\n');
}

function extractJSON(text: string): string {
  // Try to find JSON in the response (handle markdown code blocks)
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }
  
  // Try to find raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return text;
}

async function generateUniqueSlug(tenantId: string, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.article.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
