import { AuthDTO } from './auth.dto';

export class Role {

    static readonly SUPER = 'super';
    static readonly ADMIN = 'admin';
    static readonly SALESUSER = 'slsusr';
    static readonly TESTER = 'tester';
    static readonly AUDITOR = 'auditor';

    static isAdmin(auth: AuthDTO): boolean {
        return auth.roles.some(role => role === Role.ADMIN || role === Role.SUPER);
    }

    static isOwner(id: string, userId: string): boolean {
        return (id === userId);
    }

    static isSuper(auth: AuthDTO): boolean {
        return auth.roles.some(role => role === Role.SUPER);
    }

}
