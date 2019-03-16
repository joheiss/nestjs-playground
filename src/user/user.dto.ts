export interface UserDTO {
    readonly id: string;
    readonly objectType?: string;
    readonly orgId?: string;
    readonly roles?: string[];
    readonly token?: string;
}
