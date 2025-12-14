export function createEnumToStringMapFunction<T extends number = number>(
  enumeration: any
): (value: T) => string {
  const map = new Map<T, string>();

  for (let name in enumeration) {
    const id = enumeration[name];
    if (typeof id === "number" && !map.has(id as T)) {
      map.set(id as T, name);
    }
  }

  return (value: T) => (map.get(value) ?? "") as string;
}

export function firstLetterToUpper(input: string): string {
  if (input.length <= 0) {
    return input;
  }

  return input.substring(0, 1).toUpperCase() + input.substring(1);
}
