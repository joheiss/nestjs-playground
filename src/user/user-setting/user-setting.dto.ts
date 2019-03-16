export interface UserSettingDTO {
    readonly id: string;
    readonly type: string;
    readonly objectType?: string;
    readonly listLimit?: number;
    readonly bookmarkExpiration?: number;
}
