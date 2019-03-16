import { Test, TestingModule } from '@nestjs/testing';
import { ReceiverController } from './receiver.controller';
import { ReceiverService } from './receiver.service';
import { mockReceiverService } from '../mocks/mock-receiver.service';
import { ReceiverInputDTO } from './receiver-input.dto';
import { ReceiverStatus } from './receiver-status';

describe('Receiver Controller', () => {
  let controller: ReceiverController;
  let service: ReceiverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: ReceiverService, useValue: mockReceiverService() },
      ],
      controllers: [ReceiverController],
    }).compile();

    controller = module.get<ReceiverController>(ReceiverController);
    service = module.get<ReceiverService>(ReceiverService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/receivers (getAll)', () => {
    it('should find all receivers for a given organization and return them', async () => {
      const spy = jest.spyOn(service, 'findAll');
      const auth = { id: 'tester1@horsti.de', orgId: 'THQ', roles: ['super'] };
      const page = 1;
      const bookmarkOptions = 'first';
      await expect(controller.getAll(auth, page, bookmarkOptions)).resolves.toBeTruthy();
      await expect(spy).toHaveBeenCalledWith(auth, page, bookmarkOptions);
    });
  });

  describe('GET /api/receivers/:id (getOne)', () => {
    it('should find the requested receivers for a given organization and return them', async () => {
      const spy = jest.spyOn(service, 'findById');
      const orgId = 'THQ';
      const id = '1901';
      await expect(controller.getOne(orgId, id)).resolves.toBeTruthy();
      await expect(spy).toHaveBeenCalledWith(orgId, id);
    });
  });

  describe('POST /api/receivers (create)', () => {
    let orgId: string;
    let spy1;
    beforeEach(() => {
      orgId = 'THQ';
      spy1 = jest.spyOn(service, 'create');
    });
    it('should create a receiver for a given organization and return it - with minimal input', async () => {
      const input: ReceiverInputDTO = {
        orgId,
        name: 'Test AG',
        country: 'DE',
      };
      await expect(controller.create(orgId, input)).resolves.toBeTruthy();
      await expect(spy1).toHaveBeenCalledWith(orgId, input);
    });
    it('should create a receiver for a given organization and return it - with maximum input', async () => {
      const input: ReceiverInputDTO = {
        orgId,
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
      await expect(controller.create(orgId, input)).resolves.toBeTruthy();
      await expect(spy1).toHaveBeenCalledWith(orgId, input);
    });
    it(`should create a receiver for the user's organization and return it`, async () => {
      const input: ReceiverInputDTO = {
        name: 'Test AG',
        country: 'DE',
      };
      await expect(controller.create(orgId, input)).resolves.toBeTruthy();
      await expect(spy1).toHaveBeenCalledWith(orgId, input);
    });
  });

  describe('PUT /api/receivers/:id (update)', () => {
    let orgId: string;
    let id: string;
    let spy1;
    beforeEach(() => {
      orgId = 'THQ';
      id = '1901';
      spy1 = jest.spyOn(service, 'update');
    });
    it('should update a receiver and return it', async () => {
      const input: ReceiverInputDTO = {
        orgId,
        status: ReceiverStatus.INACTIVE,
        name: 'Test AG *UPDATED',
        nameAdd: 'Testing is fun *UPDATED*',
        country: 'AT',
        postalCode: '7777',
        city: 'Testingen *UPDATED*',
        street: 'Testallee 7 *UPDATED*',
        email: 'updated@testag.de',
        phone: '+43 777 7654321',
        fax: '+43 777 7654329',
        webSite: 'https://www.testag.at',
      };
      await expect(controller.update(orgId, id, input)).resolves.toBeTruthy();
      await expect(spy1).toHaveBeenCalledWith(orgId, id, input);
    });
  });

  describe('DELETE /api/receivers/:id (delete)', () => {
    it('should delete a receiver and return it - with minimal input', async () => {
      const spy = jest.spyOn(service, 'delete');
      const orgId = 'THQ';
      const id = '1901';
      await expect(controller.delete(orgId, id)).resolves.toBeTruthy();
      await expect(spy).toHaveBeenCalledWith(orgId, id);
    });
  });
});
