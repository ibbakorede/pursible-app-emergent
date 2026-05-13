import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { FileText, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_BACKEND_URL;

async function fetchAuditLogs({ page, pageSize, actionType, targetResourceType }) {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('page_size', pageSize);
  if (actionType && actionType !== 'all') params.append('action_type', actionType);
  if (targetResourceType && targetResourceType !== 'all') params.append('target_resource_type', targetResourceType);

  const response = await fetch(`${API_URL}/api/admin/audit-logs?${params}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }
  
  return response.json();
}

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [actionType, setActionType] = useState('all');
  const [targetResourceType, setTargetResourceType] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-audit-logs', page, pageSize, actionType, targetResourceType],
    queryFn: () => fetchAuditLogs({ page, pageSize, actionType, targetResourceType }),
  });

  const logs = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <Card className="p-6 text-center text-red-500">
          Failed to load audit logs. Please try again.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <span className="text-sm text-muted-foreground">{total} total entries</span>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="kyc.approve">KYC Approve</SelectItem>
              <SelectItem value="kyc.reject">KYC Reject</SelectItem>
              <SelectItem value="withdrawal.approve">Withdrawal Approve</SelectItem>
              <SelectItem value="withdrawal.reject">Withdrawal Reject</SelectItem>
              <SelectItem value="user.freeze">User Freeze</SelectItem>
              <SelectItem value="user.unfreeze">User Unfreeze</SelectItem>
              <SelectItem value="system.test">System Test</SelectItem>
            </SelectContent>
          </Select>
          <Select value={targetResourceType} onValueChange={setTargetResourceType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Resource Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="KYCRecord">KYC Records</SelectItem>
              <SelectItem value="Transaction">Transactions</SelectItem>
              <SelectItem value="User">Users</SelectItem>
              <SelectItem value="Wallet">Wallets</SelectItem>
              <SelectItem value="System">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {logs.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="No audit logs" 
          description="Admin actions will be recorded here when admins perform KYC approvals, withdrawals, and other sensitive operations." 
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm font-medium">{log.admin_email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {log.action_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.target_resource_type}
                      {log.target_resource_id && (
                        <span className="text-muted-foreground ml-1">
                          #{log.target_resource_id.slice(0, 8)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.reason || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {log.created_at ? format(new Date(log.created_at), 'MMM d, h:mm a') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
