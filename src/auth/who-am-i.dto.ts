import { UserSettingDTO } from '../user/user-setting/user-setting.dto';
import { UserBookmarkDTO } from '../user/user-bookmark/user-bookmark.dto';

export interface WhoAmIDTO {
    readonly id: string;
    readonly orgId: string;
    readonly roles: string[];
    readonly locked?: boolean;
    readonly displayName?: string;
    readonly email?: string;
    readonly phone?: string;
    readonly imageUrl?: string;
    readonly settings?: Array<{ type: string, listLimit: number, bookmarkExpiration: number }>;
    readonly bookmarks?: Array<{ type: string, objectId: string}>;
}
