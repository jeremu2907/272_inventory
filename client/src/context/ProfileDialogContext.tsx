import * as React from 'react';

type ProfileDialogContextType = {
    openDialog: boolean;
    setOpenDialog: (val: boolean) => void;
};

const ProfileDialogContext = React.createContext<ProfileDialogContextType | undefined>(undefined);

export const ProfileDialogProvider = ({ children }: { children: React.ReactNode }) => {
    const [openDialog, setOpenDialog] = React.useState<boolean>(false); // Set default value here

    return (
        <ProfileDialogContext.Provider value={{ openDialog, setOpenDialog }}>
            {children}
        </ProfileDialogContext.Provider>
    );
};

export const useProfileDialog = () => {
    const context = React.useContext(ProfileDialogContext);
    if (!context) {
        throw new Error('useProfileDialog must be used within a ProfileDialogProvider');
    }
    return context;
};
