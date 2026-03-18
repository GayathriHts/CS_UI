const passwordCriteria = [
  { label: 'at least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'one uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'one lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'one number', test: (value: string) => /\d/.test(value) },
  { label: 'one special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export function getPasswordValidationError(password: string): string | null {
  const failedCriteria = passwordCriteria.filter((criterion) => !criterion.test(password));

  if (failedCriteria.length === 0) {
    return null;
  }

  return `Please create a strong password with ${failedCriteria.map((criterion) => criterion.label).join(', ')}.`;
}
