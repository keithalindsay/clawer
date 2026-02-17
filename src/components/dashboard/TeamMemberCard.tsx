import Link from 'next/link';

interface TeamMemberCardProps {
  member: {
    id: string;
    name: string;
    role: string;
    emoji?: string;
    description?: string;
  };
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <Link
      href={`/dashboard/employees/${member.id}`}
      className="block border rounded-xl p-5 transition-shadow duration-200 shadow-sm hover:shadow-md"
      style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
    >
      <div className="flex items-center gap-4">
        {/* Emoji Avatar */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: '#f1f5f9' }}
        >
          {member.emoji || '🤖'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg" style={{ color: '#0f172a' }}>
            {member.name}
          </h3>
          <p className="text-sm font-medium" style={{ color: '#2563eb' }}>
            {member.role}
          </p>
          {member.description && (
            <p className="text-xs mt-1 line-clamp-1" style={{ color: '#94a3b8' }}>
              {member.description}
            </p>
          )}
        </div>

        {/* Status + Chat */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#16a34a' }} />
            <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Online</span>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: '#2563eb' }}
          >
            💬 Chat
          </span>
        </div>
      </div>
    </Link>
  );
}
