import { generateContent, AI_MODEL, AI_MAX_TOKENS, AI_TEMPERATURE } from './client';
import { ARTICLE_GENERATION_PROMPT } from './prompts';
import { db } from '../db';
import slugify from 'slugify';

interface GenerateArticleInput {
  tenantId: string;
  topicId: string;
  cityId?: string;
  customInstructions?: string;
  preview?: boolean;
  suggestedTitle?: string;
  suggestedOutline?: any;
  seoKeywords?: string[];
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
  suggestedTitle,
  suggestedOutline,
  seoKeywords,
}: GenerateArticleInput) {
  // 1. Fetch tenant and topic
  const [tenant, topic] = await Promise.all([
    db.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    db.topic.findUniqueOrThrow({ where: { id: topicId } }),
  ]);

  // 2. Fetch city if provided
  let city = null;
  let cityDataDetails = '';
  if (cityId) {
    city = await db.city.findUniqueOrThrow({ where: { id: cityId } });
    cityDataDetails = formatCityData(city);
  }

  // 3. Generate article title
  const articleTitle = suggestedTitle || 
    (city ? `${topic.name} in ${city.name}, ${city.stateCode}` : topic.name);

  // 4. Build prompt with real data
  let prompt = ARTICLE_GENERATION_PROMPT
    .replace('{businessName}', tenant.name)
    .replace('{businessType}', 'content generation platform')
    .replace('{businessDescription}', tenant.businessDescription || '')
    .replace('{articleTitle}', articleTitle)
    .replace('{topicName}', topic.name)
    .replaceAll('{cityName}', city?.name || 'N/A')
    .replaceAll('{stateCode}', city?.stateCode || 'N/A')
    .replace('{population}', city?.population?.toLocaleString() || 'N/A')
    .replace('{metroPopulation}', city?.metroPopulation?.toLocaleString() || 'N/A')
    .replace('{cityDataDetails}', cityDataDetails);

  // Add suggested outline if provided
  if (suggestedOutline) {
    prompt += `\n\nSuggested Outline:\n`;
    if (suggestedOutline.sections) {
      prompt += `Sections: ${suggestedOutline.sections.join(', ')}\n`;
    }
    if (suggestedOutline.keyPoints) {
      prompt += `Key Points: ${suggestedOutline.keyPoints.join(', ')}\n`;
    }
  }

  // Add SEO keywords if provided
  if (seoKeywords && seoKeywords.length > 0) {
    prompt += `\n\nSEO Keywords to incorporate: ${seoKeywords.join(', ')}`;
  }

  if (customInstructions) {
    prompt += `\n\nAdditional Instructions: ${customInstructions}`;
  }

  // 5. Call Claude via Bedrock or Direct API
  const response = await generateContent({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    temperature: 0.7, // Higher temperature for longer, more creative output
    messages: [
      { 
        role: 'user', 
        content: `${prompt}

CRITICAL FINAL INSTRUCTION: 
- Write the COMPLETE 2,500-3,500 word article
- Do NOT use ANY placeholders like "[Content continues...]"  
- Write EVERY section and paragraph in FULL
- This must be a COMPLETE, PUBLISHABLE article

Begin writing the full article now:` 
      }
    ],
  });

  // 6. Parse response
  const textBlock = response.content.find(block => block.type === 'text');
  const text = textBlock?.text || '';
  
  console.log('📄 Raw AI response (first 500 chars):', text.substring(0, 500));
  console.log('📊 Full response length:', text.length, 'characters');
  
  let parsed: GeneratedArticle;
  try {
    // Try delimiter-based parsing first (new format)
    const delimiterParsed = parseDelimiterFormat(text);
    if (delimiterParsed) {
      parsed = delimiterParsed;
      console.log('✅ Parsed using delimiter format - Content length:', parsed.content.length);
    } else {
      // Fall back to JSON parsing (old format)
      const jsonStr = extractJSON(text);
      console.log('🔍 Extracted JSON length:', jsonStr.length, 'characters');
      
      try {
        parsed = JSON.parse(jsonStr);
      } catch (firstError: any) {
        console.log('⚠️ First parse attempt failed, trying to fix common issues...');
        const fixed = fixJSONIssues(jsonStr);
        parsed = JSON.parse(fixed);
        console.log('✅ Successfully parsed after fixing JSON issues');
      }
    }
    
    console.log('✅ Parsed article - Word count:', parsed.wordCount, 'Content length:', parsed.content.length);
    
    // Check for placeholder text
    const placeholderPatterns = [
      /\[content continues/i,
      /\[more sections/i,
      /\[remaining sections/i,
      /\[additional content/i,
      /\.\.\.\]/,
      /continues for \d+\+ more words/i,
    ];
    
    const hasPlaceholders = placeholderPatterns.some(pattern => pattern.test(parsed.content));
    if (hasPlaceholders) {
      console.error('❌ Article contains placeholder text - rejecting');
      throw new Error('AI generated placeholder text instead of full content. Please try again.');
    }
    
    // Check minimum word count
    const actualWordCount = parsed.content.split(/\s+/).filter(Boolean).length;
    if (actualWordCount < 1200) {
      console.error('❌ Article too short:', actualWordCount, 'words');
      throw new Error(`Article is too short (${actualWordCount} words). Minimum 1,200 words required. Please try regenerating.`);
    }
    
    if (actualWordCount > 2200) {
      console.error('❌ Article too long:', actualWordCount, 'words');
      throw new Error(`Article is too long (${actualWordCount} words). Maximum 2,200 words allowed. Please try regenerating with stricter length constraints.`);
    }
    
    if (actualWordCount > 2000) {
      console.warn('⚠️ Article slightly over target:', actualWordCount, 'words (target: 1,500-2,000)');
    }
    
    console.log('✅ Article validation passed - Actual word count:', actualWordCount);
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
      cityId: cityId || null,
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

function parseDelimiterFormat(text: string): GeneratedArticle | null {
  // Parse the delimiter-based format
  const metaTitleMatch = text.match(/---META_TITLE---\s*([\s\S]*?)\s*---META_DESCRIPTION---/);
  const metaDescMatch = text.match(/---META_DESCRIPTION---\s*([\s\S]*?)\s*---CONTENT---/);
  const contentMatch = text.match(/---CONTENT---\s*([\s\S]*?)\s*---END---/);
  
  if (metaTitleMatch && metaDescMatch && contentMatch) {
    const content = contentMatch[1].trim();
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    
    return {
      metaTitle: metaTitleMatch[1].trim(),
      metaDescription: metaDescMatch[1].trim(),
      content: content,
      wordCount: wordCount,
    };
  }
  
  return null;
}

function fixJSONIssues(jsonStr: string): string {
  // This function attempts to fix common JSON formatting issues
  // that can occur when AI generates long-form content
  
  try {
    // Parse to find where the error is
    JSON.parse(jsonStr);
    return jsonStr; // If it parses, return as-is
  } catch (e: any) {
    console.log('🔧 Attempting to fix JSON issues...');
    
    // Try to extract just the JSON object structure
    const match = jsonStr.match(/\{\s*"metaTitle"[\s\S]*"wordCount":\s*\d+\s*\}/);
    if (match) {
      return match[0];
    }
    
    // If that didn't work, return original and let it fail
    return jsonStr;
  }
}

function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  
  // Remove opening code block marker (```json or ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  
  // Remove closing code block marker
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  
  // Try to find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return cleaned;
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
