import { Repository } from 'typeorm';
import { BOType } from '../shared/bo-type';
import { UserSettingEntity } from '../user/user-setting/user-setting.entity';

const toDTO = jest.fn(() => ({ id: 'ANY', name: 'Anything' }));

export const mockUserSettingRepository = (): any => {
    const settings = mockUserSettingData();
    return {
        create: jest.fn(async (setting) => {
            return {
                ...setting,
                objectType: BOType.USERSETTINGS,
                createdAt: Date.now(),
                changedAt: Date.now(),
                toDTO,
            };
        }),
        find: jest.fn(async (options: any) => {
            const id = options.where.id;
            const type = options.where.type;
            if (type) {
                return await settings.filter(b => b.id === id && b.type === type);
            }
            return await settings.filter(b => b.id === id);
        }),
        remove: jest.fn(async (entity) => entity),
        save: jest.fn(async (entity) => entity),
    } as unknown as Repository<UserSettingEntity>;
};

export const mockUserSettingData = (): UserSettingEntity[] => {
    const today = new Date();
    let id: string = 'tester1@horsti.de';
    const tester1: UserSettingEntity = {
        id,
        type: 'default',
        objectType: BOType.USERSETTINGS,
        listLimit: 10,
        bookmarkExpiration: 90,
        createdAt: today,
        changedAt: today,
        profile: undefined,
        toDTO: jest.fn(() => ({ id: this.id, type: this.type, listLimit: this.listLimit, bookmarkExpiration: this.bookmarkExpiration })),
        toShortDTO: jest.fn(() => ({ type: this.type, listLimit: this.listLimit, bookmarkExpiration: this.bookmarkExpiration })),
    };
    id = 'tester2@horsti.de';
    const tester2 = { ...tester1, id, profile: undefined } as UserSettingEntity;
    // profile = mockUserProfileData().find(p => p.id === id);
    id = 'tester3@horsti.de';
    // profile = mockUserProfileData().find(p => p.id === id);
    const tester3 = { ...tester1, id, profile: undefined } as UserSettingEntity;
    const type = BOType.RECEIVERS;
    // profile = mockUserProfileData().find(p => p.id === id);
    const tester4 = { ...tester1, type, profile: undefined } as UserSettingEntity;
    const data = [tester1, tester2, tester3, tester4];
    return data;
};
