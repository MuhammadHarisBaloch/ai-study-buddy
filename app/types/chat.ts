// The two kinds of messages in our chat. "assistant" = the AI.
export type chatRole = "user" | "assistant";

// One chat bubble.
export interface chatMessage {
  role: chatRole;
  content: string;
}

// Shape of the JSON the browser sends to our API route.
export interface chatRequestBody {
  messages: chatMessage[];
}

// Shape of a successful reply from our API route.

export interface chatResponseBody {
  reply: string;
}
