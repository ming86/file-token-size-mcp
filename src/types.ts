/**
 * Shared type definitions — port from vscode-token-counter.
 */

/**
 * Input parameters for the calculateFilesTokenSize tool.
 */
export interface ICalculateFilesTokenSizeParameters {
  filePaths: string[];
}

/**
 * Result object for a single file's token budget estimation.
 */
export interface ITokenBudgetResult {
  filePath: string;
  tokens: number;
  characters: number;
  words: number;
  fileSizeBytes: number;
  totalLines: number;
  /** Error description with actionable guidance if file processing failed */
  error?: string;
}

/**
 * Token count result for multiple models.
 */
export interface TokenCountResult {
  gpt5: number;
  claudeSonnet45: number;
  gemini25Pro: number;
}

/**
 * Supported model names for display.
 */
export type ModelName = 'GPT-5' | 'Claude Sonnet 4.5' | 'Gemini 2.5 Pro';
