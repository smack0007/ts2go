import nodeAssert from "node:assert";
import nodeTest from "node:test";

export const assert: typeof nodeAssert = nodeAssert;
export const describe = nodeTest.describe;
export const it = nodeTest.it;
