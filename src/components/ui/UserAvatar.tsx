import Image from "next/image";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: number | string; // number = pixels, string = tailwind class
  className?: string;
  isOnline?: boolean;
}

export function UserAvatar({ avatarUrl, name, size = 40, className = "", isOnline }: UserAvatarProps) {
  const isNumericSize = typeof size === "number";
  const sizeClass = isNumericSize ? "" : size as string;
  const styleObj = isNumericSize ? { width: size, height: size } : {};
  const numSizeForImage = isNumericSize ? size : 64; 

  const isMock = avatarUrl && avatarUrl.startsWith("/figma/photos");

  return (
    <div 
      className={`relative shrink-0 overflow-hidden rounded-full border-2 border-transparent bg-gray-100 ${sizeClass} ${className}`}
      style={styleObj}
    >
      {avatarUrl && !isMock ? (
        <img src={avatarUrl} alt={name || "User"} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-end justify-center bg-[#DBDBDB] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="38" r="18" fill="#FFFFFF" />
            <path d="M18 100 C18 65 82 65 82 100 Z" fill="#FFFFFF" />
          </svg>
        </div>
      )}
      {isOnline && (
        <span className="absolute bottom-[2%] right-[2%] size-1/4 max-h-3 max-w-3 rounded-full border-2 border-white bg-[#16A34A]" />
      )}
    </div>
  );
}
