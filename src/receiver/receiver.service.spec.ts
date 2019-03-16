import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceiverService } from './receiver.service';
import { ReceiverEntity } from './receiver.entity';
import { OrganizationService } from '../organization/organization.service';
import { mockReceiverRepository } from '../mocks/mock-receiver.repository';
import { mockOrganizationRepository } from '../mocks/mock-organization.repository';
import { OrganizationEntity } from '../organization/organization.entity';
import { UserSettingEntity } from '../user/user-setting/user-setting.entity';
import { mockUserSettingRepository } from '../mocks/mock-user-setting.repository';
import { UserSettingService } from '../user/user-setting/user-setting.service';
import { UserProfileEntity } from '../user/user-profile/user-profile.entity';
import { mockUserProfileRepository } from '../mocks/mock-user-profile.repository';
import { UserProfileService } from '../user/user-profile/user-profile.service';
import { UserBookmarkEntity } from '../user/user-bookmark/user-bookmark.entity';
import { mockUserBookmarkRepository } from '../mocks/mock-user-bookmark.repository';
import { UserBookmarkService } from '../user/user-bookmark/user-bookmark.service';
import { PaginationService } from '../shared/services/pagination.service';
import { ReceiverInputDTO } from './receiver-input.dto';
import { ReceiverStatus } from './receiver-status';
import { Role } from '../auth/role';
import { AuthDTO } from '../auth/auth.dto';

describe('ReceiverService', () => {
    let service: ReceiverService;
    let orgApi: OrganizationService;
    let repository: Repository<ReceiverEntity>;
    let auth: AuthDTO;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: getRepositoryToken(ReceiverEntity),
                    useValue: mockReceiverRepository(),
                },
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
                ReceiverService,
                OrganizationService,
                UserProfileService,
                UserSettingService,
                UserBookmarkService,
                PaginationService,
            ],
        }).compile();

        service = module.get<ReceiverService>(ReceiverService);
        orgApi = module.get<OrganizationService>(OrganizationService);
        // @ts-ignore
        repository = service.repository;
    });

    beforeEach(() => {
        auth = {
            id: 'tester1@horsti.de',
            orgId: 'THQ',
            roles: [Role.SALESUSER],
        };
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should find all receivers for a given organization tree', async () => {
            const spy1 = jest.spyOn(orgApi, 'findTreeIds');
            const spy2 = jest.spyOn(repository, 'createQueryBuilder');
            const page = 1;
            const bookmarkOptions = { first: true, only: false };
            await expect(service.findAll(auth, page, bookmarkOptions)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalledWith(auth.orgId);
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should find receiver for a given organization and return a result', async () => {
            const spy1 = jest.spyOn(orgApi, 'findTreeIds');
            const spy2 = jest.spyOn(repository, 'createQueryBuilder');
            const id = '1901';
            await expect(service.findById(auth, id)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalledWith(auth.orgId);
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        let spy1, spy2, spy6, spy7, spy8;
        let input: ReceiverInputDTO;
        let inputMin: ReceiverInputDTO;

        beforeEach(() => {
            spy1 = jest.spyOn<any, any>(service, 'nextId');
            spy2 = jest.spyOn<any, any>(service, 'exists');
            spy6 = jest.spyOn(repository, 'create');
            spy7 = jest.spyOn(repository, 'save');
            spy8 = jest.spyOn<any, any>(service, 'validateInput');

            input = {
                orgId: auth.orgId,
                status: ReceiverStatus.ACTIVE,
                name: 'Test AG',
                nameAdd: 'Testing is fun',
                country: 'DE',
                postalCode: '77777',
                city: 'Testingen',
                street: 'Testallee 7',
                email: 'info@testag.de',
                phone: '+49 777 7654321',
                fax: '+49 777 7654329',
                webSite: 'https://www.testag.de',
            };

            inputMin = {
                name: 'Neue AG',
                country: 'DE',
            };
        });

        it('should create a receiver for a given organization and return a result', async () => {
            await expect(service.create(auth, inputMin)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalledWith('1911');
            await expect(spy6).toHaveBeenCalled();
            await expect(spy7).toHaveBeenCalled();
        });
        it(`should throw an error - if name is missing`, async () => {
            input.name = undefined;
            await expect(service.create(auth, input)).rejects.toThrow();
        });
        it(`should throw an error - if country is missing`, async () => {
            input.country = undefined;
            await expect(service.create(auth, input)).rejects.toThrow();
        });
        it(`should throw an error - if country is not in ISO format`, async () => {
            input.country = 'Deutschland';
            await expect(service.create(auth, input)).rejects.toThrow();
        });
        it('should throw an error - if status is invalid', async () => {
            input.status = 99;
            await expect(service.create(auth, input)).rejects.toThrow();
        });
        it('should throw an error - if email is invalid', async () => {
            input.email = '*INVALID*';
            await expect(service.create(auth, input)).rejects.toThrow();
        });
        it('should throw an error - if phone is invalid', async () => {
            input.phone = '*INVALID*';
            await expect(service.create(auth, input)).rejects.toThrow();
        });
        it('should throw an error - if fax is invalid', async () => {
            input.fax = '*INVALID*';
            await expect(service.create(auth, input)).rejects.toThrow();
        });
        it('should throw an error - if web site is invalid', async () => {
            input.webSite = 'WRONG://www.testag.de';
            await expect(service.create(auth, input)).rejects.toThrow();
        });
    });

    describe('update', () => {
        let spy1, spy3, spy4, spy5, spy6;
        let id: string;
        let input: ReceiverInputDTO;

        beforeEach(() => {
            spy1 = jest.spyOn(repository, 'findOne');
            spy3 = jest.spyOn(orgApi, 'findTreeIds');
            spy4 = jest.spyOn(repository, 'create');
            spy5 = jest.spyOn(repository, 'save');
            spy6 = jest.spyOn<any, any>(service, 'validateInput');
            id = '1901';
            input = {
                orgId: auth.orgId,
                status: ReceiverStatus.ACTIVE,
                name: 'Test AG',
                nameAdd: 'Testing is fun',
                country: 'DE',
                postalCode: '77777',
                city: 'Testingen',
                street: 'Testallee 7',
                email: 'info@testag.de',
                phone: '+49 777 7654321',
                fax: '+49 777 7654329',
                webSite: 'https://www.testag.de',
            };

        });
        it('should update a receiver return a result - minimum input', async () => {
            const inputMin = {
                nameAdd: '*UPDATED*',
            };
            await expect(service.update(auth, id, inputMin)).resolves.toBeTruthy();
            await expect(spy6).toHaveBeenCalled();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy3).toHaveBeenCalled();
            await expect(spy4).toHaveBeenCalled();
            await expect(spy5).toHaveBeenCalled();
        });
        it('should update a receiver return a result - maximum input', async () => {
            await expect(service.update(auth, id, input)).resolves.toBeTruthy();
            await expect(spy6).toHaveBeenCalled();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy3).toHaveBeenCalled();
            await expect(spy4).toHaveBeenCalled();
            await expect(spy5).toHaveBeenCalled();
        });
        it('should throw an error - for not existing receiver', async () => {
            id = '1911';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
            await expect(spy5).not.toHaveBeenCalled();
        });
        it('should throw an error - for not allowed organization', async () => {
            const otherAuth = { ...auth, orgId: 'TDE' };
            await expect(service.update(otherAuth, id, input)).rejects.toThrow();
        });
        it(`should throw an error - if name is empty`, async () => {
            input.name = '';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it(`should throw an error - if country is empty`, async () => {
            input.country = '';
            await expect(service.update(auth, id, input)).rejects.toThrow();
            await expect(spy6).toHaveBeenCalled();
        });
        it(`should throw an error - if org is empty`, async () => {
            input.orgId = '';
            await expect(service.update(auth, id, input)).rejects.toThrow();
        });
    });

    describe('delete', () => {
        let spy1, spy2, spy3, spy4;

        beforeEach(() => {
            spy1 = jest.spyOn(repository, 'findOne');
            spy2 = jest.spyOn<any, any>(service, 'validateOrg');
            spy3 = jest.spyOn(orgApi, 'findTreeIds');
            spy4 = jest.spyOn(repository, 'remove');
        });
        it('should delete a receiver return a result', async () => {
            const id = '1901';
            await expect(service.delete(auth, id)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalledWith(id, { relations: ['organization'] });
        });
        it('should throw an error - for not existing receiver', async () => {
            const id = '1911';
            await expect(service.delete(auth, id)).rejects.toThrow();
        });
        it('should throw an error - for not allowed organization', async () => {
            const otherAuth = { ...auth, orgId: 'TDE' };
            const id = '1901';
            await expect(service.delete(otherAuth, id)).rejects.toThrow();
        });
    });
});
