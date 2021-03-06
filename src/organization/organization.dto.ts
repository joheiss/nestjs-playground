export interface OrganizationDTO {
    id: string;
    objectType?: string;
    status?: number;
    isDeletable?: boolean;
    name: string;
    timezone?: string;
    currency?: string;
    locale?: string;
    parentId?: string;
    children?: OrganizationDTO[];
}
