import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ResponsiveTable({ columns, data, renderRow, renderCard }) {
  const isMobile = useIsMobile();

  if (isMobile && renderCard) {
    return (
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={item.id || idx} className="bg-card border border-border rounded-lg p-4 space-y-3">
            {renderCard(item)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className="whitespace-nowrap">{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, idx) => renderRow(item, idx))}
        </TableBody>
      </Table>
    </div>
  );
}