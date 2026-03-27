import Anthropic from '@anthropic-ai/sdk';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Debug: Log all AI-related env vars at module load
console.log('🔧 Module Load - AI_PROVIDER:', process.env.AI_PROVIDER);
console.log('🔧 Module Load - BEDROCK_BLOG_MODEL:', process.env.BEDROCK_BLOG_MODEL);
console.log('🔧 Module Load - AWS_BEDROCK_REGION:', process.env.AWS_BEDROCK_REGION);
console.log('🔧 Module Load - AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');

// Read AI provider dynamically
function getAIProvider() {
  const provider = (process.env.AI_PROVIDER || 'bedrock').trim();
  console.log('🔍 getAIProvider() called, returning:', JSON.stringify(provider));
  return provider;
}

// Anthropic Direct API (lazy init)
let anthropicClient: Anthropic | null = null;
function getAnthropicClient() {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set. Set AI_PROVIDER=bedrock to use AWS Bedrock instead.');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// AWS Bedrock Client (lazy init)
let bedrockClientInstance: BedrockRuntimeClient | null = null;
function getBedrockClient() {
  if (!bedrockClientInstance) {
    bedrockClientInstance = new BedrockRuntimeClient({
      region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return bedrockClientInstance;
}

export const AI_MODEL =
  getAIProvider() === 'bedrock'
    ? process.env.BEDROCK_BLOG_MODEL || 'us.anthropic.claude-3-5-haiku-20241022-v1:0' // Claude 3.5 Haiku (testing)
    : 'claude-3-5-haiku-20241022';

export const AI_MAX_TOKENS = 5000; // Further reduced to strictly constrain to ~1,500-2,000 words
export const AI_TEMPERATURE = 0.7; // Higher temperature for more creative, longer output

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateOptions {
  model: string;
  max_tokens: number;
  messages: Message[];
  temperature?: number;
}

interface GenerateResponse {
  content: Array<{ type: string; text?: string }>;
}

interface StreamCallbacks {
  onText: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function generateContentStream(
  options: GenerateOptions,
  callbacks: StreamCallbacks
): Promise<void> {
  const AI_PROVIDER = getAIProvider();

  if (AI_PROVIDER === 'bedrock') {
    const { InvokeModelWithResponseStreamCommand } = await import('@aws-sdk/client-bedrock-runtime');
    const bedrockClient = getBedrockClient();

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.max_tokens,
      messages: options.messages,
      temperature: options.temperature || 1.0,
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: options.model,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    let fullText = '';

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
          if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
            fullText += chunk.delta.text;
            callbacks.onText(chunk.delta.text);
          }
        }
      }
    }

    callbacks.onDone(fullText);
  } else {
    const anthropic = getAnthropicClient();

    const stream = anthropic.messages.stream({
      model: options.model,
      max_tokens: options.max_tokens,
      messages: options.messages,
      temperature: options.temperature || 1.0,
    });

    let fullText = '';

    stream.on('text', (text) => {
      fullText += text;
      callbacks.onText(text);
    });

    await stream.finalMessage();
    callbacks.onDone(fullText);
  }
}

export async function generateContent(options: GenerateOptions): Promise<GenerateResponse> {
  const AI_PROVIDER = getAIProvider();
  console.log('🔍 AI_PROVIDER:', AI_PROVIDER);
  console.log('🔍 Using model:', options.model);
  
  if (AI_PROVIDER === 'bedrock') {
    console.log('✅ Using AWS Bedrock');
    const bedrockClient = getBedrockClient();
    
    // Use AWS Bedrock
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options.max_tokens,
      messages: options.messages,
      temperature: options.temperature || 1.0,
    };

    const command = new InvokeModelCommand({
      modelId: options.model,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      content: responseBody.content,
    };
  } else {
    console.log('⚠️ Using Anthropic Direct API');
    const anthropic = getAnthropicClient();
    
    // Use Anthropic Direct API
    const response = await anthropic.messages.create({
      model: options.model,
      max_tokens: options.max_tokens,
      messages: options.messages,
      temperature: options.temperature || 1.0,
    });

    return {
      content: response.content,
    };
  }
}
