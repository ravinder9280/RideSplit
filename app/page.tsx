import NearRides from "@/components/ride/near-rides"; // server
import LocationInit from "@/components/location/LocationInit";  // client (asks on mount)
import AllowLocationBanner from "@/components/common/AllowLocationBanner"; // client
import MobileTabs from "@/components/Mobile-Tabs";
import SearchHome from "@/components/common/SearchHome";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const get = (k: string) => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const fromLat = get("fromLat");
  const fromLng = get("fromLng");
  const denied = get("loc") === "denied";

  return (
    <main className="max-w-6xl  space-y-6">
      {denied && <AllowLocationBanner />}
      <SearchHome/>
      <MobileTabs/>
      <LocationInit />
    
      {fromLat && fromLng ? (
        <NearRides
          lat={parseFloat(fromLat)}
          lng={parseFloat(fromLng)}
          radiusKm={10}
          pageSize={6}
        />
      ) : null}

     
    </main>
  );
}
