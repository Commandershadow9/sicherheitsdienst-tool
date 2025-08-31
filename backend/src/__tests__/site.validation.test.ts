import { createSiteSchema, updateSiteSchema } from '../validations/siteValidation';

describe('Site Zod Schemas', () => {
  it('rejects invalid create payload', async () => {
    await expect(
      createSiteSchema.parseAsync({ body: { name: '', address: '', city: '', postalCode: '' } }),
    ).rejects.toBeTruthy();
  });

  it('accepts minimal valid create payload', async () => {
    await expect(
      createSiteSchema.parseAsync({ body: { name: 'HQ', address: 'Main St 1', city: 'Berlin', postalCode: '10115' } }),
    ).resolves.toBeTruthy();
  });

  it('rejects empty update payload', async () => {
    await expect(updateSiteSchema.parseAsync({ body: {} })).rejects.toBeTruthy();
  });

  it('accepts partial update payload', async () => {
    await expect(updateSiteSchema.parseAsync({ body: { name: 'New Name' } })).resolves.toBeTruthy();
  });
});

