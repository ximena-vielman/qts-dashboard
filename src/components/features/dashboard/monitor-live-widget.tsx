"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Site map image path in public (use your facility/site map image here) */
const SITE_MAP_IMAGE = "/site-map.png";

/**
 * MonitorLiveWidget: Live site/facility overview using your facility map image.
 * Place your image at public/site-map.png for a clearer representation of the place.
 */
export function MonitorLiveWidget() {
  return (
    <Card className="h-full overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase leading-6 tracking-normal text-gray-900">
          Live Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div
          className="relative w-full max-h-[314px] overflow-hidden rounded-md bg-gray-100"
          style={{ aspectRatio: "4/3", minHeight: 200 }}
          aria-label="Facility site map overview"
        >
          <Image
            src={SITE_MAP_IMAGE}
            alt="Facility site map – buildings, zones, and active area"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority={false}
          />
          {/* Health status floating above map, 16px from left and bottom */}
          <div
            className="absolute left-4 bottom-4 flex items-center gap-2 rounded-md border border-border bg-card/95 px-3 py-2 text-sm shadow-sm backdrop-blur-sm"
            aria-label="Health status"
          >
            <span className="font-medium text-green-600">27 good</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-medium text-amber-600">2 alerts</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Site overview · Blue: active zone
        </p>
      </CardContent>
    </Card>
  );
}
