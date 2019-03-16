import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { OrganizationEntity } from '../organization/organization.entity';
import { mockOrganizationRepository } from '../mocks/mock-organization.repository';
import { UserProfileEntity } from './user-profile/user-profile.entity';
import { mockUserProfileRepository } from '../mocks/mock-user-profile.repository';
import { UserSettingEntity } from './user-setting/user-setting.entity';
import { mockUserSettingRepository } from '../mocks/mock-user-setting.repository';
import { UserBookmarkEntity } from './user-bookmark/user-bookmark.entity';
import { mockUserBookmarkRepository } from '../mocks/mock-user-bookmark.repository';
import { OrganizationService } from '../organization/organization.service';
import { UserProfileService } from './user-profile/user-profile.service';
import { UserSettingService } from './user-setting/user-setting.service';
import { UserBookmarkService } from './user-bookmark/user-bookmark.service';
import { UserEntity } from './user.entity';
import { mockUserRepository } from '../mocks/mock-user.repository';
import { Repository } from 'typeorm';
import { PaginationService } from '../shared/services/pagination.service';
import { UserInputDTO } from './user-input.dto';
import { Role } from '../auth/role';
import { AuthDTO } from '../auth/auth.dto';

describe('UserService', () => {
    let service: UserService;
    let orgApi: OrganizationService;
    let paginationService: PaginationService;
    let repository: Repository<UserEntity>;
    let auth: AuthDTO;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: getRepositoryToken(OrganizationEntity),
                    useValue: mockOrganizationRepository(),
                },
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: mockUserRepository(),
                },
                {
                    provide: getRepositoryToken(UserProfileEntity),
                    useValue: mockUserProfileRepository(),
                },
                {
                    provide: getRepositoryToken(UserSettingEntity),
                    useValue: mockUserSettingRepository(),
                },
                {
                    provide: getRepositoryToken(UserBookmarkEntity),
                    useValue: mockUserBookmarkRepository(),
                },
                UserService,
                OrganizationService,
                UserProfileService,
                UserSettingService,
                UserBookmarkService,
                PaginationService,
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        orgApi = module.get<OrganizationService>(OrganizationService);
        paginationService = module.get<PaginationService>(PaginationService);
        // @ts-ignore
        repository = service.repository;
    });

    beforeEach(() => {
        auth = {
            id: 'tester1@horsti.de',
            orgId: 'THQ',
            roles: [Role.SUPER],
        };
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should find all users', async () => {
            const spy1 = jest.spyOn(paginationService, 'getSkipAndTake');
            const spy2 = jest.spyOn(repository, 'find');
            const page = 1;
            const bookmarkOptions = { first: true, only: false };
            await expect(service.findAll(auth, page, bookmarkOptions)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should find user and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const id = 'tester1@horsti.de';
            await expect(service.findById(auth, id)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
        });
        it('should throw an error - if user cannot be found', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const id = 'notfound@horsti.de';
            await expect(service.findById(auth, id)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        let input: Partial<UserInputDTO>;
        let spy1, spy2, spy3, spy4, spy5, spy6;
        beforeEach(() => {
            spy1 = jest.spyOn(repository, 'findOne');
            spy2 = jest.spyOn(repository, 'create');
            spy3 = jest.spyOn(repository, 'save');
            spy4 = jest.spyOn<any, any>(service, 'initializeSettings');
            spy5 = jest.spyOn<any, any>(service, 'buildUserEntity');
            spy6 = jest.spyOn<any, any>(service, 'validateInput');
            input = {
                id: 'tester9@horsti.de',
                password: 'Hansi123',
                orgId: 'THQ',
                roles: [ Role.TESTER],
                displayName: 'Testi Tester9',
                email: 'tester9@horsti.de',
                phone: '+49 777 7654321',
                imageUrl: 'https://www.jovisco.de/images/myimage.png',
            };
        });
        it('should create and save a user and return a result', async () => {
            await expect(service.create(auth, input)).resolves.toBeTruthy();
            await expect(spy6).toHaveBeenCalled();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy4).toHaveBeenCalled();
            await expect(spy5).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).toHaveBeenCalled();
        });
        it('should throw an error - if user already exists', async () => {
            input.id = 'tester1@horsti.de';
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
            await expect(spy5).not.toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
        });
        it('should throw an error - if id is missing', async () => {
            delete input.id;
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if id is too short', async () => {
            input.id = 'invalid';
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if password is missing', async () => {
            delete input.password;
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if password is too short', async () => {
            input.password = 'invalid';
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if organization is missing', async () => {
            delete input.orgId;
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if organization is emtpy', async () => {
            input.orgId = '';
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if displayName is missing', async () => {
            delete input.displayName;
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if displayName is emtpy', async () => {
            input.displayName = '';
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if email is missing', async () => {
            delete input.email;
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if email is invalid', async () => {
            input.email = '**INVALID**';
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if phone is invalid', async () => {
            input.phone = '**INVALID**';
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it('should throw an error - if image url is invalid', async () => {
            input.imageUrl = '**INVALID**';
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        let input: Partial<UserInputDTO>;
        let id: string;
        let spy1, spy2, spy3, spy4, spy5;
        beforeEach(() => {
            spy1 = jest.spyOn(repository, 'findOne');
            spy2 = jest.spyOn(repository, 'create');
            spy3 = jest.spyOn(repository, 'save');
            spy4 = jest.spyOn(orgApi, 'findById');
            spy5 = jest.spyOn<any, any>(service, 'validateInput');
            id = 'tester1@horsti.de';
            input = {
                password: 'Hansi123',
                orgId: 'THQ',
                roles: ['tester'],
                displayName: 'Testi Tester9',
                email: 'tester1@horsti.de',
                phone: '+49 777 7654321',
                imageUrl: 'https://www.jovisco.de/images/myimage.png',
            };
        });
        it('should update and save a user and return a result', async () => {
            await expect(service.update(auth, id, input)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy4).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).toHaveBeenCalled();
        });
        it('should throw an error - if user does not exists', async () => {
            id = 'tester9@horsti.de';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
        });
        it('should throw an error - if organization is not valid', async () => {
            input.orgId = '**INVALID**';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy4).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
        });
        it('should throw an error - if password is too short', async () => {
            input.password = 'invalid';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy5).toHaveBeenCalled();
        });
        it('should throw an error - if organization is emtpy', async () => {
            input.orgId = '';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy5).toHaveBeenCalled();
        });
        it('should throw an error - if displayName is emtpy', async () => {
            input.displayName = '';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy5).toHaveBeenCalled();
        });
        it('should throw an error - if email is invalid', async () => {
            input.email = '';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy5).toHaveBeenCalled();
        });
        it('should throw an error - if phone is invalid', async () => {
            input.phone = '**INVALID**';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy5).toHaveBeenCalled();
        });
        it('should throw an error - if image url is invalid', async () => {
            input.imageUrl = '**INVALID**';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy5).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        let spy1, spy2;
        beforeEach(() => {
            spy1 = jest.spyOn(repository, 'findOne');
            spy2 = jest.spyOn(repository, 'remove');
        });
        it('should delete a user and return a result', async () => {
            const id = 'tester1@horsti.de';
            await expect(service.delete(auth, id)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
        it('should throw an error - if user does not exists', async () => {
            const id = 'tester9@horsti.de';
            await expect(service.delete(auth, id)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
        });
    });
});
