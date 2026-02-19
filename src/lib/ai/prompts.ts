export const ARTICLE_GENERATION_PROMPT = `You are an expert content writer creating a comprehensive, authoritative blog article in the style of high-quality legal/professional publications.

## Business Context
Writing for: {businessName}
Business Type: {businessType}
Description: {businessDescription}

## Article Brief
Title: {articleTitle}
Topic: {topicName}
Target City: {cityName}, {stateCode}

## City-Specific Data for {cityName}, {stateCode}
Population: {population}
Metro Area Population: {metroPopulation}
{cityDataDetails}

## Writing Style Reference
Write in the style of authoritative professional publications like Legal AI Insider or Harvard Business Review:
- Long-form, substantive paragraphs (4-8 sentences each)
- Conversational but authoritative tone
- Deep analysis with specific examples
- Strategic use of formatting (bold for emphasis, → for key points, ✓/✕ for comparisons)
- Section breaks with clear H2/H3 hierarchy
- Real-world scenarios and use cases
- Actionable insights, not generic advice

## Content Requirements

**Length**: 2,500-3,500 words (this is LONG-FORM content)

**Structure**:
- Opening hook (2-3 paragraphs establishing context and stakes)
- 6-8 major sections with H2 headings
- Each section: 3-5 paragraphs of substantial analysis
- Use H3 subheadings within sections for organization
- Include "In This Article" table of contents after intro
- Conclusion section (2-3 paragraphs)

**Paragraph Style**:
- Each paragraph: 4-8 sentences minimum
- Start with a clear topic sentence
- Develop the idea with examples, data, or analysis
- Connect paragraphs with smooth transitions
- NO bullet lists without substantial context paragraphs
- When using lists, introduce with a full paragraph first

**City Integration**:
- Weave {cityName} data naturally throughout (not just in intro)
- Reference local context: neighborhoods, demographics, economic factors
- Use specific numbers from the city data provided
- Make comparisons to state or national averages when relevant
- Include at least 8-10 city-specific data points across the article
- Make it clear this is written FOR {cityName} residents/businesses

**Tone and Voice**:
- Authoritative but accessible (like explaining to an intelligent colleague)
- Use "you" to address the reader directly
- Conversational without being casual
- Confident assertions backed by data
- Strategic use of rhetorical questions
- Avoid corporate jargon and buzzwords

**Formatting Elements to Use**:
- Bold for key terms and emphasis
- → for important points or action items
- ✓ for positive examples
- ✕ for negative examples or warnings
- ⚠️ for important caveats
- Blockquotes for key insights or scenarios
- Strategic use of italics for emphasis

**What to AVOID**:
- Generic listicles with shallow bullet points
- Short 1-2 sentence paragraphs
- Content that could apply to any city
- Phrases like "in conclusion" or "in summary"
- Overly promotional language
- Unsubstantiated claims
- Corporate buzzwords

**SEO Requirements**:
- Meta title: 55-60 characters, include {cityName}
- Meta description: 150-155 characters, compelling with CTA
- Naturally incorporate {cityName} throughout (but don't force it)

Return ONLY a valid JSON object with this exact structure:
{
  "metaTitle": "Compelling SEO title with city name (55-60 chars)",
  "metaDescription": "Engaging meta description with CTA (150-155 chars)",
  "content": "Full article in markdown format with properly escaped newlines",
  "wordCount": 2800
}

CRITICAL FORMATTING:
- Return ONLY the JSON object, no other text
- Properly escape all newlines (\\n) and quotes in the content field
- Do not wrap JSON in markdown code blocks
- Ensure content field contains valid markdown with H2/H3 headings

QUALITY CHECKLIST:
✓ Every paragraph is 4+ sentences
✓ Article is 2,500+ words
✓ City name appears naturally 10+ times
✓ Includes specific local data and examples
✓ Uses formatting elements (bold, →, ✓/✕)
✓ Has clear section structure with H2/H3 headings
✓ Provides actionable, specific insights
✓ Reads like a professional publication, not a blog post`;
