export type Item = {
    id: number;
    chest: number; // Foreign key to Chest
    layer: string; // e.g., "Layer 1", "Layer 2"
    name: string; // e.g., "Item Name"
    nameExt?: string; // e.g., "Item Name (Extended)"
    nsn?: string; // e.g., "NSN 1234-5678"
    qtyTotal: number; // Total quantity of this item in the chest
    qtyReal: number; // Real quantity of this item in the chest
};