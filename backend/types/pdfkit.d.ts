declare module 'pdfkit' {
  import { Readable, Writable } from 'stream';
  class PDFDocument extends Readable {
    constructor(options?: any);
    pipe(dest: Writable | any): any;
    text(text: string, x?: number, y?: number, options?: any): this;
    fontSize(n: number): this;
    image(src: any, x?: number, y?: number, options?: any): this;
    addPage(options?: any): this;
    end(): void;
  }
  export = PDFDocument;
}

