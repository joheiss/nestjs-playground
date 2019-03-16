import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockOrganizationRepository } from '../mocks/mock-organization.repository';
import { Repository } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { OrganizationService } from './organization.service';
import { UserSettingEntity } from '../user/user-setting/user-setting.entity';
import { mockUserSettingRepository } from '../mocks/mock-user-setting.repository';
import { UserSettingService } from '../user/user-setting/user-setting.service';
import { UserProfileService } from '../user/user-profile/user-profile.service';
import { UserProfileEntity } from '../user/user-profile/user-profile.entity';
import { mockUserProfileRepository } from '../mocks/mock-user-profile.repository';
import { UserBookmarkEntity } from '../user/user-bookmark/user-bookmark.entity';
import { mockUserBookmarkRepository } from '../mocks/mock-user-bookmark.repository';
import { UserBookmarkService } from '../user/user-bookmark/user-bookmark.service';
import { PaginationService } from '../shared/services/pagination.service';
import { OrganizationInputDTO } from './organization-input.dto';
import { AuthDTO } from '../auth/auth.dto';
import { Role } from '../auth/role';

describe('OrganizationService', () => {
    let service: OrganizationService;
    let repository: Repository<OrganizationEntity>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: getRepositoryToken(OrganizationEntity),
                    useValue: mockOrganizationRepository(),
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
                OrganizationService,
                UserProfileService,
                UserSettingService,
                UserBookmarkService,
                PaginationService,
            ],
        }).compile();

        service = module.get<OrganizationService>(OrganizationService);
        // @ts-ignore
        repository = service.repository;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should call repository find', async () => {
            const spy = jest.spyOn<any, any>(repository, 'find');
            const auth = { id: 'tester1@horsti.de', orgId: 'THQ', roles: ['super'] };
            const page = 1;
            const bookmarkOptions = { first: true, only: false };
            await expect(service.findAll(auth, page, bookmarkOptions)).resolves.toBeTruthy();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should find organization and return a result', async () => {
            const spy = jest.spyOn<any, any>(repository, 'findOne');
            await expect(service.findById('THQ')).resolves.toBeTruthy();
            await expect(spy).toHaveBeenCalled();
        });
        it('should throw an error - if organization does not exist', async () => {
            const spy = jest.spyOn<any, any>(repository, 'findOne');
            await expect(service.findById('XXX')).rejects.toThrow();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('findTree', () => {
        it('should find organization and return an organization tree', async () => {
            const spy1 = jest.spyOn<any, any>(repository, 'findOne');
            const spy2 = jest.spyOn<any, any>(repository.manager, 'findDescendantsTree');
            await expect(service.findTree('THQ')).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalledWith('THQ');
            await expect(spy2).toHaveBeenCalled();
        });
        it('should throw an error - if provided organization node does not exist', async () => {
            const spy = jest.spyOn<any, any>(repository, 'findOne');
            await expect(service.findTree('XXX')).rejects.toThrow();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('findTreeIds', () => {
        it('should find organization tree and flatten it to array of ids', async () => {
            const spy1 = jest.spyOn(service, 'findTree');
            const spy2 = jest.spyOn<any, any>(service, 'flattenTree');
            await expect(service.findTreeIds('THQ')).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalledWith('THQ');
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        let auth: AuthDTO;

        beforeEach(() => {
            auth = {
                id: 'test-super@horsti-test.de',
                orgId: 'THQ',
                roles: [Role.SUPER, Role.ADMIN, Role.SALESUSER],
            };
        });

        it('should find, create, save an organization and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn(repository, 'create');
            const spy3 = jest.spyOn(repository, 'save');
            const input = { id: 'NEW', name: 'Test New', timezone: 'Europe/Berlin', currency: 'EUR', locale: 'de-DE', parentId: 'TEU' };
            await expect(service.create(auth, input)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalledWith('NEW');
            await expect(spy1).toHaveBeenCalledWith('TEU');
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).toHaveBeenCalled();
        });
        it('should throw an error - if organization already exists', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn(repository, 'create');
            const spy3 = jest.spyOn(repository, 'save');
            const input = { id: 'THQ', name: 'Test HQ', timezone: 'Europe/Berlin', currency: 'EUR', locale: 'de-DE', parentId: 'ANY' };
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalledWith('THQ');
            await expect(spy2).not.toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
        });
        it('should throw an error - if id is missing', async () => {
            const spy = jest.spyOn<any, any>(service, 'validateInput');
            const input: Partial<OrganizationInputDTO> = {
                name: 'Test HQ',
                timezone: 'Europe/Berlin',
                currency: 'EUR',
                locale: 'de-DE',
            };
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy).toHaveBeenCalled();
        });
        it('should throw an error - if name is missing', async () => {
            const spy = jest.spyOn<any, any>(service, 'validateInput');
            const input: Partial<OrganizationInputDTO> = {
                id: 'THQ',
                timezone: 'Europe/Berlin',
                currency: 'EUR',
                locale: 'de-DE',
            };
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy).toHaveBeenCalled();
        });
        it('should throw an error and not call OrganizationService.create if name is empty', async () => {
            const spy = jest.spyOn<any, any>(service, 'validateInput');
            const input: Partial<OrganizationInputDTO> = {
                id: 'THQ',
                name: '',
                timezone: 'Europe/Berlin',
                currency: 'EUR',
                locale: 'de-DE',
            };
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('update', () => {

        let auth: AuthDTO;

        beforeEach(() => {
            auth = {
                id: 'test-super@horsti-test.de',
                orgId: 'THQ',
                roles: [Role.SUPER, Role.ADMIN, Role.SALESUSER],
            };
        });

        it('should find, update, save an organization and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn<any, any>(service, 'validateParent');
            const spy3 = jest.spyOn(repository, 'create');
            const spy4 = jest.spyOn(repository, 'save');
            const input = { id: 'TDE', name: 'Test DE *UPDATED*', timezone: 'Europe/Berlin', currency: 'EUR', locale: 'de-DE', parentId: 'THQ' };
            await expect(service.update(auth, input)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalledWith('TDE');
            await expect(spy2).toHaveBeenCalledWith('TDE', 'THQ');
            await expect(spy3).toHaveBeenCalled();
            await expect(spy4).toHaveBeenCalled();
        });
        it('should throw an error - if organization does not exist', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn<any, any>(service, 'validateParent');
            const spy3 = jest.spyOn(repository, 'create');
            const spy4 = jest.spyOn(repository, 'save');
            const input = { id: 'XXX', name: 'Test HQ', timezone: 'Europe/Berlin', currency: 'EUR', locale: 'de-DE', parentId: 'TEU' };
            await expect(service.update(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalledWith('XXX');
            await expect(spy2).not.toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
        });
        it('should throw an error - if parent organization does not exist', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn<any, any>(service, 'validateParent');
            const spy3 = jest.spyOn(repository, 'create');
            const spy4 = jest.spyOn(repository, 'save');
            const input = { id: 'THQ', name: 'Test HQ', timezone: 'Europe/Berlin', currency: 'EUR', locale: 'de-DE', parentId: 'XXX' };
            await expect(service.update(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalledWith('THQ');
            await expect(spy1).toHaveBeenCalledWith('XXX');
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
        });
        it('should throw an error- if id is empty', async () => {
            const spy = jest.spyOn<any, any>(service, 'validateInput');
            const input: Partial<OrganizationInputDTO> = {
                id: '',
                name: 'Test HQ *UPDATED*',
            };
            await expect(service.update(auth, input)).rejects.toThrow();
            await expect(spy).toHaveBeenCalled();
        });
        it('should throw an error - if name is empty', async () => {
            const spy = jest.spyOn<any, any>(service, 'validateInput');
            const input: Partial<OrganizationInputDTO> = {
                id: 'THQ',
                name: '',
            };
            await expect(service.update(auth, input)).rejects.toThrow();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('delete', () => {

        let auth: AuthDTO;

        beforeEach(() => {
            auth = {
                id: 'test-super@horsti-test.de',
                orgId: 'THQ',
                roles: [Role.SUPER, Role.ADMIN, Role.SALESUSER],
            };
        });

        it('should find and remove an organization and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn(repository, 'remove');
            await expect(service.delete(auth, 'TDE')).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
        it('should throw an error - if organization does not exist', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn(repository, 'remove');
            await expect(service.delete(auth, 'XXX')).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
        });
        it('should throw an error - if organization has relations or children', async () => {
            const spy1 = jest.spyOn(repository, 'findOne');
            const spy2 = jest.spyOn(repository, 'remove');
            await expect(service.delete(auth, 'TEU')).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
        });
    });
});
