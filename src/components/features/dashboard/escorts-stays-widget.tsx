"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "upcoming" | "closed";

interface ContactInfo {
  initials: string;
  name: string;
  color: string;
}

interface NextEscort {
  id: string;
  company: string;
  timeRange: string;
  location: string;
  contact: ContactInfo;
}

interface LaterEscort {
  id: string;
  time: string;
  company: string;
  location: string;
}

interface ClosedEscort {
  id: string;
  timeRange: string;
  company: string;
  location: string;
  status: string;
}

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-green-500",
  "bg-primary",
  "bg-purple-500",
  "bg-orange-500",
];

function getAvatarColor(key: string): string {
  let index = 0;
  for (let i = 0; i < key.length; i++) index += key.charCodeAt(i);
  return AVATAR_COLORS[index % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

function ContactAvatar({
  initials,
  name,
  size = "md",
}: {
  initials: string;
  name: string;
  size?: "sm" | "md";
}) {
  const colorClass = getAvatarColor(initials + name);
  const sizeClass = size === "sm" ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        colorClass,
        sizeClass
      )}
      title={name}
      aria-hidden
    >
      {initials.toUpperCase()}
    </span>
  );
}

function EscortListItem({
  timeOrRange,
  company,
  location,
  isClosed,
  onClick,
}: {
  timeOrRange: string;
  company: string;
  location: string;
  isClosed: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 w-full items-center gap-3 border-b border-gray-100 py-3 last:border-b-0",
        "text-left transition-colors hover:bg-gray-50",
        onClick && "cursor-pointer"
      )}
    >
      {isClosed ? (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900"
          aria-hidden
        >
          <Check className="h-3 w-3 text-white" />
        </span>
      ) : (
        <span
          className="h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-gray-300 bg-transparent"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "shrink-0 text-base font-medium text-gray-900",
          !isClosed && "min-w-[80px]"
        )}
      >
        {timeOrRange}
      </span>
      <span className="min-w-0 flex-1 text-base font-normal text-gray-600">
        {company} • {location}
      </span>
    </button>
  );
}

const mockEscortsData = {
  upcoming: {
    next: {
      id: "escort-1",
      company: "Company Name",
      timeRange: "2:00 PM - 4:00 PM",
      location: "ASH1-DC1 - Main Room",
      contact: {
        initials: "JM",
        name: "John Morgan",
        color: "teal-500",
      },
    },
    later: [
      {
        id: "escort-2",
        time: "4:00 PM",
        company: "Company Name",
        location: "ASH1-DC1 - Main Room",
      },
      {
        id: "escort-3",
        time: "6:00 PM",
        company: "Company Name",
        location: "ASH1-DC3 - Main Room",
      },
    ],
  },
  closed: [
    {
      id: "escort-4",
      timeRange: "9:00 AM - 11:00 AM",
      company: "Microsoft",
      location: "ASH1-DC1 - Main Room",
      status: "Completed",
    },
    {
      id: "escort-5",
      timeRange: "Yesterday, 3:00 PM - 5:00 PM",
      company: "Oracle",
      location: "ASH1-DC1 - Storage",
      status: "Completed",
    },
  ],
};

/**
 * EscortsStaysWidget: Visitor escorts and stays with Upcoming/Closed toggle,
 * next escort card, and list of appointments.
 */
export function EscortsStaysWidget() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const { next, later } = mockEscortsData.upcoming;
  const closed = mockEscortsData.closed;

  const sectionLabel = useMemo(() => {
    if (activeTab === "upcoming") return "LATER TODAY";
    return "COMPLETED TODAY";
  }, [activeTab]);

  const upcomingCount = useMemo(
    () => 1 + later.length,
    [later.length]
  );
  const closedCount = closed.length;

  const handleNextClick = () => {
    console.log("Open escort details:", next.id);
  };

  const handleListItemClick = (id: string) => {
    console.log("Open escort details:", id);
  };

  return (
    <article
      className="flex h-full min-w-0 flex-col rounded-xl bg-white p-4 shadow-md md:p-6"
      aria-label="Escorts and stays"
    >
      {/* Header: 56px, title + Upcoming/Closed tabs */}
      <header className="mb-6 flex h-14 shrink-0 items-center justify-between">
        <h2 className="text-sm font-semibold uppercase leading-6 text-gray-900">
          ESCORTS & STAYS
        </h2>
        <div
          role="tablist"
          aria-label="Filter by status"
          className="inline-flex w-fit rounded-lg bg-gray-50 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
            className={cn(
              "min-w-[100px] rounded-md px-5 py-1 text-center text-sm font-medium transition-colors",
              activeTab === "upcoming"
                ? "bg-[#18181B] text-white"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Upcoming
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "closed"}
            onClick={() => setActiveTab("closed")}
            className={cn(
              "min-w-[100px] rounded-md px-5 py-1 text-center text-sm font-medium transition-colors",
              activeTab === "closed"
                ? "bg-[#18181B] text-white"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Closed
          </button>
        </div>
      </header>

      {activeTab === "upcoming" && (
        <>
          {/* Next escort featured card */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleNextClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleNextClick();
              }
            }}
            className={cn(
              "relative mb-6 shrink-0 rounded-xl bg-gray-50 p-6 transition-all duration-200",
              "cursor-pointer hover:scale-[1.01] hover:bg-gray-100"
            )}
          >
            <span
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
              aria-hidden
            >
              <ArrowUpRight className="h-5 w-5" />
            </span>
            <p className="mb-2 text-sm font-normal text-gray-500">
              {next.company}
            </p>
            <p className="mb-4 text-[32px] font-bold leading-[40px] text-primary">
              {next.timeRange}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base font-normal text-gray-600">
              <span className="flex items-center gap-2">
                <MapPin
                  className="h-[18px] w-[18px] shrink-0 text-gray-500"
                  aria-hidden
                />
                {next.location}
              </span>
              <span className="select-none text-gray-400" aria-hidden>
                •
              </span>
              <span className="flex items-center gap-2 text-gray-700">
                <ContactAvatar
                  initials={next.contact.initials}
                  name={next.contact.name}
                  size="md"
                />
                <span className="hidden md:inline" title={next.contact.name}>
                  {next.contact.name}
                </span>
              </span>
            </div>
          </div>
        </>
      )}

      {/* Section label */}
      <p className="mb-4 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {sectionLabel}
      </p>

      {/* List - flex-1 so widget matches row height */}
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === "upcoming" &&
          later.map((item) => (
            <EscortListItem
              key={item.id}
              timeOrRange={item.time}
              company={item.company}
              location={item.location}
              isClosed={false}
              onClick={() => handleListItemClick(item.id)}
            />
          ))}
        {activeTab === "closed" &&
          closed.map((item) => (
            <EscortListItem
              key={item.id}
              timeOrRange={item.timeRange}
              company={item.company}
              location={item.location}
              isClosed
              onClick={() => handleListItemClick(item.id)}
            />
          ))}
      </div>

      {/* Footer */}
      <div className="mt-5 shrink-0 border-t border-gray-100 pt-4">
        {activeTab === "upcoming" ? (
          <Link
            href="/escorts"
            className="text-sm font-medium text-primary hover:underline hover:text-primary/90"
          >
            View Upcoming ({upcomingCount})
          </Link>
        ) : (
          <Link
            href="/escorts"
            className="text-sm font-medium text-primary hover:underline hover:text-primary/90"
          >
            View Closed ({closedCount})
          </Link>
        )}
      </div>
    </article>
  );
}
