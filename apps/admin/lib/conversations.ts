// Twilio Conversations token helper

type TokenResult = {
  ok: boolean;
  token?: string;
  identity?: string;
  error?: string;
};

export async function getConversationsToken(): Promise<TokenResult> {
  try {
    const res = await fetch("/api/conversations/token", {
      credentials: "include",
    });
    if (!res.ok) {
      return { ok: false, error: "Token request failed" };
    }
    const data = await res.json();
    if (!data.token) {
      return { ok: false, error: "No token in response" };
    }
    return { ok: true, token: data.token, identity: data.identity };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
