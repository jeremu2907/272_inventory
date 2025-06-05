export type User = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    isStaff: boolean;
    rank: "NONE" | "PVT" | "PV2" | "PFC" | "SPC" | "SGT" | "SSG" | "SFC" | "MSG" | "1SG" | "SMG" | "CSM" | "2LT" | "1LT" | "CPT" | "MAJ" | "LTC" | "COL"
}