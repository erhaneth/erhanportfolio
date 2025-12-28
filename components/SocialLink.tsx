import React from 'react';

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SocialLink: React.FC<SocialLinkProps> = ({ href, icon, label }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-center gap-2 px-3 py-1.5 border border-[#003B00] hover:border-[#00FF41] transition-all duration-200"
      aria-label={label}
    >
      <span className="text-[#008F11] group-hover:text-[#00FF41] transition-colors">
        {icon}
      </span>
      <span className="text-[9px] text-[#008F11] group-hover:text-[#00FF41] uppercase tracking-wider font-bold transition-colors">
        {label}
      </span>
    </a>
  );
};

export default SocialLink;

