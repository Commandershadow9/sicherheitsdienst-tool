import request from 'supertest';
import app from '../app';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

describe('Absence Conflicts Integration Tests', () => {
  let managerToken: string;
  let employeeToken: string;
  let employeeId: string;
  let shiftId: string;

  beforeAll(async () => {
    // Create test manager
    const hashedPassword = await bcrypt.hash('password123', 10);
    const manager = await prisma.user.create({
      data: {
        email: 'manager-conflicts@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Manager',
        role: 'MANAGER',
      },
    });

    // Create test employee
    const employee = await prisma.user.create({
      data: {
        email: 'employee-conflicts@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Employee',
        role: 'EMPLOYEE',
      },
    });
    employeeId = employee.id;

    // Login as manager
    const managerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager-conflicts@test.com', password: 'password123' });
    managerToken = managerLoginRes.body.accessToken;

    // Login as employee
    const employeeLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee-conflicts@test.com', password: 'password123' });
    employeeToken = employeeLoginRes.body.accessToken;

    // Create a test site
    const site = await prisma.site.create({
      data: {
        name: 'Test Site Conflicts',
        address: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
      },
    });

    // Create a test shift
    const shift = await prisma.shift.create({
      data: {
        siteId: site.id,
        title: 'Test Shift',
        location: 'Test Location',
        startTime: new Date('2025-12-01T08:00:00Z'),
        endTime: new Date('2025-12-01T16:00:00Z'),
        requiredEmployees: 1,
      },
    });
    shiftId = shift.id;

    // Assign employee to shift
    await prisma.shiftAssignment.create({
      data: {
        userId: employeeId,
        shiftId: shift.id,
        status: 'ASSIGNED',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.shiftAssignment.deleteMany({ where: { userId: employeeId } });
    await prisma.shift.deleteMany({ where: { title: 'Test Shift' } });
    await prisma.site.deleteMany({ where: { name: 'Test Site Conflicts' } });
    await prisma.absence.deleteMany({
      where: { user: { email: { in: ['employee-conflicts@test.com'] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['manager-conflicts@test.com', 'employee-conflicts@test.com'] } },
    });
  });

  it('should return conflicts when creating absence overlapping with shift', async () => {
    const res = await request(app)
      .post('/api/absences')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'VACATION',
        startsAt: '2025-12-01',
        endsAt: '2025-12-01',
        reason: 'Personal vacation',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.conflicts).toBeDefined();
    expect(res.body.conflicts).toHaveLength(1);
    expect(res.body.conflicts[0].id).toBe(shiftId);
  });

  it('should not return conflicts when absence does not overlap', async () => {
    const res = await request(app)
      .post('/api/absences')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'VACATION',
        startsAt: '2025-12-10',
        endsAt: '2025-12-12',
        reason: 'No overlap vacation',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.conflicts).toBeDefined();
    expect(res.body.conflicts).toHaveLength(0);
  });

  it('should allow manager to create absence with conflicts for employee', async () => {
    const res = await request(app)
      .post('/api/absences')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        userId: employeeId,
        type: 'SPECIAL_LEAVE',
        startsAt: '2025-12-01',
        endsAt: '2025-12-01',
        reason: 'Manager approved special leave',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(employeeId);
    expect(res.body.conflicts).toHaveLength(1);
  });

  it('should auto-approve sickness absence even with conflicts', async () => {
    const res = await request(app)
      .post('/api/absences')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'SICKNESS',
        startsAt: '2025-12-01',
        endsAt: '2025-12-01',
        reason: 'Sick leave',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.conflicts).toHaveLength(1);
  });
});
