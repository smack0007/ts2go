interface Console {
  info(...data: unknown[]): void;
}

declare global {
  type int = number;
  type int32 = number;

  declare const console: Conosle;
}

export {};
