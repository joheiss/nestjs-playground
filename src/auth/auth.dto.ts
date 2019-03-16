export interface AuthDTO {
    readonly id: string;
    readonly orgId: string;
    readonly roles: string[];
    readonly token?: string;
}
