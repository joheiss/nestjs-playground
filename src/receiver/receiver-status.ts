export class ReceiverStatus {

    static readonly ACTIVE = 1;
    static readonly INACTIVE = 0;

    static isValid(status: number): boolean {
        return status === ReceiverStatus.ACTIVE || status === ReceiverStatus.INACTIVE;
    }
}
