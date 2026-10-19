export function buildCounselorSystemPrompt(profileOrOpts: any, maybeRealityAnswer?: string): string;
export function parseAIModelOutput(rawText: string): {
  replyText: string;
  quickReplies: string[];
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
