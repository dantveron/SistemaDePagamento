"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  Search,
  Bell,
  Settings,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface DashboardData {
  overview: {
    totalRevenue: number;
    totalTransactions: number;
    successRate: number;
    averageTicket: number;
    growth: {
      revenue: number;
      transactions: number;
      successRate: number;
      averageTicket: number;
    };
  };
  revenueChart: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  paymentMethods: Array<{
    method: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  recentTransactions: Array<{
    id: string;
    customer: string;
    amount: number;
    method: string;
    status: 'approved' | 'pending' | 'declined';
    date: string;
  }>;
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: string;
  }>;
}

export function MerchantDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    // Simular carregamento de dados
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setData({
      overview: {
        totalRevenue: 125430.50,
        totalTransactions: 1247,
        successRate: 98.2,
        averageTicket: 100.58,
        growth: {
          revenue: 12.5,
          transactions: 8.3,
          successRate: 0.5,
          averageTicket: -2.1
        }
      },
      revenueChart: [
        { date: '01/01', revenue: 12500, transactions: 125 },
        { date: '02/01', revenue: 15200, transactions: 142 },
        { date: '03/01', revenue: 18900, transactions: 167 },
        { date: '04/01', revenue: 16800, transactions: 156 },
        { date: '05/01', revenue: 21300, transactions: 189 },
        { date: '06/01', revenue: 19600, transactions: 178 },
        { date: '07/01', revenue: 23100, transactions: 201 }
      ],
      paymentMethods: [
        { method: 'Cartão de Crédito', value: 65430, percentage: 52.2, color: '#3B82F6' },
        { method: 'PIX', value: 35200, percentage: 28.1, color: '#10B981' },
        { method: 'Cartão de Débito', value: 18900, percentage: 15.1, color: '#F59E0B' },
        { method: 'Boleto', value: 5900, percentage: 4.7, color: '#EF4444' }
      ],
      recentTransactions: [
        {
          id: 'tx_001',
          customer: 'João Silva',
          amount: 299.90,
          method: 'Cartão de Crédito',
          status: 'approved',
          date: '2025-01-13 14:30'
        },
        {
          id: 'tx_002',
          customer: 'Maria Santos',
          amount: 150.00,
          method: 'PIX',
          status: 'approved',
          date: '2025-01-13 14:25'
        },
        {
          id: 'tx_003',
          customer: 'Pedro Costa',
          amount: 89.90,
          method: 'Cartão de Débito',
          status: 'pending',
          date: '2025-01-13 14:20'
        },
        {
          id: 'tx_004',
          customer: 'Ana Oliveira',
          amount: 450.00,
          method: 'Boleto',
          status: 'declined',
          date: '2025-01-13 14:15'
        }
      ],
      alerts: [
        {
          id: 'alert_001',
          type: 'warning',
          message: 'Taxa de chargeback acima do normal (2.1%)',
          timestamp: '2025-01-13 14:00'
        },
        {
          id: 'alert_002',
          type: 'success',
          message: 'Meta mensal de vendas atingida!',
          timestamp: '2025-01-13 12:00'
        },
        {
          id: 'alert_003',
          type: 'info',
          message: 'Nova funcionalidade: Relatórios personalizados disponíveis',
          timestamp: '2025-01-13 10:00'
        }
      ]
    });
    
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'declined': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'declined': return <AlertTriangle size={16} />;
      default: return null;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'error': return <AlertTriangle size={16} className="text-red-600" />;
      default: return <Bell size={16} className="text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Visão geral das suas vendas e transações</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Período */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1d">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>

            {/* Alertas */}
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <Bell size={24} />
              {data.alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {data.alerts.length}
                </span>
              )}
            </button>

            {/* Atualizar */}
            <button
              onClick={loadDashboardData}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <RefreshCw size={24} />
            </button>

            {/* Configurações */}
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Settings size={24} />
            </button>
          </div>
        </div>

        {/* Alertas dropdown */}
        {showAlerts && (
          <div className="absolute right-6 top-20 bg-white rounded-lg shadow-lg border border-gray-200 w-80 z-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Notificações</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {data.alerts.map((alert) => (
                <div key={alert.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.overview.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {data.overview.growth.revenue > 0 ? (
              <ArrowUpRight size={16} className="text-green-600" />
            ) : (
              <ArrowDownRight size={16} className="text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              data.overview.growth.revenue > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(data.overview.growth.revenue)}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs período anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transações</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.overview.totalTransactions.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {data.overview.growth.transactions > 0 ? (
              <ArrowUpRight size={16} className="text-green-600" />
            ) : (
              <ArrowDownRight size={16} className="text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              data.overview.growth.transactions > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(data.overview.growth.transactions)}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs período anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.overview.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {data.overview.growth.successRate > 0 ? (
              <ArrowUpRight size={16} className="text-green-600" />
            ) : (
              <ArrowDownRight size={16} className="text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              data.overview.growth.successRate > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(data.overview.growth.successRate)}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs período anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.overview.averageTicket)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ShoppingCart size={24} className="text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {data.overview.growth.averageTicket > 0 ? (
              <ArrowUpRight size={16} className="text-green-600" />
            ) : (
              <ArrowDownRight size={16} className="text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              data.overview.growth.averageTicket > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(data.overview.growth.averageTicket)}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs período anterior</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de receita */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Receita e Transações</h2>
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <Download size={16} />
              Exportar
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value as number) : value,
                  name === 'revenue' ? 'Receita' : 'Transações'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.1}
              />
              <Line 
                type="monotone" 
                dataKey="transactions" 
                stroke="#10B981" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de pagamento */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Métodos de Pagamento</h2>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.paymentMethods}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
              >
                {data.paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-3 mt-4">
            {data.paymentMethods.map((method) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: method.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{method.method}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(method.value)}
                  </p>
                  <p className="text-xs text-gray-500">{method.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transações recentes */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Transações Recentes</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar transações..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter size={16} />
                Filtros
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.id}</p>
                      <p className="text-sm text-gray-500">{transaction.customer}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{transaction.method}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      {transaction.status === 'approved' && 'Aprovada'}
                      {transaction.status === 'pending' && 'Pendente'}
                      {transaction.status === 'declined' && 'Recusada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{transaction.date}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

