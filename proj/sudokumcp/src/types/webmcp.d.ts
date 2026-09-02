export type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: Record<string, unknown>, extras?: { signal?: AbortSignal }) => Promise<unknown> | unknown;
};

export type WebMcpContext = {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void>;
};

declare global {
  interface Document {
    modelContext?: WebMcpContext;
  }

  interface Navigator {
    modelContext?: WebMcpContext;
  }
}

export {};
