import { sayHello } from "./sayHello.ts";

function main(): void {
  console.info(sayHello("Bob"));
  const x = [1, 2, 3, 4];
  for (let i = 0; i < x.length; i += 1) {
    console.info(x[i]);
  }
}
