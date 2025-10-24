'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { ArrowRight, Check, Hourglass, Phone, Star, X } from 'lucide-react';
import RidePin from '../common/RidePin';
import { SeatSelector } from '../ui/seat-stepper';
import { requestRide } from '@/actions/rides/request';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useFormStatus } from 'react-dom';
import { Owner } from '@/lib/types/Ride';
import Link from 'next/link';


export type MemberStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
const memberStatusMap: Record<MemberStatus, { label: string, icon: React.ReactNode, color: string }> = {
    'NONE': {
        label: 'None',
        icon: null,
        color: 'bg-gray-500'
    },
    'PENDING': {
        label: 'Pending',
        icon: <Hourglass size={20} />,
        color: 'bg-yellow-500'
    },
    'ACCEPTED': {
        label: 'Accepted',
        icon: <Check size={20} />,
        color: 'bg-green-500'
    },
    'DECLINED': {
        label: 'Declined',
        icon: <X size={20} />,
        color: 'bg-destructive'
    },
    'CANCELLED': {
        label: 'Cancelled',
        icon: <X size={20} />,
        color: 'bg-destructive'
    }
}
export function RideDetailsCard({
    owner,
    perSeatPrice,
    fromText,
    toText,
    startsAt,
    status,
    seatsAvailable,
    rideId,
    memberStatus = 'NONE',
}: {
    owner?: Owner;
    perSeatPrice?: string | number;
    fromText?: string;
    toText?: string;
    startsAt?: string;
    status?: string;
    seatsAvailable: number;
    rideId: string;
    memberStatus?: MemberStatus;
}) {
    const { user } = useUser();
    const router = useRouter();
    const closeRef = useRef<HTMLButtonElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isExpired = (() => {
        if (!startsAt) return false;
        try {
            const startDate = new Date(startsAt);
            const now = new Date();
            return startDate < now;
        } catch {
            return false;
        }
    })();

    const isRequestDisabled =
        isExpired || user?.id === owner?.clerkId || status !== "ACTIVE" || memberStatus === 'PENDING' || seatsAvailable <= 0 || isSubmitting;

    function SubmitButton() {
        const { pending } = useFormStatus();
        const isDisabled = pending || isSubmitting;
        return (
            <Button disabled={isDisabled} type="submit">
                {isDisabled ? (
                    <div className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                        Sending Request...
                    </div>
                ) : (
                    <span className="flex items-center gap-2">
                        Send Request <ArrowRight size={20} />
                    </span>
                )}
            </Button>
        );
    }

    async function clientAfterSubmit(formData: FormData) {
        if (isSubmitting) return; // Prevent multiple submissions

        setIsSubmitting(true);
        try {
            const res = await requestRide(formData);
            if (res.ok) {
                toast.success(res.message || 'Request Sent Successfully');
                // Refresh the page to show updated member status
                router.refresh();
            } else {
                toast.error(res.message || 'Some Error Occurred');
            }
            closeRef.current?.click();
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to send request';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className='  bg-muted/20  '>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <h2>Ride Details</h2>
                    <Badge variant={isExpired ? 'red-subtle' : 'green-subtle'}>
                        {isExpired ? 'Expired' : 'Active'}
                    </Badge>
                </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4">
                <div className="flex justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Link className='rounded-full' href={`/user/${owner?.id}`}>
                            <Image height={20} width={20} className="w-10 h-10 rounded-full" alt="" src={owner?.imageUrl || ''} />
                        </Link>
                        <div>
                            <h3 className="font-bold line-clamp-1 ">{owner?.name}</h3>
                            <div className="text-muted-foreground flex items-center text-sm gap-1"> <span>
                                <Star size={16} fill="yellow" stroke="yellow" />
                            </span>
                                {owner?.rating}</div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs text-muted-foreground">Per Seat Price</span>
                        <span className="rounded bg-primary/5 px-2 py-1 text-sm text-primary font-medium">
                            ₹{perSeatPrice}
                        </span>
                    </div>
                </div>
                <div>
                    <Badge size="sm" variant="blue">Seats Available : {seatsAvailable}</Badge>
                </div>

                <Separator />

                <div className="flex justify-between w-full items-center">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                size="lg"
                                variant="outline"
                                disabled={memberStatus !== "ACCEPTED"}
                            >
                                <Phone /> Contact
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <h3 className="text-lg text-left font-semibold">Contact Owner</h3>
                            </DialogHeader>
                            <div className="space-y-3">
                                {owner?.phone ? (
                                    <>
                                        
                                        <div className=" flex items-center text-sm gap-2 text-muted-foreground">
                                            <p className="">
                                                You can reach {owner?.name} at:
                                            </p>
                                            <span className='text-base text-primary' >
                                            {owner.phone}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button asChild variant="secondary">
                                                <Link href={`tel:${owner.phone}`}>
                                                    <Phone/>

                                                    <span>
                                                        Phone
                                                    </span>
                                                </Link>
                                            </Button>
                                            <Button asChild variant="secondary">
                                                <Link
                                                    href={`https://wa.me/${owner.phone.toString().replace(/\D/g, "")}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Image src={'/whatsapp.svg'} height={20} width={20} alt='hh'/>
                                                    <span>
                                                    WhatsApp
                                                    </span>
                                                </Link>
                                            </Button>
                                        </div>
                                      
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Owner has not provided a phone number.
                                    </p>
                                )}
                            </div>

                        </DialogContent>
                    </Dialog>


                    <div>
                        {memberStatus !== 'NONE' && memberStatus !== 'CANCELLED' ? (
                            <Button disabled size="lg" className={memberStatusMap[memberStatus].color} variant="secondary">

                                {memberStatusMap[memberStatus].label}
                                {memberStatusMap[memberStatus].icon}

                            </Button>
                        ) : (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button disabled={isRequestDisabled} size="lg">
                                        Request ride <ArrowRight size={20} />
                                    </Button>
                                </DialogTrigger>

                                    <DialogContent onOpenAutoFocus={(e) => {
                                        e.preventDefault(); // stops Radix from focusing the first focusable element
                                    }} showCloseButton={false} forceMount className="sm:max-w-[425px] z-[1000]">
                                    <DialogHeader>
                                        <div className="flex justify-between">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <Image height={20} width={20} className="w-10 h-10 rounded-full" alt="" src={owner?.imageUrl || ''} />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <h3 className="font-bold">{owner?.name}</h3>
                                                        <div className="text-muted-foreground flex items-center text-sm gap-1"> <span>
                                                            <Star size={16} fill="yellow" stroke="yellow" />
                                                        </span>
                                                            {owner?.rating}</div>                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-xs text-muted-foreground">Per Seat Price</span>
                                                <span className="rounded bg-primary/5 px-2 py-1 text-sm text-primary font-medium">
                                                    ₹{perSeatPrice}
                                                </span>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <form
                                        action={async (formData) => {
                                            await clientAfterSubmit(formData);
                                        }}
                                    >
                                        <div className="grid gap-4">
                                            <div>
                                                <Badge size="sm" variant="teal-subtle">Seats Available : {seatsAvailable}</Badge>
                                            </div>

                                            <RidePin lineClampClass="line-clamp-1" fromText={fromText || 'Location'} toText={toText || 'Location'} />

                                            <div className="grid mt-4 gap-3">
                                                <input type="hidden" name="rideId" value={String(rideId)} />
                                                <Label className="text-sm text-muted-foreground" htmlFor="seats">Number of seats</Label>
                                                <SeatSelector min={1} max={seatsAvailable} />
                                            </div>
                                        </div>

                                        <DialogFooter className="mt-4">
                                            <DialogClose asChild>
                                                <Button ref={closeRef} type="button" variant="outline">Cancel</Button>
                                            </DialogClose>

                                            <SubmitButton />
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <Separator />
            </CardContent>
        </Card>
    );
}


