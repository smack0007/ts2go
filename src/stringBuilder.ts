import { EOL } from "node:os";

export class StringBuilder {
  _data: (string | StringBuilder)[] = [""];
  _indentLevel = 0;

  private get currentLine(): string {
    return this._data[this._data.length - 1] as string;
  }

  private set currentLine(value: string) {
    this._data[this._data.length - 1] = value;
  }

  private get lineIsBeingWritten(): boolean {
    return this.currentLine.length > 0;
  }

  public indent(): void {
    this._indentLevel += 1;
  }

  public unindent(): void {
    this._indentLevel -= 1;
  }

  public append(value: string): void {
    if (!this.lineIsBeingWritten) {
      this.currentLine += "\t".repeat(this._indentLevel);
    }
    this.currentLine += value;
  }

  public appendLine(value: string = ""): void {
    if (value) {
      this.append(value);
    }
    this._data.push("");
  }

  public removeLine(): void {
    if (this.currentLine.length > 0) {
      this.currentLine = "";
    } else {
      this._data.pop();
    }
  }

  public insertPlaceholder(): StringBuilder {
    const placeholder = new StringBuilder();
    this._data.push(placeholder, "");
    return placeholder;
  }

  public toString(): string {
    let result = this._data
      .map((x) => x.toString())
      // Strip out extra EOL(s)
      .map((x) => (x.endsWith(EOL) ? x.slice(0, -EOL.length) : x))
      .join(EOL);

    if (this.currentLine.length > 0) {
      result += this.currentLine;
    }

    return result;
  }
}