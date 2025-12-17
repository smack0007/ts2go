function main(): void {
  console.info(sayHello("Bob"));
  const x = "Hello " + 24;
  console.info(x);
}

function sayHello(name: string): string {
  return `Hello ${name}!`;
}
