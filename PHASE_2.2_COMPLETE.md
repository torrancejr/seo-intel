# Phase 2.2: Idea Generation Workflow - COMPLETE ✅

## Overview
Implemented a complete article idea generation and management workflow that allows users to brainstorm content ideas before committing to full article generation.

## Features Implemented

### 1. AI Idea Generation
- **File**: `src/lib/ai/generate-ideas.ts`
- Generates 1-5 article ideas per request
- Uses same AI client (Bedrock/Anthropic) as article generation
- Includes for each idea:
  - Suggested title
  - Detailed outline with sections and key points
  - SEO keywords
  - Estimated monthly search volume

### 2. Idea Generation API
- **Endpoint**: `POST /api/ai/generate-ideas`
- Accepts: topicId, cityIds array, count (1-5)
- Creates one idea per city for each generated concept
- Saves ideas to ArticleIdea table with SUGGESTED status

### 3. Ideas Management Page
- **Route**: `/admin/ideas`
- **File**: `src/app/(admin)/admin/ideas/page.tsx`
- Features:
  - Form to generate new ideas (topic selector, city multi-select, idea count slider)
  - Displays suggested ideas with accept/reject buttons
  - Shows accepted ideas with "Generate Article" button
  - Displays idea details: title, outline, keywords, estimated volume
  - Organized into "Suggested Ideas" and "Accepted Ideas" sections

### 4. Idea Management APIs
Created complete CRUD operations for ideas:

#### GET /api/v1/ideas
- **File**: `src/app/api/v1/ideas/route.ts`
- Fetches all ideas for the tenant
- Includes topic and city relations
- Ordered by creation date (newest first)

#### POST /api/v1/ideas/[id]/accept
- **File**: `src/app/api/v1/ideas/[id]/accept/route.ts`
- Updates idea status to ACCEPTED
- Allows user to approve ideas for article generation

#### POST /api/v1/ideas/[id]/reject
- **File**: `src/app/api/v1/ideas/[id]/reject/route.ts`
- Updates idea status to REJECTED
- Allows user to dismiss ideas they don't want

#### POST /api/v1/ideas/[id]/generate
- **File**: `src/app/api/v1/ideas/[id]/generate/route.ts`
- Generates full article from accepted idea
- Uses idea's suggested title, outline, and keywords
- Checks for existing articles to prevent duplicates
- Updates idea status to GENERATED
- Links idea to generated article
- Redirects to article editor

### 5. Enhanced Article Generation
- **File**: `src/lib/ai/generate-article.ts`
- Updated to support generating from ideas
- New optional parameters:
  - `suggestedTitle`: Pre-defined article title
  - `suggestedOutline`: Structured outline with sections and key points
  - `seoKeywords`: Keywords to incorporate
- Makes cityId optional (for topic-only articles)
- Incorporates suggested content into AI prompt

## Database Schema
Uses existing `ArticleIdea` model from schema:
- `id`: Unique identifier
- `tenantId`: Multi-tenant isolation
- `topicId`: Associated topic
- `cityId`: Optional city (nullable)
- `suggestedTitle`: AI-generated title
- `suggestedOutline`: JSON with sections and key points
- `seoKeywords`: Array of keywords
- `estimatedVolume`: Monthly search volume estimate
- `status`: SUGGESTED | ACCEPTED | REJECTED | GENERATED
- `articleId`: Links to generated article (nullable)

## User Workflow
1. User selects topic and cities
2. User chooses number of ideas (1-5)
3. System generates ideas using AI
4. User reviews suggested ideas
5. User accepts or rejects each idea
6. User clicks "Generate Article" on accepted ideas
7. System creates full article using idea as template
8. User is redirected to article editor

## Technical Details
- Uses same AI configuration as article generation (Bedrock/Anthropic)
- Generates ideas in bulk (one concept × multiple cities)
- Prevents duplicate articles with unique constraint check
- Maintains idea-to-article relationship for tracking
- Supports both city-specific and general topic ideas

## Testing Status
- ✅ Production build passes
- ✅ TypeScript types valid
- ✅ No ESLint errors
- ⏳ Manual testing pending (waiting for full Phase 2 completion)

## Files Created/Modified
### New Files
- `src/lib/ai/generate-ideas.ts`
- `src/app/api/ai/generate-ideas/route.ts`
- `src/app/(admin)/admin/ideas/page.tsx`
- `src/app/api/v1/ideas/route.ts`
- `src/app/api/v1/ideas/[id]/accept/route.ts`
- `src/app/api/v1/ideas/[id]/reject/route.ts`
- `src/app/api/v1/ideas/[id]/generate/route.ts`

### Modified Files
- `src/lib/ai/generate-article.ts` (added idea generation support)

## Next Steps
- Continue with Phase 2.3: Website Analysis
- Continue with Phase 2.4: Advanced Editor Features
- Test complete Phase 2 workflow after all features implemented
- Commit all Phase 2 changes together

## Notes
- No commit made yet (per user instruction: "no more commits until we test after all of phase 2 is done")
- Ready for integration testing with other Phase 2 features
- Sidebar already has "Ideas" link from previous phases
