import { Test, TestingModule } from '@nestjs/testing';
import { AuthDTO } from '../../auth/auth.dto';
import { UserBookmarkController } from './user-bookmark.controller';
import { UserBookmarkService } from './user-bookmark.service';
import { mockUserBookmarkService } from '../../mocks/mock-user-bookmark.service';
import { BOType } from '../../shared/bo-type';
import { UserBookmarkInputDTO } from './user-bookmark-input.dto';
import { Role } from '../../auth/role';

describe('User Bookmark Controller', () => {
    let controller: UserBookmarkController;
    let service: UserBookmarkService;
    let auth: AuthDTO;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserBookmarkController],
            providers: [
                { provide: UserBookmarkService, useValue: mockUserBookmarkService() },
            ],
        }).compile();

        controller = module.get<UserBookmarkController>(UserBookmarkController);
        service = module.get<UserBookmarkService>(UserBookmarkService);
    });

    beforeEach(() => {
        auth = {
            id: 'tester1@horsti.de',
            orgId: 'THQ',
            roles: [Role.TESTER],
        };
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('GET /api/userbookmarks/:id/:type/:objectId (getByUserTypeAndObjectId)', () => {
        it('should call user bookmark service findByUserIdTypeAndObjectId and return a bookmark', async () => {
            const spy3 = jest.spyOn(service, 'findByUserIdTypeAndObjectId');
            const id = auth.id;
            const type = BOType.RECEIVERS;
            const objectId = '1901';
            await expect(controller.getByUserTypeAndObjectId(auth, id, type, objectId)).resolves.toBeTruthy();
            await expect(spy3).toHaveBeenCalled();
        });
    });

    describe('GET /api/userbookmarks/:id/:type (getByUserAndType)', () => {
        it('should call user bookmark service findByUserIdAndType and return bookmarks', async () => {
            const spy3 = jest.spyOn(service, 'findByUserIdAndType');
            const id = auth.id;
            const type = BOType.RECEIVERS;
            await expect(controller.getByUserAndType(auth, id, type)).resolves.toBeTruthy();
            await expect(spy3).toHaveBeenCalled();
        });
    });

    describe('GET /api/userbookmarks/:id (getByUserId)', () => {
        it('should call user bookmark service findByUserId and return bookmarks', async () => {
            const spy3 = jest.spyOn(service, 'findByUserId');
            const id = auth.id;
            await expect(controller.getByUserId(auth, id)).resolves.toBeTruthy();
            await expect(spy3).toHaveBeenCalled();
        });
    });

    describe('POST /api/userbookmarks (create)', () => {
        let input: Partial<UserBookmarkInputDTO>;
        beforeEach(() => {
            input = {
                id: 'tester1@horsti.de',
                type: BOType.RECEIVERS,
                objectId: '1902',
            };
        });
        it('should call user bookmark service create and return result', async () => {
            const spy2 = jest.spyOn(service, 'create');
            await expect(controller.create(auth, input)).resolves.toBeTruthy();
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/userbookmarks/:id/:type/:objectId (deleteByUserTypeAndObjectId)', () => {
        let id: string;
        let type: string;
        let objectId: string;
        beforeEach(() => {
            id = 'tester1@horsti.de';
            type = BOType.RECEIVERS;
            objectId = '1901';
        });
        it('should call user bookmark service delete and return result', async () => {
            const spy2 = jest.spyOn(service, 'deleteByUserIdTypeAndObjectId');
            await expect(controller.deleteByUserTypeAndObjectId(auth, id, type, objectId)).resolves.toBeTruthy();
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/userbookmarks/:id/:type/ (deleteByUserIdAndType)', () => {
        let id: string;
        let type: string;
        beforeEach(() => {
            id = 'tester1@horsti.de';
            type = BOType.RECEIVERS;
        });
        it('should call user bookmark service delete and return result', async () => {
            const spy2 = jest.spyOn(service, 'deleteByUserIdAndType');
            await expect(controller.deleteByUserAndType(auth, id, type)).resolves.toBeTruthy();
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/userbookmarks/:id (deleteByUser)', () => {
        let id: string;
        beforeEach(() => {
            id = 'tester1@horsti.de';
        });
        it('should call user bookmark service delete and return result', async () => {
            const spy3 = jest.spyOn(service, 'deleteByUserId');
            await expect(controller.deleteByUserId(auth, id)).resolves.toBeTruthy();
            await expect(spy3).toHaveBeenCalled();
        });
    });
});
