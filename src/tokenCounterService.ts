import Tokenizer, { models } from 'ai-tokenizer';
import * as o200k from 'ai-tokenizer/encoding/o200k_base';
import * as claude from 'ai-tokenizer/encoding/claude';
import type { TokenCountResult } from './types.js';

/**
 * Service for counting tokens using multiple AI model encodings.
 * Exact port from vscode-token-counter.
 */
export class TokenCounterService {
  private readonly gpt5Tokenizer: Tokenizer;
  private readonly claudeTokenizer: Tokenizer;
  private readonly geminiTokenizer: Tokenizer;

  constructor() {
    this.gpt5Tokenizer = new Tokenizer(o200k);
    this.claudeTokenizer = new Tokenizer(claude);
    this.geminiTokenizer = new Tokenizer(o200k);
  }

  countTokens(text: string): TokenCountResult {
    if (!text) {
      return { gpt5: 0, claudeSonnet45: 0, gemini25Pro: 0 };
    }

    try {
      const gpt5Model = models['openai/gpt-5'];
      const claudeModel = models['anthropic/claude-sonnet-4.5'];
      const geminiModel = models['google/gemini-2.5-pro'];

      const gpt5Count = this.gpt5Tokenizer.count(text);
      const claudeCount = this.claudeTokenizer.count(text);
      const geminiCount = this.geminiTokenizer.count(text);

      const gpt5Tokens = Math.round(gpt5Count * (gpt5Model.tokens.contentMultiplier || 1));
      const claudeTokens = Math.round(claudeCount * (claudeModel.tokens.contentMultiplier || 1));
      const geminiTokens = Math.round(geminiCount * (geminiModel.tokens.contentMultiplier || 1));

      return {
        gpt5: gpt5Tokens,
        claudeSonnet45: claudeTokens,
        gemini25Pro: geminiTokens
      };
    } catch (error) {
      console.error('Error counting tokens:', error);
      return { gpt5: 0, claudeSonnet45: 0, gemini25Pro: 0 };
    }
  }
}
