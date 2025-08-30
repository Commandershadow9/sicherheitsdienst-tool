import { createUserSchema } from '../validations/userValidation';
import { createShiftSchema } from '../validations/shiftValidation';

describe('Validation schemas', () => {
  it('rejects invalid user payload', async () => {
    await expect(
      createUserSchema.parseAsync({ body: { email: 'not-an-email', password: '123', firstName: '', lastName: '' } })
    ).rejects.toBeTruthy();
  });

  it('accepts minimal valid user payload', async () => {
    await expect(
      createUserSchema.parseAsync({ body: { email: 'a@b.com', password: '123456', firstName: 'A', lastName: 'B' } })
    ).resolves.toBeTruthy();
  });

  it('rejects invalid shift payload', async () => {
    await expect(
      createShiftSchema.parseAsync({ body: { title: '', location: '', startTime: 'x', endTime: 'y' } })
    ).rejects.toBeTruthy();
  });
});

