export class OrganizationStatus {

    static readonly ACTIVE = 1;
    static readonly INACTIVE = 0;

    static isValid(status: number): boolean {
        return status === OrganizationStatus.ACTIVE || status === OrganizationStatus.INACTIVE;
    }
}
