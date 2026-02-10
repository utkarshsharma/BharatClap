import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GrokSearchIntent {
  serviceCategory?: string;
  serviceType?: string;
  datePreference?: string;
  timePreference?: string;
  urgency?: string;
}

interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokChatCompletionRequest {
  model: string;
  messages: GrokChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface GrokChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class GrokService {
  private readonly logger = new Logger(GrokService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.x.ai/v1';
  private readonly model = 'grok-3-mini-fast';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('app.xai.apiKey') || '';

    if (!this.apiKey) {
      this.logger.warn('XAI_API_KEY not configured. AI search will fall back to text search.');
    }
  }

  /**
   * Parse natural language search query to extract structured intent
   */
  async parseSearchQuery(query: string): Promise<GrokSearchIntent | null> {
    if (!this.apiKey) {
      this.logger.warn('No API key configured, skipping AI parsing');
      return null;
    }

    try {
      const systemPrompt = `You are a search intent parser for a home services marketplace in India.
Extract structured information from user queries about home services.

Return ONLY a valid JSON object with these fields (all optional):
- serviceCategory: broad category (e.g., "plumber", "electrician", "carpenter", "cleaner", "painter")
- serviceType: specific service (e.g., "tap repair", "ac installation", "house cleaning")
- datePreference: when they need service (e.g., "today", "tomorrow", "this weekend", "next week")
- timePreference: preferred time (e.g., "morning", "afternoon", "evening", "night")
- urgency: how urgent (e.g., "urgent", "normal", "flexible")

Examples:
Query: "I need a plumber to fix my tap tomorrow morning"
Response: {"serviceCategory":"plumber","serviceType":"tap repair","datePreference":"tomorrow","timePreference":"morning","urgency":"normal"}

Query: "urgent electrician needed for power issue"
Response: {"serviceCategory":"electrician","serviceType":"power issue","urgency":"urgent"}

Query: "looking for house cleaning service this weekend"
Response: {"serviceCategory":"cleaner","serviceType":"house cleaning","datePreference":"this weekend"}

Only include fields you can confidently extract. Return empty object {} if nothing can be extracted.`;

      const requestBody: GrokChatCompletionRequest = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      };

      this.logger.log(`Sending request to Grok API for query: "${query}"`);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Grok API error (${response.status}): ${errorText}`);
        return null;
      }

      const data: GrokChatCompletionResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        this.logger.warn('No choices returned from Grok API');
        return null;
      }

      const content = data.choices[0].message.content.trim();
      this.logger.log(`Grok response: ${content}`);

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('No JSON object found in Grok response');
        return null;
      }

      const intent: GrokSearchIntent = JSON.parse(jsonMatch[0]);
      this.logger.log(`Parsed intent: ${JSON.stringify(intent)}`);

      return intent;
    } catch (error: any) {
      this.logger.error(`Error parsing search query with Grok: ${error.message}`, error.stack);
      return null;
    }
  }
}
