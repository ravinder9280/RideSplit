"use client";
import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RideCard from "../ride/ride-card";

type Msg = { role: "user" | "assistant"; content: string };

type Ride = {
    id: string;
    fromText: string;
    toText: string;
    when: string;
    service: string;
    perSeat: number;
    seatsLeft: number;
    owner: string;
};

async function sendChat(url: string, { arg }: { arg: Msg[] }) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: arg })
    });
    if (!res.ok) throw new Error("chat failed");

    // Handle streaming response
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    let result = "";
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
    }

    return result;
}

export default function ChatBox() {
    const [thread, setThread] = useState<Msg[]>([
        { role: "assistant", content: "Hi! Tell me where/when and seats needed." }
    ]);
    const [input, setInput] = useState("");
    const [rides, setRides] = useState<Ride[]>([]);

    const { trigger, isMutating } = useSWRMutation("/api/chat", sendChat);

    async function onSend() {
        if (!input.trim()) return;
        const next: Msg[] = [...thread, { role: "user" as const, content: input }];
        setThread(next);
        setInput("");

        try {
            const text = await trigger(next);
            // parse for RIDES_JSON fence if present
            const ridesJson = extractJson(text, "RIDES_JSON");

            // Clean the text for display (remove RIDES_JSON block)
            const displayText = text.replace(/```RIDES_JSON[\s\S]*?```/g, "").trim();

            setThread([...next, { role: "assistant" as const, content: displayText }]);

            // Handle rides display
            if (ridesJson && Array.isArray(ridesJson)) {
                setRides(ridesJson);
                console.log("Found rides:", ridesJson);
            } else {
                setRides([]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setThread([...next, {
                role: "assistant" as const,
                content: "Sorry, I encountered an error. Please try again."
            }]);
        }
    }

    return (
        <div className="grid grid-cols-1 md:max-h-[600px] md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-card p-3 space-y-3">
                <div className=" min-h-[200px] md:min-h-[400px] overflow-auto space-y-2 text-sm">
                    {thread.map((m, idx) => (
                        <div key={idx} className={cn("p-2 rounded-md", m.role === "user" ? "bg-primary/10" : "bg-muted")}>
                            {m.content}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g., Tomorrow 7–9pm, Gurgaon → Noida, 2 seats"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                onSend();
                            }
                        }}
                    />
                    <Button onClick={onSend} disabled={isMutating || !input.trim()}>
                        {isMutating ? "Searching..." : "Send"}
                    </Button>
                </div>
            </div>

            {/* Ride Results Display */}
            {rides.length > 0 ? 
                <div className="rounded-xl overflow-y-auto max-h-[600px] border bg-muted p-4">
                    <h3 className="text-lg font-semibold mb-3">Available Rides</h3>
                    <div className="grid gap-3">
                        {rides.map((ride, idx) => (
                            <RideCard key={idx} r={ride}/>
                        ))}
                    </div>
                </div>:
                < div className="rounded-xl overflow-y-auto max-h-[600px] border bg-muted p-4">
                
                </div>}
        </div>
    );
}

// tiny helper: picks fenced code block ```RIDES_JSON ... ```
function extractJson(s: string, label: string) {
    const m = s.match(new RegExp("```" + label + "\\n([\\s\\S]*?)\\n```"));
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch { return null; }
}
