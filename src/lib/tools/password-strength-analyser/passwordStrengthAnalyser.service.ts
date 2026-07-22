export interface PasswordCrackTimeEstimation {
  entropy: number;
  charsetLength: number;
  passwordLength: number;
  crackDurationFormatted: string;
  secondsToCrack: number;
  score: number;
}

function prettifyExponentialNotation(exponentialNotation: number): string {
  const [base, exponent] = exponentialNotation.toString().split("e");
  const baseAsNumber = Number.parseFloat(base!);
  const prettyBase = baseAsNumber % 1 === 0 ? baseAsNumber.toLocaleString() : baseAsNumber.toFixed(2);
  return exponent ? `${prettyBase}e${exponent}` : prettyBase;
}

function getHumanFriendlyDuration({ seconds }: { seconds: number }): string {
  if (seconds <= 0.001) {
    return "Instantly";
  }

  if (seconds <= 1) {
    return "Less than a second";
  }

  const timeUnits: Array<{
    unit: string;
    secondsInUnit: number;
    plural: string;
    format?: (quantity: number) => string;
  }> = [
    { unit: "millenium", secondsInUnit: 31536000000, format: prettifyExponentialNotation, plural: "millennia" },
    { unit: "century", secondsInUnit: 3153600000, plural: "centuries" },
    { unit: "decade", secondsInUnit: 315360000, plural: "decades" },
    { unit: "year", secondsInUnit: 31536000, plural: "years" },
    { unit: "month", secondsInUnit: 2592000, plural: "months" },
    { unit: "week", secondsInUnit: 604800, plural: "weeks" },
    { unit: "day", secondsInUnit: 86400, plural: "days" },
    { unit: "hour", secondsInUnit: 3600, plural: "hours" },
    { unit: "minute", secondsInUnit: 60, plural: "minutes" },
    { unit: "second", secondsInUnit: 1, plural: "seconds" },
  ];

  let remaining = seconds;
  const parts: string[] = [];

  for (const { unit, secondsInUnit, plural, format } of timeUnits) {
    const quantity = Math.floor(remaining / secondsInUnit);
    remaining %= secondsInUnit;

    if (quantity <= 0) {
      continue;
    }

    const formattedQuantity = format ? format(quantity) : String(quantity);
    parts.push(`${formattedQuantity} ${quantity > 1 ? plural : unit}`);

    if (parts.length >= 2) {
      break;
    }
  }

  return parts.join(", ");
}

export function getCharsetLength({ password }: { password: string }): number {
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSpecialChars = /\W|_/.test(password);

  let charsetLength = 0;

  if (hasLowercase) {
    charsetLength += 26;
  }
  if (hasUppercase) {
    charsetLength += 26;
  }
  if (hasDigits) {
    charsetLength += 10;
  }
  if (hasSpecialChars) {
    charsetLength += 32;
  }

  return charsetLength;
}

export function getPasswordCrackTimeEstimation({
  password,
  guessesPerSecond = 1e9,
}: {
  password: string;
  guessesPerSecond?: number;
}): PasswordCrackTimeEstimation {
  const charsetLength = getCharsetLength({ password });
  const passwordLength = password.length;

  const entropy = password === "" ? 0 : Math.log2(charsetLength) * passwordLength;

  const secondsToCrack = 2 ** entropy / guessesPerSecond;

  const crackDurationFormatted = getHumanFriendlyDuration({ seconds: secondsToCrack });

  const score = Math.min(entropy / 128, 1);

  return {
    entropy,
    charsetLength,
    passwordLength,
    crackDurationFormatted,
    secondsToCrack,
    score,
  };
}
