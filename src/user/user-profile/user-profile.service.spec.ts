import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserProfileEntity } from './user-profile.entity';
import { Repository } from 'typeorm';
import { UserProfileInputDTO } from './user-profile-input.dto';
import { UserProfileService } from './user-profile.service';
import { mockUserProfileRepository } from '../../mocks/mock-user-profile.repository';
import { Role } from '../../auth/role';
import { AuthDTO } from '../../auth/auth.dto';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let repository: Repository<UserProfileEntity>;
  let auth: AuthDTO;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(UserProfileEntity),
          useValue: mockUserProfileRepository(),
        },
        UserProfileService,
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
    // @ts-ignore
    repository = service.repository;
  });

  beforeEach(() => {
      auth = {
          id: 'tester1@horsti.de',
          orgId: 'THQ',
          roles: [ Role.TESTER ],
      };
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should find user profile and return a result', async () => {
      const spy1 = jest.spyOn(repository, 'findOne');
      const id = 'tester1@horsti.de';
      await expect(service.findById(auth, id)).resolves.toBeTruthy();
      await expect(spy1).toHaveBeenCalled();
    });
    it('should throw an error - if user is not owner (or super)', async () => {
      const id = 'other@horsti.de';
      await expect(service.findById(auth, id)).rejects.toThrow();
    });
  });

  describe('update', () => {
    let input: Partial<UserProfileInputDTO>;
    let spy1, spy2, spy3, spy4;
    beforeEach(() => {
      spy1 = jest.spyOn(service, 'validateInput');
      spy2 = jest.spyOn(repository, 'findOne');
      spy3 = jest.spyOn(repository, 'create');
      spy4 = jest.spyOn(repository, 'save');
      input = {
        id: 'tester1@horsti.de',
        displayName: 'Testi Tester1 *UPDATED*',
        email: 'tester1@horsti.de',
        phone: '+49 777 7654321',
        imageUrl: 'https://www.jovisco.de/images/myimage.png',
      };
    });
    it('should update and save a user profile and return a result', async () => {
      await expect(service.update(auth, input)).resolves.toBeTruthy();
      await expect(spy1).toHaveBeenCalled();
      await expect(spy2).toHaveBeenCalled();
      await expect(spy3).toHaveBeenCalled();
      await expect(spy4).toHaveBeenCalled();
    });
    it('should throw an error - if user is not owner (or super)', async () => {
      input.id = 'other@horsti.de';
      await expect(service.update(auth, input)).rejects.toThrow();
    });
    it('should throw an error - if displayName is emtpy', async () => {
      input.displayName = '';
      await expect(service.update(auth, input)).rejects.toThrow();
      await expect(spy1).toHaveBeenCalled();
    });
    it('should throw an error - if email is invalid', async () => {
      input.email = '**INVALID**';
      await expect(service.update(auth, input)).rejects.toThrow();
      await expect(spy1).toHaveBeenCalled();
    });
    it('should throw an error - if phone is invalid', async () => {
      input.phone = '**INVALID**';
      await expect(service.update(auth, input)).rejects.toThrow();
      await expect(spy1).toHaveBeenCalled();
    });
    it('should throw an error - if image url is invalid', async () => {
      input.imageUrl = '**INVALID**';
      await expect(service.update(auth, input)).rejects.toThrow();
      await expect(spy1).toHaveBeenCalled();
    });
  });
});
