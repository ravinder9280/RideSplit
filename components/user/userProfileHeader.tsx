'use client'
import { useRef, useState, useEffect } from "react";
import { nanoid } from "nanoid";
import supabase from "@/utils/supabase/client";
import { Pen } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function resolveProfileImageUrl(
  dbImageUrl: string ,
) {
 
  // If DB value is already a full URL (Clerk or whatever)
  if (dbImageUrl.startsWith("http://") || dbImageUrl.startsWith("https://")) {
    return dbImageUrl;
  }

  // Otherwise assume it's a Supabase storage path
  return `${SUPABASE_URL}/storage/v1/object/public/${dbImageUrl}`;
}

export default function UserProfileHeader({imageUrl,clerkId}:{imageUrl:string,clerkId:string}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const {user}=useUser()
  const router = useRouter();
  const finalImageUrl = resolveProfileImageUrl(imageUrl);
console.log(imageUrl)
  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setPreview(null);
    }
  }, [selectedFile]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const allowedTypes = ["image/jpeg", "image/png"];
    const maxSize = 2 * 1024 * 1024; // 2 MB
  
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only JPEG and PNG files are allowed.");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setSelectedFile(null);
      return;
    }
  
    if (selectedFile.size > maxSize) {
      toast.error("File size must be less than 2MB.");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setSelectedFile(null);
      return;
    }
    
    setLoading(true);
    const filename = nanoid();

    const { data, error } = await supabase.storage
      .from("userimage/userprofile")
      .upload(
        `${filename}.${selectedFile.name.split(".").pop()}`,
        selectedFile,{
          contentType: selectedFile.type
        }
      );
      const { error: dbError } = await supabase
      .from("User")
      .update({ imageUrl: data?.fullPath }) // or { image_url: filePath } if snake_case
      .eq("clerkId", user?.id);
  
  

    setLoading(false);
    if(error||dbError ) {
      toast.error('Some Error Occured')
      console.log(error,dbError)
      return;
    }
    toast.success('File Uploaded Successfully')
    router.refresh();    
    // Reset after successful upload
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setSelectedFile(null);
  };
 
  return (
    <div>
      <div className='rounded-full ring-2 ring-primary relative'>
      <Avatar className="h-24 w-24 rounded-full mx-auto ring-2 ring-primary">
                          <AvatarImage src={finalImageUrl||''} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                 
                  <Dialog >
                    {clerkId==user?.id&&

                      <Button className="absolute bottom-0 right-0" size={"icon"} variant={"secondary"} asChild>
                    <DialogTrigger className="">
                    <Pen/>


                    </DialogTrigger>
                  </Button>
                    }

                  <DialogContent>
                    <div className="flex flex-col gap-4">
                      {preview && (
                        <Avatar className="h-24 w-24 rounded-full mx-auto ring-2 ring-primary">
                          <AvatarImage src={preview} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      )}

                  <input
          type="file"
          accept="image/jpeg, image/png"
          ref={inputRef}
          onChange={(e) => {
            const file = e?.target?.files?.[0] || null;
            setSelectedFile(file);
          }}
        />
        <Button
          type="button"
          disabled={!selectedFile||loading}
          onClick={handleUpload}
          >
          {loading?
         <Spinner/>:
         
         <span>

          Update Profile 
          </span>
          }
        </Button> 
          </div>
                      </DialogContent>
                  </Dialog>
              </div>
      
      
       
    </div>
  );
}