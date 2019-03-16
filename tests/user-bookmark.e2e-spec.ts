import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { OrganizationModule } from '../src/organization/organization.module';
import { SharedModule } from '../src/shared/shared.module';
import { UserModule } from '../src/user/user.module';
import { TestUtility } from './test-utility';
import { TestUsers } from './test-users';
import { UserInputDTO } from '../src/user/user-input.dto';
import { BOType } from '../src/shared/bo-type';
import { UserBookmarkInputDTO } from '../src/user/user-bookmark/user-bookmark-input.dto';
import * as dotenv from 'dotenv';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';

describe('UserBookmarkController (e2e)', () => {
    let app: INestApplication;
    let helper: TestUtility;
    let token: string;
    let currentUser: UserInputDTO;

    beforeAll(async () => {
        console.log('*** SETUP TEST SERVER ***');
        dotenv.config({ path: `${process.env.NODE_ENV}.env` });
        const module = await Test.createTestingModule({
            imports: [
                ConfigModule.load(path.resolve(__dirname, '..', 'src', 'config', '**', '!(*.d).{ts,js}')),
                TypeOrmModule.forRootAsync({
                    useFactory: (config: ConfigService) => config.get('database'),
                    inject: [ConfigService],
                }),
                SharedModule,
                AuthModule,
                UserModule,
                OrganizationModule,
            ],
        })
            .compile();

        app = module.createNestApplication();
        await app.init();

        helper = new TestUtility(request(app.getHttpServer()));
        await helper.createTestOrgs();
        await helper.createTestUsers();
        await helper.createTestUserBookmarks();
        currentUser = TestUsers.find(u => u.id.includes('sales'));
        const credentials = { id: currentUser.id, password: currentUser.password };
        const response = await helper.login(credentials);
        expect(response.status).toBe(HttpStatus.OK);
        token = response.body.token;
    });

    describe('GET /api/userbookmarks/:id', () => {
        it('should return a list of user bookmarks for the logged in user', async () => {
            const id = currentUser.id;
            const response = await helper.get(`/api/userbookmarks/${id}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /api/userbookmarks/:id/:type', () => {
        it('should return a list of user bookmarks for the logged in user and the given type', async () => {
            const id = currentUser.id;
            const type = BOType.RECEIVERS;
            const response = await helper.get(`/api/userbookmarks/${id}/${type}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
        it('should not throw an error - if no user bookmark exists', async () => {
            const id = currentUser.id;
            const type = 'nonsense';
            const response = await helper.get(`/api/userbookmarks/${id}/${type}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toEqual([]);
        });
    });

    describe('GET /api/userbookmarks/:id/:type/:objectId', () => {
        it('should return a single user bookmarks for the logged in user and the given type and objectId', async () => {
            const id = currentUser.id;
            const type = BOType.RECEIVERS;
            const objectId = '1901';
            const response = await helper.get(`/api/userbookmarks/${id}/${type}/${objectId}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toEqual(expect.objectContaining({ id, type, objectId }));
        });
        it('should throw an error - if user bookmark does not exist', async () => {
            const id = currentUser.id;
            const type = 'nonsense';
            const objectId = '1901';
            const response = await helper.get(`/api/userbookmarks/${id}/${type}/${objectId}`, token);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('POST /api/userbookmarks', () => {

        let input: UserBookmarkInputDTO;

        beforeEach(() => {
            input = {
                id: currentUser.id,
                type: BOType.RECEIVERS,
                objectId: '1902',
            };
        });

        it('should create a user bookmark', async () => {
            let response = await helper.post(`/api/userbookmarks`, input, token);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toEqual(expect.objectContaining({ id: input.id }));
            input.type = BOType.ORGANIZATIONS;
            input.objectId = 'THQ';
            response = await helper.post(`/api/userbookmarks`, input, token);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toEqual(expect.objectContaining({ id: input.id }));
        });

        it('should throw an error - if id is missing', async () => {
            delete input.id;
            const response = await helper.post(`/api/userbookmarks`, input, token);
            expect(helper.isOK(response)).toBeFalsy();
        });
        it('should throw an error - if id does not exist', async () => {
            input.id = 'me';
            const response = await helper.post(`/api/userbookmarks`, input, token);
            expect(helper.isOK(response)).toBeFalsy();
        });
        it('should throw an error - if type is missing', async () => {
            delete input.type;
            const response = await helper.post(`/api/userbookmarks`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if objectId is missing', async () => {
            delete input.objectId;
            const response = await helper.post(`/api/userbookmarks`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('DELETE /api/userbookmarks/:id/:type/:objectId', () => {
        it('should delete a user bookmark', async () => {
            const id = currentUser.id;
            const type = BOType.RECEIVERS;
            const objectId = '1902';
            const response = await helper.delete(`/api/userbookmarks/${id}/${type}/${objectId}`, token);
            expect(response.status).toBe(HttpStatus.OK);
        });
        it('should throw an error - if bookmark does not exist', async () => {
            const id = currentUser.id;
            const type = BOType.RECEIVERS;
            const objectId = '1902';
            const response = await helper.delete(`/api/userbookmarks/${id}/${type}/${objectId}`, token);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('DELETE /api/userbookmarks/:id/:type', () => {
        it('should delete all user bookmarks for a given user and type', async () => {
            const id = currentUser.id;
            const type = BOType.RECEIVERS;
            const response = await helper.delete(`/api/userbookmarks/${id}/${type}`, token);
            expect(response.status).toBe(HttpStatus.OK);
        });
        it('should throw an error - if no bookmark exists for user and type', async () => {
            const id = currentUser.id;
            const type = BOType.RECEIVERS;
            const response = await helper.delete(`/api/userbookmarks/${id}/${type}`, token);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('DELETE /api/userbookmarks/:id', () => {
        it('should delete all user bookmarks for the logged in user', async () => {
            const id = currentUser.id;
            const response = await helper.delete(`/api/userbookmarks/${id}`, token);
            expect(response.status).toBe(HttpStatus.OK);
        });
        it('should throw an error - if no bookmark exists for the user', async () => {
            const id = currentUser.id;
            const response = await helper.delete(`/api/userbookmarks/${id}`, token);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
        });
    });

    afterAll(async () => {
        await helper.deleteTestUsers();
        await helper.deleteTestOrgs();
        await app.close();
    });
});
