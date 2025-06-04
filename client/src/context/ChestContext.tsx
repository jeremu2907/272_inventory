import * as React from 'react';
import type { Chest } from '@/types/Chest';

type ChestContextType = {
    chest: Chest | null;
    setChest: (chest: Chest | null) => void;
};

const ChestContext = React.createContext<ChestContextType | undefined>(undefined);

export const ChestProvider = ({ children }: { children: React.ReactNode }) => {
    const [chest, setChest] = React.useState<Chest | null>(null); // Set default value here

    return (
        <ChestContext.Provider value={{ chest, setChest }}>
            {children}
        </ChestContext.Provider>
    );
};

export const useChest = () => {
    const context = React.useContext(ChestContext);
    if (!context) {
        throw new Error('useChest must be used within a ChestProvider');
    }
    return context;
};
