import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBookmarkService } from './user-bookmark.service';
import { UserBookmarkEntity } from './user-bookmark.entity';
import { mockUserBookmarkRepository } from '../../mocks/mock-user-bookmark.repository';
import { UserProfileEntity } from '../user-profile/user-profile.entity';
import { mockUserProfileRepository } from '../../mocks/mock-user-profile.repository';
import { UserProfileService } from '../user-profile/user-profile.service';
import { BOType } from '../../shared/bo-type';
import { Role } from '../../auth/role';
import { AuthDTO } from '../../auth/auth.dto';

describe('UserBookmarkService', () => {
    let service: UserBookmarkService;
    let repository: Repository<UserBookmarkEntity>;
    let auth: AuthDTO;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: getRepositoryToken(UserBookmarkEntity),
                    useValue: mockUserBookmarkRepository(),
                },
                {
                    provide: getRepositoryToken(UserProfileEntity),
                    useValue: mockUserProfileRepository(),
                },
                UserBookmarkService,
                UserProfileService,
            ],
        }).compile();

        service = module.get<UserBookmarkService>(UserBookmarkService);
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
        it('should find user bookmarks and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const id = 'tester1@horsti.de';
            await expect(service.findByUserId(auth, id)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
        });
        it('should throw an error - if user is not owner (or super)', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const id = 'other@horsti.de';
            await expect(service.findByUserId(auth, id)).rejects.toThrow();
            await expect(spy1).not.toHaveBeenCalled();
        });
    });

    describe('findByUserIdAndType', () => {
        it('should find user bookmarks by idand type and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const id = 'tester1@horsti.de';
            const type = BOType.RECEIVERS;
            await expect(service.findByUserIdAndType(auth, id, type)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
        });
        it('should NOT throw an error - if bookmark cannot be found', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const id = 'tester1@horsti.de';
            const type = 'notexisting';
            await expect(service.findByUserIdAndType(auth, id, type)).resolves.toEqual([]);
            await expect(spy1).toHaveBeenCalled();
        });
    });

    describe('findByUserIdTypeAndObjectId', () => {
        it('should find user bookmarks by id, type and object id and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const id = 'tester1@horsti.de';
            const type = BOType.RECEIVERS;
            const objectId = '1901';
            await expect(service.findByUserIdTypeAndObjectId(auth, id, type, objectId)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
        });
        it('should NOT throw an error - if user bookmarks cannot be found', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const id = 'tester1@horsti.de';
            const type = BOType.RECEIVERS;
            const objectId = '1999';
            await expect(service.findByUserIdTypeAndObjectId(auth, id, type, objectId)).resolves.toBeFalsy();
            await expect(spy1).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        let spy1, spy2, spy3, spy4;
        let id: string, type: string, objectId: string;
        beforeEach(() => {
            spy1 = jest.spyOn<any, any>(service, 'validateInput');
            spy2 = jest.spyOn(repository, 'find');
            spy3 = jest.spyOn(repository, 'create');
            spy4 = jest.spyOn(repository, 'save');
            id = 'tester1@horsti.de';
            type = BOType.RECEIVERS;
            objectId = '1999';
        });
        it('should create and save a user bookmark and return a result', async () => {
            const input = { id, type, objectId: '1999' };
            await expect(service.create(auth, input)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).toHaveBeenCalled();
            await expect(spy4).toHaveBeenCalled();
        });
        it('should throw an error - if user bookmark already exists', async () => {
            const input = { id, type, objectId: '1901' };
            await expect(service.create(auth, input)).rejects.toThrow();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
            await expect(spy3).not.toHaveBeenCalled();
            await expect(spy4).not.toHaveBeenCalled();
        });
        it('should throw an error - if user is not owner (or super)', async () => {
            const input = { id: 'other@horsti.de', type, objectId: '1999' };
            await expect(service.create(auth, input)).rejects.toThrow();
        });
    });

    describe('deleteByUserId', () => {
        it('should delete user bookmarks and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const spy2 = jest.spyOn(repository, 'remove');
            const id = 'tester1@horsti.de';
            await expect(service.deleteByUserId(auth, id)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
        it('should throw an error - if user is not owner (or super)', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const spy2 = jest.spyOn(repository, 'remove');
            const id = 'other@horsti.de';
            await expect(service.deleteByUserId(auth, id)).rejects.toThrow();
            await expect(spy1).not.toHaveBeenCalled();
            await expect(spy2).not.toHaveBeenCalled();
        });
    });

    describe('deleteByUserIdAndType', () => {
        it('should delete user bookmarks and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const spy2 = jest.spyOn(repository, 'remove');
            const id = 'tester1@horsti.de';
            const type = BOType.RECEIVERS;
            await expect(service.deleteByUserIdAndType(auth, id, type)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
        it('should throw an error - if user bookmarks cannot be found', async () => {
            const id = 'tester1@horsti.de';
            const type = 'notexisting';
            await expect(service.deleteByUserIdAndType(auth, id, type)).rejects.toThrow();
        });
    });

    describe('delete', () => {
        it('should delete single user bookmark and return a result', async () => {
            const spy1 = jest.spyOn(repository, 'find');
            const spy2 = jest.spyOn(repository, 'remove');
            const id = 'tester1@horsti.de';
            const type = BOType.RECEIVERS;
            const objectId = '1901';
            await expect(service.delete(auth, id, type, objectId)).resolves.toBeTruthy();
            await expect(spy1).toHaveBeenCalled();
            await expect(spy2).toHaveBeenCalled();
        });
        it('should throw an error - if user bookmarks cannot be found', async () => {
            const id = 'tester1@horsti.de';
            const type = BOType.RECEIVERS;
            const objectId = '1999';
            await expect(service.delete(auth, id, type, objectId)).rejects.toThrow();
        });
    });
});
