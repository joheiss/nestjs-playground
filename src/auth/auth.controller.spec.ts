import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { mockAuthService } from '../mocks/mock-auth.service';

describe('Auth Controller', () => {
    let controller: AuthController;
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: mockAuthService() },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('POST /api/login (login)', () => {
        it('should call login and return auth object - for successful login', async () => {
            const credential = {
                id: 'tester@horsti.de',
                password: 'onlytesting',
            };
            const spy1 = jest.spyOn(service, 'login');
            await expect(controller.login(credential)).resolves.toEqual(expect.objectContaining({
                id: credential.id,
                locked: false,
                roles: ['tester'],
                organization: 'THQ',
            }));
            await expect(spy1).toHaveBeenCalledWith(credential);
        });
        it('should throw an error - for unsuccessful login', async () => {
            const credential = {
                id: 'tester@horsti.de',
                password: 'dontknown',
            };
            const spy1 = jest.spyOn(service, 'login');
            await expect(controller.login(credential)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalledWith(credential);
        });
    });

    describe('GET /api/whoami (whoAmI)', () => {
        it('should call whoAmI and return a result', async () => {
            const spy1 = jest.spyOn(service, 'whoAmI');
            const id = 'tester@horsti.de';
            await expect(controller.whoAmI(id)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalledWith(id);
        });
    });
});
