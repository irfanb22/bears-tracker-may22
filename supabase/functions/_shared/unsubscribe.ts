const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signMessage(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

export interface UnsubscribePayload {
  userId: string;
  email: string;
}

export async function createUnsubscribeToken(payload: UnsubscribePayload, secret: string) {
  const encodedPayload = toBase64Url(
    encoder.encode(JSON.stringify(payload)),
  );
  const signature = await signMessage(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyUnsubscribeToken(token: string, secret: string) {
  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    throw new Error("Invalid unsubscribe token format.");
  }

  const expectedSignature = await signMessage(secret, payloadPart);
  if (signaturePart !== expectedSignature) {
    throw new Error("Invalid unsubscribe token signature.");
  }

  const decodedPayload = new TextDecoder().decode(fromBase64Url(payloadPart));
  return JSON.parse(decodedPayload) as UnsubscribePayload;
}

export function buildUnsubscribeUrl(baseUrl: string, token: string) {
  const url = new URL(baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}
