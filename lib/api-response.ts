// Shared API response type used by all server actions.
// Discriminated union: success carries `data`, failure carries `error`.
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const ok = <T>(data: T): ApiResponse<T> => ({ success: true, data });

export const fail = <T = never>(error: string): ApiResponse<T> => ({
  success: false,
  error,
});
