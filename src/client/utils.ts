export async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str),
  );

  return Array.prototype.map
    .call(new Uint8Array(buf), (x: number) => `00${x.toString(16)}`.slice(-2))
    .join('');
}

export async function sha512(str: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-512',
    new TextEncoder().encode(str),
  );

  return Array.prototype.map
    .call(new Uint8Array(buf), (x: number) => `00${x.toString(16)}`.slice(-2))
    .join('');
}