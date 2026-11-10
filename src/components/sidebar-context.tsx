"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
    isCollapsed: boolean;
    toggleCollapse: () => void;
    setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isCollapsed: false,
    toggleCollapse: () => {},
    setIsCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsedState] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("finara_sidebar_collapsed");
        if (saved !== null) {
            setIsCollapsedState(saved === "true");
        }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsedState((prev) => {
            const next = !prev;
            localStorage.setItem("finara_sidebar_collapsed", String(next));
            return next;
        });
    };

    const setIsCollapsed = (collapsed: boolean) => {
        setIsCollapsedState(collapsed);
        localStorage.setItem("finara_sidebar_collapsed", String(collapsed));
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setIsCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}

