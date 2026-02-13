'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Image,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface Dispute {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  status: 'OPEN' | 'AI_RULED' | 'ADMIN_OVERRIDDEN' | 'RESOLVED';
  customerEvidenceText: string | null;
  customerEvidencePhotos: string[];
  providerEvidenceText: string | null;
  providerEvidencePhotos: string[];
  aiRuling: string | null;
  aiRulingInFavor: string | null;
  adminOverrideRuling: string | null;
  adminOverrideInFavor: string | null;
  refundAmount: number | null;
  createdAt: string;
  resolvedAt: string | null;
  booking: {
    amount: number;
    customer: { name: string; phone: string } | null;
    provider: { name: string; phone: string } | null;
    service: { name: string } | null;
  };
}

interface DisputesResponse {
  data: Dispute[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface OverrideDTO {
  ruling: string;
  inFavor: 'customer' | 'provider';
  refundAmount?: number;
}

export default function DisputesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryClient = useQueryClient();

  // Fetch disputes
  const { data, isLoading, error } = useQuery<DisputesResponse>({
    queryKey: ['admin-disputes', page],
    queryFn: async () => {
      const response = await api.get('/admin/disputes', {
        params: { page, limit },
      });
      return response.data;
    },
  });

  // Override dispute mutation
  const overrideMutation = useMutation({
    mutationFn: ({
      disputeId,
      overrideData,
    }: {
      disputeId: string;
      overrideData: OverrideDTO;
    }) => api.patch(`/admin/disputes/${disputeId}/override`, overrideData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
  });

  const handleRefundCustomer = (dispute: Dispute) => {
    overrideMutation.mutate({
      disputeId: dispute.id,
      overrideData: {
        ruling: 'Admin override: full refund to customer',
        inFavor: 'customer',
      },
    });
  };

  const handleFavorProvider = (dispute: Dispute) => {
    overrideMutation.mutate({
      disputeId: dispute.id,
      overrideData: {
        ruling: 'Admin override: payment to provider',
        inFavor: 'provider',
      },
    });
  };

  const handlePartialRefund = (dispute: Dispute) => {
    const amount = dispute.booking?.amount || 0;
    overrideMutation.mutate({
      disputeId: dispute.id,
      overrideData: {
        ruling: 'Admin override: partial refund',
        inFavor: 'customer',
        refundAmount: Math.floor(amount * 0.5),
      },
    });
  };

  const disputes = data?.data || [];
  const meta = data?.meta;

  const openCount = disputes.filter((d) => d.status === 'OPEN').length;
  const resolvedCount = disputes.filter((d) => ['RESOLVED', 'ADMIN_OVERRIDDEN'].includes(d.status)).length;
  const totalAmount = disputes.reduce(
    (sum, d) => sum + (d.booking?.amount || 0),
    0
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
        <p className="text-gray-600 mt-2">
          Review and resolve customer-provider disputes with AI assistance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Open Disputes</p>
              <p className="text-2xl font-bold text-gray-900">{openCount}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{resolvedCount}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load disputes</p>
              <p className="text-sm text-gray-500 mt-2">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        ) : disputes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">No disputes found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispute
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AI Ruling
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disputes.map((dispute) => (
                    <>
                      <tr key={dispute.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {dispute.booking?.service?.name || 'Service Dispute'}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {dispute.customerEvidenceText || 'No description provided'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-gray-900">
                              Customer:{' '}
                              {dispute.booking?.customer?.name || 'N/A'}
                            </div>
                            <div className="text-gray-500">
                              Provider:{' '}
                              {dispute.booking?.provider?.name || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(dispute.booking?.amount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {dispute.aiRulingInFavor ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dispute.aiRulingInFavor === 'customer'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {dispute.aiRulingInFavor === 'customer' ? 'Customer' : 'Provider'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              dispute.status === 'RESOLVED'
                                ? 'bg-green-100 text-green-800'
                                : dispute.status === 'OPEN'
                                ? 'bg-yellow-100 text-yellow-800'
                                : dispute.status === 'AI_RULED'
                                ? 'bg-blue-100 text-blue-800'
                                : dispute.status === 'ADMIN_OVERRIDDEN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {dispute.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(dispute.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === dispute.id ? null : dispute.id
                              )
                            }
                            className="text-orange-600 hover:text-orange-900"
                          >
                            {expandedId === dispute.id ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Row */}
                      {expandedId === dispute.id && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              {/* AI Ruling */}
                              {dispute.aiRuling && (
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-5 w-5 text-purple-500" />
                                    <h4 className="font-semibold text-gray-900">
                                      AI Ruling
                                    </h4>
                                    {dispute.aiRulingInFavor && (
                                      <span className="ml-auto text-sm text-gray-600">
                                        In favor of: {dispute.aiRulingInFavor}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {dispute.aiRuling}
                                  </p>
                                </div>
                              )}

                              {/* Evidence */}
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {dispute.customerEvidenceText && (
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>Customer evidence provided</span>
                                  </div>
                                )}
                                {dispute.customerEvidencePhotos.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Image className="h-4 w-4" />
                                    <span>{dispute.customerEvidencePhotos.length} customer photos</span>
                                  </div>
                                )}
                              </div>

                              {/* Override Actions */}
                              {dispute.status === 'OPEN' && (
                                <div className="flex items-center gap-3 pt-2">
                                  <p className="text-sm font-medium text-gray-700">
                                    Override Actions:
                                  </p>
                                  <button
                                    onClick={() => handleRefundCustomer(dispute)}
                                    disabled={overrideMutation.isPending}
                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                  >
                                    Refund Customer
                                  </button>
                                  <button
                                    onClick={() => handleFavorProvider(dispute)}
                                    disabled={overrideMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    Favor Provider
                                  </button>
                                  <button
                                    onClick={() => handlePartialRefund(dispute)}
                                    disabled={overrideMutation.isPending}
                                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50"
                                  >
                                    Partial Refund (50%)
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(page - 1) * limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(page * limit, meta.total)}
                        </span>{' '}
                        of <span className="font-medium">{meta.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Page {page} of {meta.totalPages}
                        </span>
                        <button
                          onClick={() =>
                            setPage((p) => Math.min(meta.totalPages, p + 1))
                          }
                          disabled={page === meta.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
