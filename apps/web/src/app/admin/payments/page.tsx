'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface PaymentsResponse {
  totalRevenue: number;
  totalCommission: number;
  pendingPayouts: number;
  completedPayouts: number;
}

export default function PaymentsPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const queryClient = useQueryClient();

  // Fetch payments data
  const { data, isLoading, error } = useQuery<PaymentsResponse>({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const response = await api.get('/admin/payments');
      return response.data;
    },
  });

  // Trigger batch payout mutation
  const batchPayoutMutation = useMutation({
    mutationFn: () => api.post('/admin/payouts/batch'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setToastMessage('Batch payout triggered successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
    onError: (error: any) => {
      setToastMessage(
        error?.response?.data?.message || 'Failed to trigger batch payout'
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
  });

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(data?.totalRevenue || 0),
      icon: DollarSign,
      color: 'bg-blue-500',
    },
    {
      label: 'Platform Commission',
      value: formatCurrency(data?.totalCommission || 0),
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Pending Payouts',
      value: formatCurrency(data?.pendingPayouts || 0),
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      label: 'Completed Payouts',
      value: formatCurrency(data?.completedPayouts || 0),
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-8">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 border-l-4 border-orange-500 max-w-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-500 mr-3" />
            <p className="text-sm text-gray-900">{toastMessage}</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments Overview</h1>
            <p className="text-gray-600 mt-2">
              Monitor revenue, commissions, and payouts
            </p>
          </div>
          <button
            onClick={() => batchPayoutMutation.mutate()}
            disabled={batchPayoutMutation.isPending}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {batchPayoutMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-5 w-5" />
                Trigger Batch Payout
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load payments data</p>
            <p className="text-sm text-gray-500 mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Provider Payout Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payout Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pending Payouts</p>
                    <p className="text-sm text-gray-500">Awaiting processing</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(data?.pendingPayouts || 0)}
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Completed Payouts</p>
                    <p className="text-sm text-gray-500">Successfully transferred</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(data?.completedPayouts || 0)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
