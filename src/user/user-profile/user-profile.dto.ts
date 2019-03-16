export interface UserProfileDTO {
    readonly id: string;
    readonly objectType?: string;
    readonly displayName?: string;
    readonly email?: string;
    readonly phone?: string;
    readonly imageUrl?: string;
}
