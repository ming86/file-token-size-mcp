#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { TokenCounterService } from './tokenCounterService.js';
import { CalculateFilesTokenSizeTool } from './calculateFilesTokenSizeTool.js';

const server = new McpServer({
  name: 'file-token-size-mcp',
  version: '0.1.0',
});

const tokenCounter = new TokenCounterService();
const tool = new CalculateFilesTokenSizeTool(tokenCounter);

server.tool(
  'calculateFilesTokenSize',
  `Use this to calculate token size estimation for files BEFORE reading or delegating their content. Use it to:
- Plan task scope: Know file sizes and line counts before deciding how to decompose work
- Intelligent reading: Decide whether to read entire files or use targeted approaches
- Context budgeting: Verify content fits within context limits before delegation
- Batch planning: Estimate total token cost when processing multiple files

Returns token count, character count, word count, file size (bytes), and total lines.`,
  {
    filePaths: z.array(z.string()).describe('Array of absolute file paths to analyze. Always provide as array, even for single files.'),
  },
  async (params) => {
    try {
      const results = await tool.invoke(params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('file-token-size-mcp server started on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
