// emails/RequestDecisionRider.tsx
import * as React from "react";
import { Button, Heading, Hr, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function RequestDecisionRiderEmail(props: {
    riderName?: string | null;
    status: "ACCEPTED" | "DECLINED";
    rideUrl: string;
}) {
    const { riderName, status, rideUrl } = props;
    const positive = status === "ACCEPTED";

    return (
        <EmailLayout preview={positive ? "Your request was accepted" : "Your request was declined"}>
            <Heading as="h2" className="text-xl font-semibold">
                {positive ? "Good news! 🎉" : "Update on your request"}
            </Heading>

            <Text className="mt-2">
                Hi {riderName ?? "there"}, your ride request was{" "}
                <b className={positive ? "text-green-600" : "text-red-600"}>
                    {status.toLowerCase()}
                </b>.
            </Text>

            <Section className="mt-6">
                <Button
                    href={rideUrl}
                    className="rounded bg-black px-4 py-3 text-white no-underline"
                >
                    Open ride
                </Button>
            </Section>

            <Hr className="my-6" />
            <Text className="text-sm">
                Or open this link: <Link href={rideUrl}>{rideUrl}</Link>
            </Text>
        </EmailLayout>
    );
}
