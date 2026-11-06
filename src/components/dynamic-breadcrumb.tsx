
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function formatSegment(segment: string): string {
    return segment
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DynamicBreadcrumb() {
    const pathname = usePathname();

    const segments = pathname
        .split("/")
        .filter(Boolean);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {/* Workspace */}
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link
                            href="/dashboard"
                            className="text-secondary hover:text-foreground"
                        >
                            Ruang kerja
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {segments.map((segment, index) => {
                    const href =
                        "/" + segments.slice(0, index + 1).join("/");

                    const isLast = index === segments.length - 1;

                    const label = formatSegment(segment);

                    return (
                        <div key={href} className="contents">
                            <BreadcrumbSeparator />

                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="
                                        font-semibold
                                        text-foreground
                                    ">
                                        {label}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link
                                            href={href}
                                            className="text-secondary"
                                        >
                                            {label}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </div>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
