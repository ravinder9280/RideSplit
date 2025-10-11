import NearRides from "@/components/ride/near-rides"; // server
import LocationInit from "@/components/location/LocationInit";  // client (asks on mount)
import AllowLocationBanner from "@/components/common/AllowLocationBanner"; // client
import MobileTabs from "@/components/Mobile-Tabs";
import { ListSkeleton } from "@/components/common/ListSkeleton";
import { Suspense } from "react";
import LocationNavigator from "@/components/common/LoacationNavigator";
import LatestRides from "@/components/ride/latest-rides";
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
    <main className="max-w-7xl mx-auto  space-y-6">
      {denied && <AllowLocationBanner />}
     <LocationNavigator/>
      <MobileTabs />
      <LocationInit />

      {/* Chatbot Section */}
     

      <Suspense fallback={<ListSkeleton/>}>
        
      {fromLat && fromLng ? (
        <NearRides
        lat={parseFloat(fromLat)}
        lng={parseFloat(fromLng)}
        radiusKm={10}
        pageSize={6}
        />
      ) : null}

      </Suspense>
      <Suspense fallback={<ListSkeleton/>}>
        
       <LatestRides/>
      

      </Suspense>

     
    </main>
  );
}
