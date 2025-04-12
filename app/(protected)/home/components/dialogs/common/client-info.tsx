import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClientInfoProps {
  name: string;
  email: string;
  avatar?: string;
}

export const ClientInfo = ({ name, email, avatar }: ClientInfoProps) => {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <Avatar>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
    </div>
  );
}; 