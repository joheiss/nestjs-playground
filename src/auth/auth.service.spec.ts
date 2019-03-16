import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UserEntity } from '../user/user.entity';
import { mockUserRepository } from '../mocks/mock-user.repository';

describe('AuthService', () => {
    let service: AuthService;
    let repository: Repository<UserEntity>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: mockUserRepository(),
                },
                AuthService,
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        // @ts-ignore
        repository = service.repository;
        process.env.SECRET = 'Spaßvögelchen';
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should find user, check password and return auth', async () => {
            const credential = {
                id: 'tester1@horsti.de',
                password: 'Testi123',
            };
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn<any, any>(service, 'isPasswordValid');
            await expect(service.login(credential)).resolves.toEqual(expect.objectContaining({
                id: credential.id,
                locked: false,
                roles: ['tester'],
            }));
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
        it('should find user, check password and throw error', async () => {
            const credential = {
                id: 'tester1@horsti.de',
                password: 'Testi987',
            };
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn<any, any>(service, 'isPasswordValid');
            await expect(service.login(credential)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
        it('should find user and throw error - for locked user', async () => {
            const credential = {
                id: 'tester3@horsti.de',
                password: 'Testi987',
            };
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn<any, any>(service, 'isPasswordValid');
            await expect(service.login(credential)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
        });
        it('should throw an error - for username too short', async () => {
            const credential = {
                id: 'tester',
                password: 'dontknow',
            };
            const spy1 = jest.spyOn<any, any>(service, 'validateInput');
            await expect(service.login(credential)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalledWith(credential);
        });
        it('should throw an error - for password too short', async () => {
            const credential = {
                id: 'tester@horsti.de',
                password: 'unknown',
            };
            const spy1 = jest.spyOn<any, any>(service, 'validateInput');
            await expect(service.login(credential)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalledWith(credential);
        });
    });

    describe('whoAmI', () => {
        it('should find user, user profile, settings and bookmarks and return it', async () => {
            const id = 'tester1@horsti.de';
            const spy = jest.spyOn(repository, 'createQueryBuilder');
            await expect(service.whoAmI(id)).resolves.toEqual(expect.objectContaining({ id }));
            await expect(spy).toHaveBeenCalled();
        });
    });
});
