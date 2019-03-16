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
import { ReceiverModule } from '../src/receiver/receiver.module';
import { ReceiverInputDTO } from '../src/receiver/receiver-input.dto';
import * as dotenv from 'dotenv';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';

describe('ReceiverController (e2e)', () => {
    let app: INestApplication;
    let helper: TestUtility;
    let token: string;
    let receiverIds: string[];
    let newReceiverId: string;

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
                ReceiverModule,
            ],
        })
            .compile();

        app = module.createNestApplication();
        await app.init();

        helper = new TestUtility(request(app.getHttpServer()));
        await helper.createTestOrgs();
        await helper.createTestUsers();
        receiverIds = [];
        let receiverId = await helper.createTestReceiver(token);
        receiverIds.push(receiverId);
        const currentUser = TestUsers.find(u => u.id.includes('sales'));
        // await helper.changeTestUserOrgAssignment(currentUser.id, 'TST');
        const credentials = { id: currentUser.id, password: currentUser.password };
        const response = await helper.login(credentials);
        expect(response.status).toBe(HttpStatus.OK);
        token = response.body.token;
        receiverId = await helper.createTestReceiver(token);
        receiverIds.push(receiverId);
    });

    describe('GET /api/receivers', () => {
        it('should return a list of receivers - within the users organization tree', async () => {
            const response = await helper.get('/api/receivers', token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/receivers/:id', () => {
        it('should return a single receiver', async () => {
            const id = receiverIds[1];
            const response = await helper.get(`/api/receivers/${id}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.id).toEqual(id);
        });
        it('should not retrieve a receiver from a foreign organization', async () => {
            const id = receiverIds[0];
            const response = await helper.get(`/api/receivers/${id}`, token);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('POST /api/receiver', () => {
        it('should not allow to create a receiver in a foreign organization', async () => {
            const input: ReceiverInputDTO = {
                name: 'Foreign Org Ltd',
                country: 'GB',
                orgId: 'THQ',
            };
            const response = await helper.post(`/api/receivers`, input, token);
            expect(helper.isNotAllowed(response)).toBeTruthy();
        });
        it('should create a receiver within home organization tree', async () => {
            const input: ReceiverInputDTO = {
                name: 'Home Org AG',
                country: 'DE',
                orgId: 'TSU',
            };
            const response = await helper.post(`/api/receivers`, input, token);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toEqual(expect.objectContaining({ name: input.name }));
            newReceiverId = response.body.id;
        });
    });

    describe('PUT /api/receivers/:id', () => {
        it('should update a receiver within home organization tree', async () => {
            const id = receiverIds[1];
            const input: Partial<ReceiverInputDTO> = {
                nameAdd: 'Test Receiver *UPDATED*',
            };
            const response = await helper.put(`/api/receivers/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toEqual(expect.objectContaining({ nameAdd: input.nameAdd }));
        });
        it('should not update a receiver in a foreign organization', async () => {
            const id = receiverIds[0];
            const input: Partial<ReceiverInputDTO> = {
                nameAdd: 'Test Receiver *NOT UPDATED*',
            };
            const response = await helper.put(`/api/receivers/${id}`, input, token);
            expect(helper.isNotAllowed(response)).toBeTruthy();
        });
    });

    describe('DELETE /api/receivers/:id', () => {
        it('should delete a receiver - given no active business transactions are assigned', async () => {
            const id = newReceiverId;
            const response = await helper.delete(`/api/receivers/${id}`, token);
            expect(response.status).toBe(HttpStatus.OK);
        });
        it('should not allow to delete a receiver in a foreign organization', async () => {
            const id = receiverIds[0];
            const response = await helper.delete(`/api/receivers/${id}`, token);
            expect(helper.isNotAllowed(response)).toBeTruthy();
        });
    });

    afterAll(async () => {
        console.log('*** TEAR DOWN TEST SERVER ***');
        await helper.deleteTestReceivers(receiverIds);
        await helper.deleteTestUsers();
        await helper.deleteTestOrgs();
        await app.close();
    });

})
;
