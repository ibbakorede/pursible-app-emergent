import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ResponsiveTable from '@/components/admin/ResponsiveTable';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => base44.entities.User.list() });

  const filtered = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  const columns = [
    { key: 'user', label: 'User' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'joined', label: 'Joined' },
  ];

  const renderRow = (user) => (
    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50 focus-within:bg-primary/5 transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{user.full_name?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <span className="font-medium">{user.full_name || 'Unknown'}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground">{user.email}</td>
      <td className="px-4 py-4"><Badge variant="secondary" className="capitalize">{user.role || 'user'}</Badge></td>
      <td className="px-4 py-4 text-sm text-muted-foreground">{user.created_date ? format(new Date(user.created_date), 'MMM d, yyyy') : '-'}</td>
    </tr>
  );

  const renderCard = (user) => (
    <>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary">{user.full_name?.[0]?.toUpperCase() || '?'}</span>
        </div>
        <div>
          <p className="font-semibold">{user.full_name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Role:</span>
        <Badge variant="secondary" className="capitalize">{user.role || 'user'}</Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Joined:</span>
        <span>{user.created_date ? format(new Date(user.created_date), 'MMM d, yyyy') : '-'}</span>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input 
            placeholder="Search users..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" 
            aria-label="Search users by name or email"
          />
        </div>
      </div>

      <ResponsiveTable 
        columns={columns}
        data={filtered}
        renderRow={renderRow}
        renderCard={renderCard}
      />
    </div>
  );
}