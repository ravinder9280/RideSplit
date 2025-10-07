"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import MapboxAutocomplete from "../location/autocomplete";

export default function LocationDialogInput({
      label,
      namePrefix,
      placeholder,
      required = true,
}: {
      label?: string;
      namePrefix: "from" | "to";
      placeholder?: string;
      required?: boolean;
}) {
      const [open, setOpen] = useState(false);
      const [value, setValue] = useState("");
      const [coords, setCoords] = useState<{ lat: number | ""; lng: number | "" }>({
            lat: "",
            lng: "",
      });

      return (
            <div className="relative">

                  {/* Fake input that opens dialog */}
                  <Input
                        type="text"
                        readOnly
                        value={value}
                        onClick={() => setOpen(true)}
                        placeholder={placeholder}
                        required={required}
                        className="cursor-pointer"
                  />

                  {/* Hidden fields for form submit */}
                  <input type="hidden" name={`${namePrefix}Text`} value={value} />
                  <input type="hidden" name={`${namePrefix}Lat`} value={coords.lat} />
                  <input type="hidden" name={`${namePrefix}Lng`} value={coords.lng} />

                  {/* Full-screen Dialog on mobile */}
                  <Dialog open={open} onOpenChange={setOpen}>
                        <DialogContent className="sm:max-w-xl z-[1000] w-screen  h-dvh   sm:w-[574px] sm:w- p-0">
                              
                              <div className="p-4">
                                    <MapboxAutocomplete
                                          namePrefix={namePrefix}
                                          placeholder={placeholder}
                                          onSelect={(p) => {
                                                setValue(p.text);
                                                setCoords({ lat: p.lat, lng: p.lng });
                                                setOpen(false);
                                          }}
                                    />
                              </div>
                        </DialogContent>
                  </Dialog>
            </div>
      );
}
