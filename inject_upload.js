const fs = require('fs');
let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// 1. Add definitions to imports
content = content.replace(
    'import { useState, useEffect } from "react";',
    'import { useState, useEffect, useRef } from "react";'
);
content = content.replace(
    'import { updateUserName } from "@/lib/api/auth";',
    'import { updateUserName, updateUserProfilePic } from "@/lib/api/auth";\nimport { uploadFileToS3 } from "@/lib/api/files";'
);

// 2. Add states and useRef immediately after \`useAuthProfileQuery();\`
const hookInsertionPoint = 'const profileQuery = useAuthProfileQuery();';
const hookAdditions = `

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10MB limit.");
      return;
    }

    const userId = profileQuery.data?.id;
    if (!userId) {
      setUploadError("Profile not loaded. Cannot upload.");
      return;
    }

    setIsUploadingImage(true);
    setUploadError("");
    setError("");
    setSuccess("");

    try {
      const uploadedFile = await uploadFileToS3({ file });
      if (!uploadedFile.fileUrl) throw new Error("No URL returned from S3");

      await updateUserProfilePic(userId, uploadedFile.fileUrl);
      
      setSuccess("Profile picture updated successfully!");
      profileQuery.refetch();
      
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload profile picture.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
`;
content = content.replace(hookInsertionPoint, hookInsertionPoint + hookAdditions);

// 3. Replace the avatar box logic to render \`profilePicUrl\` and link the button.
const targetAvatarBox = `<div className="h-20 w-20 shrink-0 rounded-full bg-[#212121] flex items-center justify-center overflow-hidden">
               <span className="text-2xl font-bold text-white uppercase">
                 {firstName ? firstName[0] : (user?.name ? user.name[0] : "S")}
               </span>
            </div>
            <div>
              <p className="font-bold text-[#212121] text-base">Profile photo</p>
              <p className="text-sm text-[#737373] mt-0.5 mb-3">We support PNGs, JPEGs and GIFs under 10MB</p>
              <Button variant="outline" className="rounded-full h-8 text-xs font-bold text-[#212121]">
                Upload new picture
              </Button>
            </div>`;

const newAvatarBox = `<div className="h-[72px] w-[72px] shrink-0 rounded-full bg-[#212121] flex items-center justify-center overflow-hidden shadow-sm">
               {user?.profilePicUrl ? (
                 <img src={user.profilePicUrl} alt="Avatar profile" className="h-full w-full object-cover" />
               ) : (
                 <span className="text-2xl font-bold text-white uppercase tracking-wider">
                   {firstName ? firstName[0] : (user?.name ? user.name[0] : "S")}
                 </span>
               )}
            </div>
            <div>
              <p className="font-bold text-[#212121] text-[15px]">Profile photo</p>
              <p className="text-[13px] text-[#737373] mt-0.5 mb-3">We support PNGs, JPEGs and GIFs under 10MB</p>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="rounded-full h-8 px-4 text-xs font-bold text-[#212121] border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {isUploadingImage ? (
                  <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Uploading...</>
                ) : "Upload new picture"}
              </Button>
              <input 
                 type="file" 
                 accept="image/png, image/jpeg, image/gif" 
                 ref={fileInputRef} 
                 onChange={handleImageUpload} 
                 className="hidden" 
              />
            </div>`;
content = content.replace(targetAvatarBox, newAvatarBox);

// 4. Inject uploadError UI logic immediately before '        {error && (' (with some leeway)
content = content.replace(
    '{error && (',
    `{uploadError && (
               <div className="rounded-[16px] border border-red-200 bg-red-50 p-4 mb-6">
                 <div className="flex gap-4 items-start">
                   <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                   <p className="text-sm font-bold text-red-900">{uploadError}</p>
                 </div>
               </div>
            )}
            
            {error && (`
);

fs.writeFileSync('app/profile/page.tsx', content);
console.log('Successfully injected profile picture upload logic');
