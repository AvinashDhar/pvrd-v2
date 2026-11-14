export type FormState = { error: string; field?: string } | null;

export function formError(error: string, field?: string) {
  return field ? { error, field } : { error };
}
