import { AuthInputDTO } from '../auth/auth-input.dto';

export const mockAuthService = (): any => {
    return {
        login: jest.fn(async (credential: AuthInputDTO) => {
            if (credential.id === 'tester@horsti.de' && credential.password === 'onlytesting') {
                return {
                    id: credential.id,
                    locked: false,
                    roles: ['tester'],
                    organization: 'THQ',
                    token: 'anything goes',
                };
            } else {
                throw new Error('login_failed');
            }
        }),
        whoAmI: jest.fn(async () => true ),
    };
};
