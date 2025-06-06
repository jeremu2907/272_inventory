export type AccountRecord = {
    id: number;
    userId: number;
    chestId: number;
    itemId: number;
    originalQty: number;
    currentQty: number;
    action: boolean;
    createdAt: string;
}