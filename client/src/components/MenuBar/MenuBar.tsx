import UserIcon from '@/assets/user.svg';
import { AxiosAuthInstance } from "@/axios/AxiosAuthInstance";
import AxiosInstance from "@/axios/AxiosInstance";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProfileDialog } from "@/context/ProfileDialogContext";
import { useUser } from "@/context/UserContext";
import { accessTokenSet, refreshTokenSet } from "@/lib/utils";
import type { User } from "@/types/User";
import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Home from "@/assets/home.svg"

export default function MenuBar() {
    const { user, setUser } = useUser();
    const { openDialog, setOpenDialog } = useProfileDialog();

    const [lastName, setLastName] = useState("");
    const [last4, setLast4] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const onChangeLastName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLastName(e.target.value);
    };

    const onChangeLast4 = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only digits
        if (!/^\d*$/.test(e.target.value)) {
            console.warn("Input must contain digits only.");
            return;
        }
        if (e.target.value.length > 4) {
            console.warn("Input for last 4 digits must be 4 digits or less");
            return;
        }
        setLast4(e.target.value);
    };

    const getUserProfile = async () => {
        try {
            const responseUser = await AxiosAuthInstance().get('user/info');
            const userData = responseUser.data;
            const user: User = {
                id: userData.id,
                username: userData.username,
                firstName: userData.first_name,
                lastName: userData.last_name,
                isStaff: userData.is_staff,
                rank: userData.rank // Default to "NONE" if rank is not provided
            }

            setUser(user);
        } catch (error) {
            setUser(null);
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setSubmitting(true);
        e.preventDefault();
        try {
            const response = await AxiosInstance.post("api/token/", {
                username: lastName.trim().toUpperCase(),
                password: last4
            });
            const { refresh, access }: { refresh: string, access: string } = response.data;
            refreshTokenSet(refresh);
            accessTokenSet(access);

            toast.success("Login successful!");

            await getUserProfile();

            setLastName("");
            setLast4("");
            setOpenDialog(false);
        } catch (error) {
            console.error("Login failed:", error);
            // Handle error (e.g., show a toast notification)
            toast.error("Login failed. Please check your last name and last 4 digits.");
        } finally {
            setSubmitting(false);
        }
    };

    const onSignOut = async () => {
        try {
            // Clear tokens
            refreshTokenSet("");
            accessTokenSet("");
            setUser(null);
            toast.success("Signed out successfully!");
        } catch (error) {
            console.error("Sign out failed:", error);
            toast.error("Sign out failed. Please try again later.");
        }
    };

    useEffect(() => {
        if (user) {
            setLoggedIn(true);
        }
        else {
            setLoggedIn(false);
        }
    }, [user]);

    useEffect(() => {
        console.info("Fetching user profile on component mount");
        getUserProfile();
    }, [])

    return (
        <div className="bg-background h-[70px] fixed top-0 left-0 w-full flex flex-row justify-between items-center px-4 shadow-sm z-49">
            <Link to="/" className='flex items-center gap-2'>
                <img src={Home} alt="Home" height={20} width={20} />
                {/* <h1 className="text-xl font-bold">Tool <span className="bg-[#ffa31a] py-1 px-2 rounded">hub</span></h1> */}
                {/* <h1 className="text-xl font-bold">Tool <span className="bg-[#5dcae8] py-1 px-2 rounded">hub</span></h1> */}
            </Link>
            {loggedIn && user ? (
                <Popover>
                    <PopoverTrigger>
                        <div className="text-right">
                            <p className="text-md text-muted-foreground underline cursor-pointer">
                                {user.firstName} {user.lastName} ({user.rank})
                            </p>
                            {user.isStaff && <p className="text-[15px] text-muted-foreground cursor-pointer">Supervisor</p>}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[50vw] max-w-[200px] z-101 flex flex-col justify-evenly items-center gap-4">
                        <Link to="/user/checkin" className="w-full">
                            <Button variant="default" className="w-full" autoFocus={false}>
                                Checked out items
                            </Button>
                        </Link>
                        <Button variant="destructive" className='w-full text-[white]' onClick={onSignOut} autoFocus={false}>
                            Sign out
                        </Button>
                    </PopoverContent>
                </Popover>
            ) : (
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogContent
                        className="w-[90vw] max-w-[600px] z-103"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <form onSubmit={onSubmit}>
                            <DialogHeader>
                                <DialogTitle>Login to your profile</DialogTitle>
                                <DialogDescription>
                                    Enter your information below to login to your profile
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col gap-6 my-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="last-name">Last name</Label>
                                    <Input
                                        id="last-name"
                                        type="text"
                                        placeholder="last name here, soldier"
                                        value={lastName}
                                        onChange={onChangeLastName}
                                        autoFocus={false}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="last-4">DoD last 4#</Label>
                                    <Input
                                        id="last-4"
                                        type="text"
                                        value={last4}
                                        onChange={onChangeLast4}
                                        pattern="\d{4}"
                                        required
                                        autoFocus={false}
                                        placeholder="####"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="flex-col gap-2">
                                <Button type="submit" className="w-full" disabled={submitting}>
                                    {submitting ? <span>Logging in...</span> : <span>Log in</span>}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                    <DialogTrigger asChild>
                        <Button variant={"ghost"} className='p-0'>
                            <img src={UserIcon} alt="User" height={20} width={20} />
                        </Button>
                    </DialogTrigger>
                </Dialog>
            )}
        </div>
    )
}