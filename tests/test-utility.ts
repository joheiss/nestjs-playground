import { AuthInputDTO } from '../src/auth/auth-input.dto';
import { HttpStatus } from '@nestjs/common';
import { TestUsers } from './test-users';
import * as dotenv from 'dotenv';
import { OrganizationInputDTO } from '../src/organization/organization-input.dto';
import { ReceiverInputDTO } from '../src/receiver/receiver-input.dto';
import { UserBookmarkInputDTO } from '../src/user/user-bookmark/user-bookmark-input.dto';
import { BOType } from '../src/shared/bo-type';

export class TestUtility {

    private readonly credentials: AuthInputDTO;
    private receiverId: string;

    constructor(private server: any) {
        dotenv.config();
        this.credentials = {
            id: process.env.TEST_USER,
            password: process.env.TEST_PASSWORD,
        };
    }

    isAllowed(response: any): boolean {
        return response.status !== HttpStatus.UNAUTHORIZED && response.status !== HttpStatus.FORBIDDEN;
    }

    isNotAllowed(response: any): boolean {
        return !this.isAllowed(response);
    }

    isOK(response: any): boolean {
        return response.status === HttpStatus.OK || response.status === HttpStatus.CREATED;
    }

    delete(url: string, token: string): Promise<any> {
        return this.server
            .delete(url)
            .set('Authorization', `Bearer ${token}`);
    }

    get(url: string, token: string): Promise<any> {
        return this.server
            .get(url)
            .set('Authorization', `Bearer ${token}`);
    }

    login(credentials: AuthInputDTO): Promise<any> {
        return this.server
            .post('/api/login')
            .send(credentials);
    }

    post(url: string, payload: any, token: string): Promise<any> {
        return this.server
            .post(url)
            .send(payload)
            .set('Authorization', `Bearer ${token}`);
    }

    put(url: string, payload: any, token: string): Promise<any> {
        return this.server
            .put(url)
            .send(payload)
            .set('Authorization', `Bearer ${token}`);
    }

    async createTestUsers(): Promise<void> {
        console.log('credentials: ', this.credentials);
        const response = await this.login(this.credentials);
        const token = response.body.token;
        for (const u of TestUsers) {
            const res = await this.post('/api/users', u, token);
        }
    }

    async changeTestUserOrgAssignment(userId, orgId): Promise<void> {
        let response = await this.login(this.credentials);
        const token = response.body.token;
        response = await this.put(`/api/users/${userId}`, { orgId }, token);
        expect(response.status).toBe(HttpStatus.OK);
    }

    async deleteTestUsers(): Promise<void> {
        const response = await this.login(this.credentials);
        const token = response.body.token;
        for (const u of TestUsers) {
            await this.delete(`/api/users/${u.id}`, token);
        }
    }

    async createTestUserBookmarks(): Promise<void> {
        const userId = TestUsers.find(u => u.id.includes('sales')).id;
        const bookmark: UserBookmarkInputDTO = {
            id: userId,
            type: BOType.RECEIVERS,
            objectId: '1901',
        };
        const response = await this.login(this.credentials);
        const token = response.body.token;
        await this.post(`/api/userbookmarks`, bookmark, token);
    }

    async deleteTestUserBookmarks(): Promise<void> {
        const userId = TestUsers.find(u => u.id.includes('sales')).id;
        const response = await this.login(this.credentials);
        const token = response.body.token;
        await this.delete(`/api/userbookmarks/${userId}`, token);
    }

    async createTestOrgs(): Promise<void> {
        const response = await this.login(this.credentials);
        const token = response.body.token;
        const input: OrganizationInputDTO = {
            id: 'TST',
            name: 'Test Root',
            timezone: 'Europe/Berlin',
            locale: 'de-DE',
            currency: 'EUR',
        };
        await this.post(`/api/organizations`, input, token);
        input.id = 'TSU';
        input.name = 'Test Child';
        input.parentId = 'TST';
        await this.post(`/api/organizations`, input, token);
    }

    async deleteTestOrgs(): Promise<void> {
        const orgIds = ['TSX', 'TSU', 'TSV', 'TST'];
        const response = await this.login(this.credentials);
        const token = response.body.token;
        for (const o of orgIds) {
            const res = await this.delete(`/api/organizations/${o}`, token);
            console.log('delete org: ', o, res.status);
        }
    }

    async createTestReceiver(token?: string): Promise<string> {
        const input: ReceiverInputDTO = {
            name: 'Test Receiver',
            country: 'DE',
        };
        let response;
        if (!token) {
            response = await this.login(this.credentials);
            token = response.body.token;
        }
        response = await this.post(`/api/receivers`, input, token);
        expect(response.status).toBe(HttpStatus.CREATED);
        this.receiverId = response.body.id;
        return this.receiverId;
    }

    async deleteTestReceivers(receiverIds: string[], token?: string): Promise<void> {
        console.log('Test Receivers: ', receiverIds);
        let response;
        if (!token) {
            response = await this.login(this.credentials);
            token = response.body.token;
        }
        for (const r of receiverIds) {
            const res = await this.delete(`/api/receivers/${r}`, token);
            console.log('delete receiver: ', r, res.status);
        }
    }
}