export type FormState = { error: string; field?: string } | null;

export type ActionNotice = { message?: string; error?: string };

export function formError(error: string, field?: string) {
  return field ? { error, field } : { error };
}
