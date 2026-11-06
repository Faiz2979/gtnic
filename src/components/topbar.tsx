
import {
    Bell
} from "lucide-react";
import { DynamicBreadcrumb } from "./dynamic-breadcrumb";


interface BreadcrumbItemProps {
    label: string;
    href?: string;
}

interface TopbarProps {
    userInitials?: string;
    onNotificationClick?: () => void;
    onProfileClick?: () => void;
}

export function Topbar({
    userInitials = "AN",
    onNotificationClick,
    onProfileClick,
}: TopbarProps) {
    return (
        <header className="
            flex h-[72px] w-full shrink-0
            items-center justify-between
            border-b border-border
            bg-white px-7
        ">

            <DynamicBreadcrumb/>


            {/* Right Section */}
            <div className="flex items-center gap-5">

                <button
                    type="button"
                    onClick={onNotificationClick}
                    aria-label="Notifications"
                    className="text-secondary hover:text-foreground"
                >
                    <Bell size={20} strokeWidth={1.8} />
                </button>

                <button
                    type="button"
                    onClick={onProfileClick}
                    aria-label="User profile"
                    className="
                        flex h-9 w-9 items-center justify-center
                        rounded-full bg-info-tint
                        text-xs font-semibold text-accent
                        hover:bg-accent/10
                    "
                >
                    {userInitials}
                </button>

            </div>
        </header>
    );
}
