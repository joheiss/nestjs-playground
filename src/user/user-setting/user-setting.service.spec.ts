import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '../user-profile/user-profile.entity';
import { mockUserProfileRepository } from '../../mocks/mock-user-profile.repository';
import { UserProfileService } from '../user-profile/user-profile.service';
import { BOType } from '../../shared/bo-type';
import { UserSettingService } from './user-setting.service';
import { UserSettingEntity } from './user-setting.entity';
import { mockUserSettingRepository } from '../../mocks/mock-user-setting.repository';
import { UserSettingInputDTO } from './user-setting-input.dto';
import { Role } from '../../auth/role';
import { AuthDTO } from '../../auth/auth.dto';

describe('UserSettingService', () => {
    let service: UserSettingService;
    let repository: Repository<UserSettingEntity>;
    let auth: AuthDTO;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: getRepositoryToken(UserSettingEntity),
                    useValue: mockUserSettingRepository(),
                },
                {
                    provide: getRepositoryToken(UserProfileEntity),
                    useValue: mockUserProfileRepository(),
                },
                UserSettingService,
                UserProfileService,
            ],
        }).compile();

        service = module.get<UserSettingService>(UserSettingService);
        // @ts-ignore
        repository = service.repository;
    });

    beforeEach(() => {
        auth = {
            id: 'tester1@horsti.de',
            orgId: 'THQ',
            roles: [Role.TESTER],
        };
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findByUserId', () => {
        it('should find user setting and return results', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const id = 'tester1@horsti.de';
            await expect(service.findByUserId(auth, id)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
        });
        it('should throw an error - if user is not owner (or super)', async () => {
            const id = 'other@horsti.de';
            await expect(service.findByUserId(auth, id)).rejects.toThrow();
        });
    });

    describe('findByUserIdAndType', () => {
        it('should find user setting by id and type and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const id = 'tester1@horsti.de';
            const type = 'default';
            await expect(service.findByUserIdAndType(auth, id, type)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
        });
        it('should NOT throw an error - if user setting cannot be found', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const id = 'tester1@horsti.de';
            const type = 'notexisting';
            await expect(service.findByUserIdAndType(auth, id, type)).resolves.toBeFalsy();
            await expect(spy1).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        let spy1, spy2, spy3, spy4;
        let id: string, type: string;
        let input: UserSettingInputDTO;
        beforeEach(() => {
            spy1 = jest.spyOn<any, any>(service, 'validateInput');
            spy2 = jest.spyOn(repository, 'find');
            spy3 = jest.spyOn(repository, 'create');
            spy4 = jest.spyOn(repository, 'save');
            id = 'tester1@horsti.de';
            type = BOType.RECEIVERS;
            input = {
                id: 'tester1@horsti.de',
                type: 'invoices',
                listLimit: 15,
                bookmarkExpiration: 100,
            };
        });
        it('should create and save a user setting and return a result', async () => {
            input.type = 'invoices';
            await expect(service.create(auth, input)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).toHaveBeenCalled();
            await expect(spy4).toHaveBeenCalled();
        });
        it('should throw an error - if user setting already exists', async () => {
            input.type = 'default';
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
        });
        it('should throw an error - if user ia not owner (or super)', async () => {
            input.id = 'other@horsti.de';
            await expect(service.create(auth, input)).rejects.toThrow();
        });
        it('should throw an error - if list limit < 0', async () => {
            input.listLimit = -1;
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
        });
        it('should throw an error - if bookmark expiration < 0', async () => {
            input.bookmarkExpiration = -1;
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        let spy1, spy2, spy3, spy4;
        let id: string, type: string;
        let input: UserSettingInputDTO;
        beforeEach(() => {
            spy1 = jest.spyOn<any, any>(service, 'validateInput');
            spy2 = jest.spyOn(repository, 'find');
            spy3 = jest.spyOn(repository, 'create');
            spy4 = jest.spyOn(repository, 'save');
            id = 'tester1@horsti.de';
            type = 'default';
            input = {
                id,
                type,
                listLimit: 15,
                bookmarkExpiration: 100,
            };
        });
        it('should update and save a user setting and return a result', async () => {
            await expect(service.update(auth, input)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).toHaveBeenCalled();
            await expect(spy4).toHaveBeenCalled();
        });
        it('should throw an error - if user setting does not exist', async () => {
            input.type = 'invoices';
            await expect(service.update(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
        });
        it('should throw an error - if list limit < 0', async () => {
            input.listLimit = -1;
            await expect(service.update(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
        });
        it('should throw an error - if bookmark expiration < 0', async () => {
            input.bookmarkExpiration = -1;
            await expect(service.update(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
        });
    });

    describe('deleteByUserId', () => {
        it('should delete user setting and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const spy2 = jest.spyOn(repository, 'remove');
            const id = 'tester1@horsti.de';
            await expect(service.deleteByUserId(auth, id)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
        it('should throw an error - if user is not owner (or super)', async () => {
            const id = 'other@horsti.de';
            await expect(service.deleteByUserId(auth, id)).rejects.toThrow();
        });
    });

    describe('deleteByUserIdAndType', () => {
        it('should delete user setting and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const spy2 = jest.spyOn(repository, 'remove');
            const id = 'tester1@horsti.de';
            const type = BOType.RECEIVERS;
            await expect(service.deleteByUserIdAndType(auth, id, type)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
        it('should throw an error - if user tries to delete default settings (only super can do that)', async () => {
            const id = 'tester1@horsti.de';
            const type = 'default';
            await expect(service.deleteByUserIdAndType(auth, id, type)).rejects.toThrow();
        });
        it('should throw an error - if user setting cannot be found', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const spy2 = jest.spyOn(repository, 'remove');
            const id = 'tester1@horsti.de';
            const type = 'notexisting';
            await expect(service.deleteByUserIdAndType(auth, id, type)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
        });
    });
});
