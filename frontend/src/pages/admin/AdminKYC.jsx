import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminKYC() {
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: kycs = [], isLoading } = useQuery({ queryKey: ['admin-kycs'], queryFn: () => base44.entities.KYCRecord.list('-created_date') });

  const updateKYC = useMutation({
    mutationFn: ({ id, data }) => base44.entities.KYCRecord.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-kycs'] }); setSelected(null); toast.success('KYC updated'); },
  });

  const filtered = kycs.filter(k => statusFilter === 'all' || k.status === statusFilter);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">KYC Management</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>ID Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(k => (
              <TableRow key={k.id} className="hover:bg-muted/50 focus-within:bg-primary/5 transition-colors">
                <TableCell className="text-sm">{k.user_email}</TableCell>
                <TableCell className="font-medium">{k.full_name || '-'}</TableCell>
                <TableCell className="capitalize text-sm">{k.id_type?.replace(/_/g, ' ') || '-'}</TableCell>
                <TableCell><StatusBadge status={k.status} type="kyc" /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{k.created_date ? format(new Date(k.created_date), 'MMM d, yyyy') : '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelected(k)}
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label="View KYC details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {(k.status === 'pending' || k.status === 'in_review') && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background" 
                          onClick={() => updateKYC.mutate({ id: k.id, data: { status: 'approved', reviewer_email: user?.email, reviewed_at: new Date().toISOString() } })}
                          aria-label="Approve KYC"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background" 
                          onClick={() => { setSelected(k); setRejectReason(''); }}
                          aria-label="Reject KYC"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>KYC Review — {selected?.full_name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selected.user_email}</p></div>
                <div><p className="text-muted-foreground">DOB</p><p className="font-medium">{selected.date_of_birth || '-'}</p></div>
                <div><p className="text-muted-foreground">Nationality</p><p className="font-medium">{selected.nationality || '-'}</p></div>
                <div><p className="text-muted-foreground">ID Type</p><p className="font-medium capitalize">{selected.id_type?.replace(/_/g, ' ') || '-'}</p></div>
                <div><p className="text-muted-foreground">ID Number</p><p className="font-medium">{selected.id_number || '-'}</p></div>
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={selected.status} type="kyc" /></div>
              </div>
              {selected.id_document_url && (
                <div><p className="text-sm text-muted-foreground mb-1">ID Document</p><img src={selected.id_document_url} alt="ID" className="rounded-lg max-h-48 object-contain" /></div>
              )}
              {selected.selfie_url && (
                <div><p className="text-sm text-muted-foreground mb-1">Selfie</p><img src={selected.selfie_url} alt="Selfie" className="rounded-lg max-h-48 object-contain" /></div>
              )}
              {(selected.status === 'pending' || selected.status === 'in_review') && (
                <div className="space-y-3 border-t pt-3">
                  <Textarea placeholder="Rejection reason (required for rejection)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateKYC.mutate({ id: selected.id, data: { status: 'approved', reviewer_email: user?.email, reviewed_at: new Date().toISOString() } })}>
                      Approve
                    </Button>
                    <Button className="flex-1" variant="destructive" disabled={!rejectReason} onClick={() => updateKYC.mutate({ id: selected.id, data: { status: 'rejected', rejection_reason: rejectReason, reviewer_email: user?.email, reviewed_at: new Date().toISOString() } })}>
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}