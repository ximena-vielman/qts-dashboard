"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Shift = "am" | "pm";

interface NextRound {
  id: string;
  time: string;
  location: string;
  eta: string;
}

interface UpcomingRound {
  id: string;
  time: string;
  location: string;
  area: string;
  eta: string;
}

interface ShiftRounds {
  next: NextRound;
  upcoming: UpcomingRound[];
}

const mockRoundsData: Record<Shift, ShiftRounds> = {
  am: {
    next: {
      id: "round-1",
      time: "9:00 AM",
      location: "ASH1-DC1 - Main Room",
      eta: "45min",
    },
    upcoming: [
      {
        id: "round-2",
        time: "11:00 AM",
        location: "ASH1-DC1",
        area: "All Zones",
        eta: "45min",
      },
      {
        id: "round-3",
        time: "11:45 AM",
        location: "ASH1-DC1",
        area: "Zone A-C",
        eta: "30min",
      },
    ],
  },
  pm: {
    next: {
      id: "round-4",
      time: "1:30 PM",
      location: "ASH1-DC1 - Storage Area",
      eta: "1h 20min",
    },
    upcoming: [
      {
        id: "round-5",
        time: "3:00 PM",
        location: "ASH1-DC1",
        area: "All Zones",
        eta: "45min",
      },
    ],
  },
};

function UpcomingRoundItem({
  time,
  location,
  area,
  eta,
  onClick,
}: {
  time: string;
  location: string;
  area: string;
  eta: string;
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
      <span
        className="h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-gray-300 bg-transparent"
        aria-hidden
      />
      <span className="min-w-[80px] shrink-0 text-base font-medium text-gray-900">
        {time}
      </span>
      <span className="min-w-0 flex-1 text-base font-normal text-gray-600">
        {location} • {area} • ETA {eta}
      </span>
    </button>
  );
}

/**
 * RoundsWidget: Scheduled facility rounds with AM/PM shift toggle,
 * next round card, and upcoming rounds list.
 */
export function RoundsWidget() {
  const [activeShift, setActiveShift] = useState<Shift>("am");

  const { next, upcoming } = useMemo(
    () => mockRoundsData[activeShift],
    [activeShift]
  );

  const totalRoundsCount = useMemo(
    () => 1 + upcoming.length,
    [upcoming.length]
  );

  const handleNextRoundClick = () => {
    console.log("Open round details:", next.id);
  };

  const handleUpcomingClick = (id: string) => {
    console.log("Open round details:", id);
  };

  return (
    <article
      className="flex h-full min-w-0 flex-col rounded-xl bg-white p-4 shadow-md md:p-6"
      aria-label="Rounds schedule"
    >
      {/* Header: 56px, title + AM/PM tabs */}
      <header className="mb-6 flex h-14 shrink-0 items-center justify-between">
        <h2 className="text-sm font-semibold uppercase leading-6 text-gray-900">ROUNDS</h2>
        <div
          role="tablist"
          aria-label="Shift filter"
          className="inline-flex w-fit rounded-lg bg-gray-50 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeShift === "am"}
            onClick={() => setActiveShift("am")}
            className={cn(
              "min-w-[60px] rounded-md px-5 py-1 text-center text-sm font-medium transition-colors",
              activeShift === "am"
                ? "bg-[#18181B] text-white"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            AM
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeShift === "pm"}
            onClick={() => setActiveShift("pm")}
            className={cn(
              "min-w-[60px] rounded-md px-5 py-1 text-center text-sm font-medium transition-colors",
              activeShift === "pm"
                ? "bg-[#18181B] text-white"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            PM
          </button>
        </div>
      </header>

      {/* Next Round featured card */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleNextRoundClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNextRoundClick();
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
        <p className="mb-2 text-sm font-normal text-gray-500">Next</p>
        <p className="mb-3 text-[32px] font-bold leading-[40px] text-primary">
          {next.time}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-normal text-gray-600">
          <span className="flex items-center gap-2">
            <MapPin className="h-[18px] w-[18px] shrink-0 text-gray-500" aria-hidden />
            {next.location}
          </span>
          <span className="select-none text-gray-400" aria-hidden>•</span>
          <span>ETA {next.eta}</span>
        </div>
      </div>

      {/* Section label */}
      <p className="mb-4 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Upcoming
      </p>

      {/* Upcoming rounds list - flex-1 so widget matches row height */}
      <div className="min-h-0 flex-1 overflow-auto">
        {upcoming.map((round) => (
          <UpcomingRoundItem
            key={round.id}
            time={round.time}
            location={round.location}
            area={round.area}
            eta={round.eta}
            onClick={() => handleUpcomingClick(round.id)}
          />
        ))}
      </div>

      {/* Footer: View All Rounds */}
      <div className="mt-5 shrink-0 border-t border-gray-100 pt-4">
        <Link
          href="/rounds"
          className="text-sm font-medium text-primary hover:underline hover:text-primary/90"
        >
          View All Rounds ({totalRoundsCount})
        </Link>
      </div>
    </article>
  );
}
