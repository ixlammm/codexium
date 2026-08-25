import { Txt as codexiumRpc } from "./app-initial-CUcIZsiK.js";

export function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), ms)),
  ]);
}

export async function call(method, params) {
  return withTimeout(codexiumRpc(method, { hostId: "local", ...params }), 15000);
}

export function cx(...c) {
  return c.filter(Boolean).join(" ");
}
