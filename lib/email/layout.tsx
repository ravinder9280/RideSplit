// emails/layout.tsx
import * as React from "react";
import { Html, Head, Preview, Tailwind, Body, Container } from "@react-email/components";

export function EmailLayout({
    preview,
    children,
}: {
    preview?: string;
    children: React.ReactNode;
}) {
    return (
        <Html>
            <Head />
            {preview ? <Preview>{preview}</Preview> : null}
            <Tailwind>
                <Body className="bg-neutral-100 text-neutral-900">
                    <Container className="mx-auto my-6 max-w-[600px] rounded-lg bg-white p-24 shadow">
                        {children}
                        <p className="mt-8 text-xs text-neutral-500">
                            RidePlus — Please don’t reply to this automated email.
                        </p>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
