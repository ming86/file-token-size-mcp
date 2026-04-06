# file-token-size-mcp

An MCP server that estimates token consumption for files before reading them. Port of the `estimateTokenBudget` LM tool from [vscode-token-counter](https://github.com/ming86/vscode-token-counter).

## Purpose

Estimate token budgets **before** reading or delegating file content:

- **Plan task scope** — know file sizes and line counts before deciding how to decompose work
- **Intelligent reading** — decide whether to read entire files or use targeted approaches
- **Context budgeting** — verify content fits within context limits before delegation
- **Batch planning** — estimate total token cost when processing multiple files

## Installation

### From source

```bash
git clone https://github.com/ming86/file-token-size-mcp.git
cd file-token-size-mcp
npm install
npm run build
```

### Via npx (no clone required)

If published to npm, clients can run it directly with `npx file-token-size-mcp`.

## Configuration

### VS Code (GitHub Copilot)

Open your VS Code settings JSON (`settings.json`) and add:

**macOS / Linux:**

```json
{
  "mcp": {
    "servers": {
      "file-token-size-mcp": {
        "command": "node",
        "args": ["/absolute/path/to/file-token-size-mcp/dist/index.js"]
      }
    }
  }
}
```

**Windows:**

```json
{
  "mcp": {
    "servers": {
      "file-token-size-mcp": {
        "command": "node",
        "args": ["C:\\absolute\\path\\to\\file-token-size-mcp\\dist\\index.js"]
      }
    }
  }
}
```

Alternatively, create a `.vscode/mcp.json` file in your workspace root for per-project configuration:

```json
{
  "servers": {
    "file-token-size-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/file-token-size-mcp/dist/index.js"]
    }
  }
}
```

### GitHub Copilot CLI

Add to `~/.config/github-copilot/mcp.json` (macOS/Linux) or `%APPDATA%\github-copilot\mcp.json` (Windows):

**macOS / Linux:**

```json
{
  "mcpServers": {
    "file-token-size-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/file-token-size-mcp/dist/index.js"]
    }
  }
}
```

**Windows:**

```json
{
  "mcpServers": {
    "file-token-size-mcp": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\file-token-size-mcp\\dist\\index.js"]
    }
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TOKEN_COUNTER_MODEL` | `GPT-5` | Model for token counting. Valid: `GPT-5`, `Claude Sonnet 4.5`, `Gemini 2.5 Pro` |

To set an environment variable in your MCP configuration:

```json
{
  "mcpServers": {
    "file-token-size-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/file-token-size-mcp/dist/index.js"],
      "env": {
        "TOKEN_COUNTER_MODEL": "Claude Sonnet 4.5"
      }
    }
  }
}

## Tool: `estimateTokenBudget`

### Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filePaths` | `string[]` | Yes | Array of absolute file paths to analyze |

### Output

Returns an array of result objects per file:

| Field | Type | Description |
|-------|------|-------------|
| `filePath` | `string` | Absolute path of the analyzed file |
| `tokens` | `number` | Estimated token count for the configured model |
| `characters` | `number` | Character count |
| `words` | `number` | Word count |
| `fileSizeBytes` | `number` | File size in bytes |
| `totalLines` | `number` | Total line count |
| `error` | `string?` | Error description if file processing failed |

### Example

```json
{
  "filePaths": ["/path/to/file.ts", "/path/to/another.ts"]
}
```

Response:

```json
[
  {
    "filePath": "/path/to/file.ts",
    "tokens": 298,
    "characters": 928,
    "words": 81,
    "fileSizeBytes": 928,
    "totalLines": 38
  },
  {
    "filePath": "/path/to/another.ts",
    "tokens": 1024,
    "characters": 3200,
    "words": 420,
    "fileSizeBytes": 3200,
    "totalLines": 102
  }
]
```

## Token Counting

Uses [ai-tokenizer](https://www.npmjs.com/package/ai-tokenizer) with model-specific encodings:

| Model | Encoding | Multiplier |
|-------|----------|------------|
| GPT-5 | o200k_base | Per model config |
| Claude Sonnet 4.5 | claude | Per model config |
| Gemini 2.5 Pro | o200k_base | Per model config |

Binary files are detected automatically and return an error result rather than incorrect token counts.

## License

See [LICENSE](LICENSE).