// app/requests/page.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import IncomingRequests from "@/components/requests/IncomingRequests";
import MyRequestsList from "@/components/requests/MyRequestsList";

export default async function RequestsHubPage() {
    return (
        <main className="max-w-5xl mx-auto p-6 space-y-6">
            <h1 className="text-xl font-semibold">Requests</h1>

            <Tabs defaultValue="incoming" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="incoming">Requests</TabsTrigger>
                    <TabsTrigger value="mine">My Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="incoming">
                    <IncomingRequests />
                </TabsContent>

                <TabsContent value="mine">
                    {/* @ts-expect-error Async Server Component */}
                    <MyRequestsList />
                </TabsContent>
            </Tabs>
        </main>
    );
}
