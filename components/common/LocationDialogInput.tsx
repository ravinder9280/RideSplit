"use client";

import { useState } from "react";
import { Dialog, DialogContent} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import MapboxAutocomplete from "../location/autocomplete";

export default function LocationDialogInput({
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
                  <div onClick={() => setOpen(true)} className="flex items-center cursor-pointer justify-between h-12 w-full rounded-md bg-muted/20 gap-2   px-3 py-1 text-base shadow-sm ">
                  <Input
                        
                        type="text"
                        readOnly={true}
                        value={value}
                        
                        placeholder={placeholder}
                        required={required}
                              className=" bg-transparent p-0 cursor-pointer focus-visible:ring-0 "
                        />
                        <MapPin className="text-muted-foreground h-4 w-4"/>
                        </div>

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
