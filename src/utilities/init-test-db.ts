import { Connection, createConnection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { BOType } from '../shared/bo-type';
import { Role } from '../auth/role';
import { UserSettingEntity } from '../user/user-setting/user-setting.entity';
import { UserProfileEntity } from '../user/user-profile/user-profile.entity';
import { OrganizationEntity } from '../organization/organization.entity';

const connect = async () => {
    const conn = await createConnection('test');
    if (!conn) {
        throw new Error('connection_error');
    }
    return conn;
};

const getUsers = async (conn: Connection) => {
    return await conn.manager.find(UserEntity);
};

const createInitialOrg = async (conn: Connection): Promise<OrganizationEntity> => {
    const initialOrg = {
        id: '$ROOT$',
        objectType: BOType.ORGANIZATIONS,
        name: 'Initial Root',
    };
    const organization = conn.manager.create(OrganizationEntity, initialOrg);
    return await conn.manager.save(organization);

};
const createInitialUser = async (conn: Connection) => {
    const initialUser = {
        id: process.env.INIT_USER,
        password: process.env.INIT_PASSWORD,
        objectType: BOType.USERS,
        orgId: '$ROOT$',
        roles: `${Role.SUPER}, ${Role.ADMIN}, ${Role.SALESUSER}`,
        locked: false,
    };
    const initialProfile = {
        id: process.env.INIT_USER,
        objectType: BOType.USERPROFILES,
        displayName: 'Delete Me Soon',
        email: 'none@none.com',
    };
    const initialSetting = {
        id: process.env.INIT_USER,
        type: 'default',
        objectType: BOType.USERSETTINGS,
        listLimit: 10,
        bookmarkExpiration: 1,
    };
    const organization = await conn.manager.findOne(OrganizationEntity, initialUser.orgId);
    const setting = conn.manager.create(UserSettingEntity, initialSetting);
    const profile = conn.manager.create(UserProfileEntity, {...initialProfile, settings: [setting]});
    const user = conn.manager.create(UserEntity, {...initialUser, profile, organization});
    return await conn.manager.save(user);
};

const createInitialOrgAndUser = async (conn: Connection) => {
    await createInitialOrg(conn);
    await createInitialUser(conn);
};

const run = async () => {
    try {
        const conn = await connect();
        const users = await getUsers(conn);
        if (!users.length) {
            const user = await createInitialOrgAndUser(conn);
            console.log('Initial user created.');
        }
    } catch (ex) {
        console.log(ex);
    }
};

( async () => {
    await run();
})();
