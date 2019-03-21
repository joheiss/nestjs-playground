export interface UserDTO {
    readonly id: string;
    readonly objectType?: string;
    readonly orgId?: string;
    readonly roles?: string[];
    readonly locked?: boolean;
    readonly token?: string;
}
