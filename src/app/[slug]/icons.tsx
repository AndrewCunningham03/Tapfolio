import type { SocialNetwork } from "@/lib/profiles";

type IconProps = { d: React.ReactNode; fill?: boolean };

function Icon({ d, fill }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? undefined : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}

export const AddContactIcon = () => (
  <Icon d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>} />
);
export const PhoneIcon = () => (
  <Icon d={<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />} />
);
export const MobileIcon = () => <Icon d={<><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></>} />;
export const TextIcon = () => <Icon d={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />;
export const MailIcon = () => <Icon d={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>} />;
export const GlobeIcon = () => (
  <Icon d={<><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></>} />
);
export const PinIcon = () => (
  <Icon d={<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>} />
);

export const SOCIAL_ICONS: Record<SocialNetwork, { label: string; icon: React.ReactNode }> = {
  facebook: { label: "Facebook", icon: <Icon fill d={<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z" />} /> },
  instagram: {
    label: "Instagram",
    icon: <Icon d={<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>} />,
  },
  linkedin: {
    label: "LinkedIn",
    icon: <Icon fill d={<path d="M4 9h4v12H4zM6 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 9h4v1.7c.6-1 1.9-2 3.8-2C21 8.7 22 10.8 22 14v7h-4v-6.2c0-1.5-.3-2.8-2-2.8s-2 1.3-2 2.8V21h-4z" />} />,
  },
  tiktok: {
    label: "TikTok",
    icon: <Icon fill d={<path d="M16.5 3c.4 2.2 1.8 3.6 4 3.9v3.2a7.6 7.6 0 0 1-4-1.2v6.6A6.5 6.5 0 1 1 10 9v3.3a3.2 3.2 0 1 0 3.2 3.2V3z" />} />,
  },
  x: { label: "X", icon: <Icon fill d={<path d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9zm-1.1 16.2h1.7L7.4 4.7H5.6z" />} /> },
  whatsapp: {
    label: "WhatsApp",
    icon: <Icon fill d={<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.2.5.2.5.3.1.2.1.7-.1 1.3z" />} />,
  },
};
