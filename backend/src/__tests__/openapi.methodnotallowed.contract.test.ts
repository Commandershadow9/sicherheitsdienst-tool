import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

describe('OpenAPI MethodNotAllowed contract', () => {
  it('ensures every operation defines a 405 MethodNotAllowed reference', () => {
    const specPath = path.resolve(__dirname, '../../../docs/openapi.yaml');
    const spec = YAML.parse(fs.readFileSync(specPath, 'utf8'));
    const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

    const missing: string[] = [];

    Object.entries(spec.paths ?? {}).forEach(([route, operations]) => {
      Object.entries(operations as Record<string, any>).forEach(([method, operation]) => {
        if (!httpMethods.includes(method)) {
          return;
        }
        const responses = operation?.responses ?? {};
        const methodNotAllowed = responses['405'];
        if (!methodNotAllowed || methodNotAllowed.$ref !== '#/components/responses/MethodNotAllowed') {
          missing.push(`${method.toUpperCase()} ${route}`);
        }
      });
    });

    expect(missing).toEqual([]);
  });
});
