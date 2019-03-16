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
import { OrganizationInputDTO } from '../src/organization/organization-input.dto';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ConfigModule, ConfigService } from 'nestjs-config';

describe('OrganizationController (e2e)', () => {
    let app: INestApplication;
    let helper: TestUtility;
    let token: string;

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
        const currentUser = TestUsers.find(u => u.id.includes('admin'));
        const credentials = { id: currentUser.id, password: currentUser.password };
        const response = await helper.login(credentials);
        expect(response.status).toBe(HttpStatus.OK);
        token = response.body.token;
    });

    describe('GET /api/organizations', () => {
        it('should return a list of organizations', async () => {
            const response = await helper.get('/api/organizations', token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/organizations/:id', () => {
        it('should return a single organizations', async () => {
            const orgId = 'TST';
            const response = await helper.get(`/api/organizations/${orgId}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.id).toEqual(orgId);
        });
    });

    describe('GET /api/organizations/:id/tree', () => {
        it('should return an org tree starting at given root', async () => {
            const orgId = 'TST';
            const response = await helper.get(`/api/organizations/${orgId}/tree`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.id).toEqual(orgId);
            expect(response.body.children.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /api/organizations/:id/treeids', () => {
        it('should return a list of org ids in the tree starting at given root', async () => {
            const orgId = 'TST';
            const response = await helper.get(`/api/organizations/${orgId}/treeids`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
            expect(response.body).toEqual(expect.arrayContaining(['TST', 'TSU']));
        });
    });

    describe('POST /api/organizations', () => {
        it('should not allow admin to create an organization at root level', async () => {
            const input: OrganizationInputDTO = {
                id: 'TSV',
                name: 'Test Test',
                timezone: 'Europe/Berlin',
                locale: 'de-DE',
                currency: 'EUR',
            };
            const response = await helper.post(`/api/organizations`, input, token);
            expect(helper.isNotAllowed(response)).toBeTruthy();
        });
        it('should create an organization at child level', async () => {
            const input: OrganizationInputDTO = {
                id: 'TSX',
                name: 'Test Test',
                timezone: 'Europe/Berlin',
                locale: 'de-DE',
                currency: 'EUR',
                parentId: 'TST',
            };
            const response = await helper.post(`/api/organizations`, input, token);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toEqual(expect.objectContaining({ id: input.id }));
        });
        it('should return a list of org ids in the tree containing root and child', async () => {
            const orgId = 'TST';
            const response = await helper.get(`/api/organizations/${orgId}/treeids`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
            expect(response.body).toEqual(expect.arrayContaining(['TST', 'TSX']));
        });
    });

    describe('PUT /api/organizations/:id', () => {
        it('should update an organization', async () => {
            const orgId = 'TSX';
            const input: Partial<OrganizationInputDTO> = {
                name: 'Test *UPDATED*',
            };
            const response = await helper.put(`/api/organizations/${orgId}`, input, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toEqual(expect.objectContaining({ name: input.name }));
        });
    });

    describe('DELETE /api/organizations/:id', () => {
        it('should delete an organization if there are no children assigned to it', async () => {
            const orgId = 'TSX';
            const response = await helper.delete(`/api/organizations/${orgId}`, token);
            expect(response.status).toBe(HttpStatus.OK);
        });
        it('should not allow admin to delete a root organization', async () => {
            const orgId = 'TST';
            const response = await helper.delete(`/api/organizations/${orgId}`, token);
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    afterAll(async () => {
        await helper.deleteTestUsers();
        await helper.deleteTestOrgs();
        await app.close();
    });

})
;
