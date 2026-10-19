export function buildCounselorSystemPrompt(profileOrOpts: any, maybeRealityAnswer?: string): string;
export function parseAIModelOutput(rawText: string): {
  replyText: string;
  quickReplies: string[];
  contract?: any;
  detectedUpdates: Record<string, any>;
};
export function handleCounselorChatRequest(options: {
  body: any;
  headers?: any;
  env?: any;
}): Promise<{
  status: number;
  data: any;
}>;
export function handleCounselorStatusRequest(env?: any): {
  status: number;
  data: {
    success: boolean;
    hasServerKey: boolean;
    provider: string;
    model: string;
    requiresAdminSetup: boolean;
  };
};
