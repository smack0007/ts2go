export function createEnumToStringMapFunction<T extends number = number>(enumeration: any): (value: T) => string {
  const map = new Map<T, string>();

  for (let name in enumeration) {
    const id = enumeration[name];
    if (typeof id === "number" && !map.has(id as T)) {
      map.set(id as T, name);
    }
  }

  return (value: T) => (map.get(value) ?? "") as string;
}