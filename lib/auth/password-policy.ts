export const ORBYVEN_PASSWORD_MIN_LENGTH = 12;

const LOWERCASE = /[a-z]/;
const UPPERCASE = /[A-Z]/;
const DIGIT = /[0-9]/;
const SYMBOL = /[!@#$%^&*()_+\-=\[\]{};'\\:"|<>?,./`~]/;

export function validateOrbyvenPassword(password: string) {
  if (password.length < ORBYVEN_PASSWORD_MIN_LENGTH) {
    return {
      valid: false as const,
      message: `Parola trebuie să aibă cel puțin ${ORBYVEN_PASSWORD_MIN_LENGTH} caractere.`,
    };
  }

  if (!LOWERCASE.test(password) || !UPPERCASE.test(password) || !DIGIT.test(password) || !SYMBOL.test(password)) {
    return {
      valid: false as const,
      message: "Parola trebuie să conțină cel puțin o literă mică, o literă mare, o cifră și un simbol.",
    };
  }

  return { valid: true as const, message: "" };
}
