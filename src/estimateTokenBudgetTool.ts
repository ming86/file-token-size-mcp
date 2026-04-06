import { readFile } from 'node:fs/promises';
import { TokenCounterService } from './tokenCounterService.js';
import type { IEstimateTokenBudgetParameters, ITokenBudgetResult, ModelName } from './types.js';

/**
 * Port of EstimateTokenBudgetTool from vscode-token-counter.
 * Replaces vscode.workspace.fs with Node.js fs and vscode config with env var.
 */
export class EstimateTokenBudgetTool {
  private readonly tokenCounter: TokenCounterService;

  constructor(tokenCounter: TokenCounterService) {
    this.tokenCounter = tokenCounter;
  }

  async invoke(params: IEstimateTokenBudgetParameters): Promise<ITokenBudgetResult[]> {
    const { filePaths } = params;

    if (!filePaths || filePaths.length === 0) {
      throw new Error('filePaths is required and must contain at least one file path');
    }

    // Get model from environment variable, default to GPT-5
    const model = (process.env.TOKEN_COUNTER_MODEL as ModelName) || 'GPT-5';

    const results: ITokenBudgetResult[] = [];
    for (const filePath of filePaths) {
      const result = await this.processFile(filePath, model);
      results.push(result);
    }

    return results;
  }

  private async processFile(
    filePath: string,
    model: ModelName
  ): Promise<ITokenBudgetResult> {
    try {
      const fileData = await readFile(filePath);
      const fileSizeBytes = fileData.byteLength;
      const fileContent = new TextDecoder('utf-8').decode(fileData);

      if (this.isBinaryContent(fileContent)) {
        return {
          filePath,
          tokens: 0,
          characters: 0,
          words: 0,
          fileSizeBytes,
          totalLines: 0,
          error: 'File appears to be binary or non-text content. Exclude binary files from token estimation.'
        };
      }

      const allLines = fileContent.split(/\r?\n/);
      const totalLines = allLines.length;

      const tokenCounts = this.tokenCounter.countTokens(fileContent);
      const tokenCount = this.getTokenCountForModel(tokenCounts, model);
      const characterCount = fileContent.length;
      const wordCount = this.countWords(fileContent);

      return {
        filePath,
        tokens: tokenCount,
        characters: characterCount,
        words: wordCount,
        fileSizeBytes,
        totalLines
      };
    } catch (error) {
      return this.createErrorResult(filePath, error);
    }
  }

  private createErrorResult(filePath: string, error: unknown): ITokenBudgetResult {
    const message = error instanceof Error ? error.message : String(error);
    const lowerMessage = message.toLowerCase();

    let errorText: string;

    if (lowerMessage.includes('enoent') || lowerMessage.includes('no such file') || lowerMessage.includes('filenotfound')) {
      errorText = `File not found: ${filePath}. Verify the path is correct and retry.`;
    } else if (lowerMessage.includes('eacces') || lowerMessage.includes('permission') || lowerMessage.includes('access denied')) {
      errorText = `Permission denied: ${filePath}. The file exists but cannot be read due to access restrictions.`;
    } else if (lowerMessage.includes('einval') || lowerMessage.includes('invalid') || lowerMessage.includes('illegal')) {
      errorText = `Invalid file path: ${filePath}. Ensure the path is correct and retry.`;
    } else {
      errorText = `Failed to read file: ${message}. Verify the file exists and is accessible, and retry.`;
    }

    return {
      filePath,
      tokens: 0,
      characters: 0,
      words: 0,
      fileSizeBytes: 0,
      totalLines: 0,
      error: errorText
    };
  }

  private isBinaryContent(content: string): boolean {
    const sample = content.slice(0, 1000);
    if (sample.length === 0) {
      return false;
    }

    let nonPrintable = 0;
    for (let i = 0; i < sample.length; i++) {
      const code = sample.charCodeAt(i);
      if (code < 9 || (code > 13 && code < 32) || code === 127) {
        nonPrintable++;
      }
    }

    return (nonPrintable / sample.length) > 0.1;
  }

  private getTokenCountForModel(counts: { gpt5: number; claudeSonnet45: number; gemini25Pro: number }, model: ModelName): number {
    switch (model) {
      case 'GPT-5':
        return counts.gpt5;
      case 'Claude Sonnet 4.5':
        return counts.claudeSonnet45;
      case 'Gemini 2.5 Pro':
        return counts.gemini25Pro;
      default:
        return counts.gpt5;
    }
  }

  private countWords(text: string): number {
    if (!text.trim()) {
      return 0;
    }
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}
