'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

type KycStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface Provider {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  isActive: boolean;
  createdAt: string;
  kycStatus: KycStatus;
  rating: number;
  totalJobs: number;
  providerProfile: {
    kycStatus: KycStatus;
    avgRating: number | null;
    providerServices: Array<{ service: { name: string } }>;
  } | null;
}

interface ProvidersResponse {
  data: Provider[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ProvidersPage() {
  const [kycStatusFilter, setKycStatusFilter] = useState<KycStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryClient = useQueryClient();

  // Fetch providers
  const { data, isLoading, error } = useQuery<ProvidersResponse>({
    queryKey: ['admin-providers', kycStatusFilter, page, searchTerm],
    queryFn: async () => {
      const params: any = { page, limit };
      if (kycStatusFilter !== 'ALL') {
        params.kycStatus = kycStatusFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await api.get('/admin/providers', { params });
      return response.data;
    },
  });

  // Approve KYC mutation
  const approveMutation = useMutation({
    mutationFn: (providerId: string) =>
      api.patch(`/admin/providers/${providerId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    },
  });

  // Suspend provider mutation
  const suspendMutation = useMutation({
    mutationFn: (providerId: string) =>
      api.patch(`/admin/providers/${providerId}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    },
  });

  // Activate provider mutation (same as approve)
  const activateMutation = useMutation({
    mutationFn: (providerId: string) =>
      api.patch(`/admin/providers/${providerId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    },
  });

  const providers = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Provider Management</h1>
        <p className="text-gray-600 mt-2">
          Manage service providers, KYC verification, and account status
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KYC Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KYC Status
            </label>
            <select
              value={kycStatusFilter}
              onChange={(e) => {
                setKycStatusFilter(e.target.value as KycStatus | 'ALL');
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load providers</p>
              <p className="text-sm text-gray-500 mt-2">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        ) : providers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">No providers found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KYC Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {provider.name || 'Unnamed'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {provider.totalJobs || 0} bookings
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{provider.email}</div>
                        <div className="text-sm text-gray-500">{provider.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            provider.kycStatus === 'VERIFIED'
                              ? 'bg-green-100 text-green-800'
                              : provider.kycStatus === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : provider.kycStatus === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {provider.kycStatus === 'VERIFIED' && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {provider.kycStatus === 'REJECTED' && (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {provider.kycStatus === 'PENDING' && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {provider.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">
                            {provider.rating?.toFixed(1) || 'N/A'}
                          </span>
                          {provider.rating && (
                            <span className="text-yellow-400 ml-1">★</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(provider.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            provider.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {provider.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/providers/${provider.id}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                          {provider.kycStatus === 'PENDING' && (
                            <button
                              onClick={() => approveMutation.mutate(provider.id)}
                              disabled={approveMutation.isPending}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Approve KYC
                            </button>
                          )}
                          {provider.isActive ? (
                            <button
                              onClick={() => suspendMutation.mutate(provider.id)}
                              disabled={suspendMutation.isPending}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => activateMutation.mutate(provider.id)}
                              disabled={activateMutation.isPending}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
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
