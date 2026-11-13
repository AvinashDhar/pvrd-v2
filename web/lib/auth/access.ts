export const catalogueRoles = [
  { value: "retailer", label: "Retailer" },
  { value: "contractor", label: "Carpenter / Contractor" },
  { value: "consumer", label: "Consumer" },
] as const;

export function roleLabel(role: string) {
  return catalogueRoles.find((item) => item.value === role)?.label ?? role;
}

export function signInDenial(status: string) {
  if (status === "pending") {
    return "This account is waiting for an administrator to approve it.";
  }
  if (status === "inactive") {
    return "This account is deactivated. Contact OM PVRD to restore it.";
  }
  if (status === "blocked") {
    return "This account is blocked and cannot sign in.";
  }
  return "This account cannot sign in.";
}

export function normalizeMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  const local =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}
