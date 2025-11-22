'use client';

import { useMemo, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, X, Calendar, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
} from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface IReservation {
  id: string;
  event_name: string;
  space_name: string;
  space_location?: string;
  date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
}

export function RecentReservationsList() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const result = await apiFetch('/api/reservations/my/', {
          method: 'GET',
        });

        if (result.response?.ok && result.data) {
          let data: any[] = [];
          if (Array.isArray(result.data)) {
            data = result.data;
          } else if (result.data.results && Array.isArray(result.data.results)) {
            data = result.data.results;
          }

          setReservations(data.slice(0, 10)); // Limiter à 10 réservations récentes
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery) return reservations;
    return reservations.filter(
      (item) =>
        item.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.space_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, reservations]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
      paid: { label: 'Payée', variant: 'success' },
      pending: { label: 'En attente', variant: 'warning' },
      draft: { label: 'Brouillon', variant: 'secondary' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' as const };
    return (
      <Badge size="sm" variant={statusInfo.variant} appearance="light">
        {statusInfo.label}
      </Badge>
    );
  };

  const columns = useMemo<ColumnDef<IReservation>[]>(
    () => [
      {
        id: 'event_name',
        accessorFn: (row) => row.event_name,
        header: ({ column }) => (
          <DataGridColumnHeader title="Événement" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-2">
            <span className="leading-none font-medium text-sm text-mono hover:text-primary">
              {row.original.event_name}
            </span>
            <span className="text-sm text-secondary-foreground font-normal leading-3">
              {row.original.space_name}
            </span>
          </div>
        ),
        enableSorting: true,
        size: 280,
      },
      {
        id: 'date',
        accessorFn: (row) => row.date,
        header: ({ column }) => (
          <DataGridColumnHeader title="Date" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <span>{formatDate(row.original.date)}</span>
          </div>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        id: 'time',
        accessorFn: (row) => row.start_time,
        header: ({ column }) => (
          <DataGridColumnHeader title="Horaire" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="size-4 text-muted-foreground" />
            <span>
              {formatTime(row.original.start_time)} -{' '}
              {formatTime(row.original.end_time)}
            </span>
          </div>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title="Statut" column={column} />
        ),
        cell: ({ row }) => getStatusBadge(row.original.status),
        enableSorting: true,
        size: 120,
      },
      {
        id: 'total_price',
        accessorFn: (row) => row.total_price,
        header: ({ column }) => (
          <DataGridColumnHeader title="Montant" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-mono">
            {row.original.total_price.toLocaleString('fr-FR')} XOF
          </span>
        ),
        enableSorting: true,
        size: 120,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: IReservation) => row.id,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DataGrid
      table={table}
      recordCount={filteredData?.length || 0}
      tableLayout={{
        columnsPinnable: true,
        columnsMovable: true,
        columnsVisibility: false,
        cellBorder: true,
      }}
    >
      <Card className="min-w-full h-full">
        <CardHeader className="py-3.5">
          <CardTitle>Réservations récentes</CardTitle>
          <CardToolbar className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 w-40"
            />
            {searchQuery.length > 0 && (
              <Button
                mode="icon"
                variant="ghost"
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X />
              </Button>
            )}
          </CardToolbar>
        </CardHeader>
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter className="flex justify-between">
          <DataGridPagination />
          <Button variant="outline" asChild>
            <Link href="/dashboard?tab=reservations">Voir tout</Link>
          </Button>
        </CardFooter>
      </Card>
    </DataGrid>
  );
}

