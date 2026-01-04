import { useState, useMemo } from 'react';
import { useQuotations } from '@/hooks/useQuotations';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { QuotationTable } from '@/components/quotations/QuotationTable';
import { QuotationForm } from '@/components/forms/QuotationForm';
import { QuotationPreview } from '@/components/quotations/QuotationPreview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Send, CheckCircle, Clock } from 'lucide-react';
import { Quotation } from '@/types/quotation';
import { UserRole } from '@/types/permissions';

function TableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Quotations() {
  const { quotations, isLoading } = useQuotations();
  const { roles } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);

  const userRoles = (roles || []) as UserRole[];
  const canCreate = userRoles.includes('admin') || userRoles.includes('pricing');

  const filteredQuotations = useMemo(() => {
    if (activeTab === 'all') return quotations;
    return quotations.filter(q => q.status === activeTab);
  }, [quotations, activeTab]);

  const stats = useMemo(() => ({
    draft: quotations.filter(q => q.status === 'draft').length,
    issued: quotations.filter(q => q.status === 'issued').length,
    accepted: quotations.filter(q => q.status === 'accepted').length,
    expired: quotations.filter(q => q.status === 'expired').length,
  }), [quotations]);

  const handleView = (quotation: Quotation) => {
    setPreviewQuotation(quotation);
  };

  const handleEdit = (quotation: Quotation) => {
    setEditQuotation(quotation);
    setFormOpen(true);
  };

  const handleGeneratePDF = (quotation: Quotation) => {
    setPreviewQuotation(quotation);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditQuotation(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Quotations"
        description="Generate and manage formal quotations for clients"
        action={
          canCreate && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Quotation
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Drafts"
          value={stats.draft}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          title="Issued"
          value={stats.issued}
          icon={<Send className="h-4 w-4" />}
        />
        <StatCard
          title="Accepted"
          value={stats.accepted}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Expired"
          value={stats.expired}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({quotations.length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
          <TabsTrigger value="issued">Issued ({stats.issued})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({stats.accepted})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({stats.expired})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <QuotationTable
          quotations={filteredQuotations}
          onView={handleView}
          onEdit={canCreate ? handleEdit : undefined}
          onGeneratePDF={handleGeneratePDF}
        />
      )}

      {/* Forms */}
      <QuotationForm
        open={formOpen}
        onOpenChange={handleFormClose}
        quotation={editQuotation}
      />

      <QuotationPreview
        quotation={previewQuotation}
        open={!!previewQuotation}
        onOpenChange={(open) => !open && setPreviewQuotation(null)}
      />
    </div>
  );
}
