/**
 * Equipment tracking page — full list and status of data center equipment.
 */
export default function EquipmentPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Equipment</h1>
      <p className="text-muted-foreground">
        Track inbound, outbound, and loading equipment. View status: New,
        Received, Awaiting pickup, Closed, Cancelled.
      </p>
    </div>
  );
}
