"use client";

import {
    Bell,
    Search,
} from "lucide-react";
import { DynamicBreadcrumb } from "./dynamic-breadcrumb";

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
            sticky top-0 z-20
            flex h-[72px] w-full shrink-0
            items-center justify-between
            border-b border-[#E2E8F0]
            bg-white px-7
        ">
            <DynamicBreadcrumb/>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    aria-label="Search"
                    className="text-secondary hover:text-foreground transition-colors"
                >
                    <Search size={18} strokeWidth={1.8} />
                </button>

                <button
                    type="button"
                    onClick={onNotificationClick}
                    aria-label="Notifications"
                    className="text-secondary hover:text-foreground transition-colors"
                >
                    <Bell size={18} strokeWidth={1.8} />
                </button>

                <button
                    type="button"
                    onClick={onProfileClick}
                    aria-label="User profile"
                    className="
                        flex h-9 w-9 items-center justify-center
                        rounded-full bg-info-tint
                        text-xs font-semibold text-accent
                        hover:bg-accent/10 transition-colors
                    "
                >
                    {userInitials}
                </button>
            </div>
        </header>
    );
}
