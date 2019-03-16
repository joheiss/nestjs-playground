export interface UserBookmarkDTO {
    readonly id: string;
    readonly type: string;
    readonly objectId: string;
    readonly objectType: string;
    readonly createdAt?: Date;
}
