import { UserInputDTO } from '../src/user/user-input.dto';
import { Role } from '../src/auth/role';

export const TestUsers: UserInputDTO[] = [
    {
        id: 'test-super@horsti-test.de',
        password: `tsup${new Date().toDateString()}`,
        orgId: 'TST',
        roles: [Role.SUPER],
        displayName: 'Super Test',
        email: 'test-super@horsti-test.de',
    },
    {
        id: 'test-admin@horsti-test.de',
        password: `tadm${new Date().toDateString()}`,
        orgId: 'TST',
        roles: [Role.ADMIN],
        displayName: 'Admin Test',
        email: 'test-admin@horsti-test.de',
    },
    {
        id: 'test-sales@horsti-test.de',
        password: `tsls${new Date().toDateString()}`,
        orgId: 'TST',
        roles: [Role.SALESUSER],
        displayName: 'Sales Test',
        email: 'test-sales@horsti-test.de',
    },
    {
        id: 'test-audit@horsti-test.de',
        password: `taud${new Date().toDateString()}`,
        orgId: 'TST',
        roles: [Role.AUDITOR],
        displayName: 'Auditor Test',
        email: 'test-audit@horsti-test.de',
    },
    {
        id: 'test-locked@horsti-test.de',
        password: `tlck${new Date().toDateString()}`,
        orgId: 'TST',
        roles: [Role.SALESUSER],
        displayName: 'Locked Test',
        email: 'test-locked@horsti-test.de',
        locked: true,
    },
    {
        id: 'test-delete@horsti-test.de',
        password: `tdel${new Date().toDateString()}`,
        orgId: 'TST',
        roles: [Role.SALESUSER],
        displayName: 'Delete Test',
        email: 'test-delete@horsti-test.de',
        locked: true,
    },
];
