export interface ReceiverDTO {
    readonly id?: string;
    readonly objectType?: string;
    readonly orgId: string;
    readonly isDeletable?: boolean;
    readonly status?: number;
    readonly name: string;
    readonly nameAdd?: string;
    readonly country: string;
    readonly postalCode?: string;
    readonly city?: string;
    readonly street?: string;
    readonly email?: string;
    readonly phone?: string;
    readonly fax?: string;
    readonly webSite?: string;
}
