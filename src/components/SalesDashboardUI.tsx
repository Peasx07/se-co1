'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, ChevronDown, Loader2, Download, X } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface SalesDashboardUIProps {
  role?: string;
}

export default function SalesDashboardUI({ role }: SalesDashboardUIProps) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('All Year');
  const [selectedCoworking, setSelectedCoworking] = useState('all');
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [coworkingSpaces, setCoworkingSpaces] = useState<any[]>([]);

  // เปิด / ปิด กราฟ
  const [showLine, setShowLine] = useState(true);
  const [showBars, setShowBars] = useState(true);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportSort, setExportSort] = useState<
    'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
  >('date-desc');
  const [exportLimit, setExportLimit] = useState<'10' | '50' | 'all' | 'custom'>('all');
  const [customLimit, setCustomLimit] = useState<string>('');
  const [exportData, setExportData] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const API_URL = 'https://backend-august-pen-gay.onrender.com/api/v1';

  const years = ['2026', '2025', '2024'];

  const months = [
    'All Year',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  useEffect(() => {
    const fetchCoworkingSpaces = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        };
        const res = await axios.get(`${API_URL}/coworkings`, config);
        if (res.data.success) {
          setCoworkingSpaces(res.data.data || []);
        } else {
          setCoworkingSpaces([]);
        }
      } catch (error) {
        console.error('Error fetching coworking spaces:', error);
        setCoworkingSpaces([]);
      }
    };

    fetchCoworkingSpaces();
  }, []);

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        };

        const monthParam =
          selectedMonth === 'All Year'
            ? 'all'
            : (new Date(`${selectedMonth} 1, 2000`).getMonth() + 1).toString();

        const coworkingParam =
          selectedCoworking === 'all' ? '' : `&coworking=${selectedCoworking}`;

        const res = await axios.get(
          `${API_URL}/sales?year=${selectedYear}&month=${monthParam}${coworkingParam}`,
          config
        );

        if (res.data.success) {
          setSalesData(res.data.data || []);
        } else {
          setSalesData([]);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
        setSalesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [selectedYear, selectedMonth, selectedCoworking]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handleCoworkingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCoworking(e.target.value);
  };

  const chartData = salesData.map((item) => ({
    ...item,
    barValue: Math.max(0, Number(item.total ?? 0)),
    lineValue: Math.max(0, Number(item.total ?? 0)),
  }));

  const formatYAxisCurrency = (value: number) => {
    if (Math.abs(value) < 1000) return `฿${Math.round(value)}`;
    return `฿${(value / 1000).toFixed(1)}k`;
  };

  const fetchExportData = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      };

      const res = await axios.get(`${API_URL}/reservations`, config);

      if (res.data.success) {
        let data = res.data.data || [];

        const startDate = new Date(`${selectedYear}-01-01`);
        const endDate = new Date(`${selectedYear}-12-31`);
        endDate.setHours(23, 59, 59, 999);

        data = data.filter((item: any) => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate && itemDate <= endDate;
        });

        if (selectedMonth !== 'All Year') {
          const monthNum = new Date(`${selectedMonth} 1, 2000`).getMonth() + 1;
          data = data.filter((item: any) => {
            const itemDate = new Date(item.date);
            return itemDate.getMonth() + 1 === monthNum;
          });
        }

        if (selectedCoworking !== 'all') {
          data = data.filter((item: any) => {
            const itemCoworkingId = item.coworking?._id || item.coworking;
            return String(itemCoworkingId) === String(selectedCoworking);
          });
        }

        data = data.map((item: any) => {
          let amount = 0;

          if (
            item.coworking &&
            item.coworking.price_per_hour &&
            item.startTime &&
            item.endTime
          ) {
            const [startH, startM] = item.startTime.split(':').map(Number);
            const [endH, endM] = item.endTime.split(':').map(Number);

            let hours = (endH + endM / 60) - (startH + startM / 60);
            if (hours < 0) hours += 24;
            if (hours > 0) amount = hours * item.coworking.price_per_hour;
          }

          return { ...item, amount };
        });

        setExportData(data);
      } else {
        setExportData([]);
      }
    } catch (error) {
      console.error('Error fetching export data:', error);
      setExportData([]);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportClick = () => {
    fetchExportData();
    setIsExportModalOpen(true);
  };

  const handleExport = () => {
    let dataToExport = [...exportData];

    dataToExport = dataToExport.sort((a: any, b: any) => {
      if (exportSort === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (exportSort === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (exportSort === 'amount-desc') return (b.amount || 0) - (a.amount || 0);
      if (exportSort === 'amount-asc') return (a.amount || 0) - (b.amount || 0);
      return 0;
    });

    const limitValue =
      exportLimit === 'all'
        ? dataToExport.length
        : exportLimit === 'custom'
          ? parseInt(customLimit) || dataToExport.length
          : parseInt(exportLimit);

    if (limitValue > 0 && limitValue < dataToExport.length) {
      dataToExport = dataToExport.slice(0, limitValue);
    }

    setExportData(dataToExport);

    setTimeout(() => {
      if (exportFormat === 'csv') {
        exportToCSV(dataToExport);
      } else {
        exportToPDF(dataToExport);
      }
      setIsExportModalOpen(false);
    }, 50);
  };

  const exportToCSV = (data: any[] = exportData) => {
    const headers = ['Date/Month', 'Coworking Space Name', 'Total Sales'];
    const rows = data.map((item) => [
      selectedMonth === 'All Year' ? item.date : item.date,
      item.coworking?.name || 'N/A',
      item.amount?.toFixed(2) || '0',
    ]);

    const totalRevenue = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    rows.push(['', 'Total Revenue', totalRevenue.toFixed(2)]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales-report-${selectedYear}-${selectedMonth}.csv`;
    link.click();
  };

  const exportToPDF = (data: any[] = exportData) => {
    const totalRevenue = data.reduce((sum, item) => sum + (item.amount || 0), 0);

    const generatedDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Summary Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
          body {
            font-family: 'Sarabun', sans-serif;
            padding: 40px;
            margin: 0;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #ea580c;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #ea580c;
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: 700;
          }
          .header p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #ea580c;
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .total-row {
            background-color: #ea580c !important;
            color: white;
            font-weight: 700;
          }
          .total-row td {
            border: 2px solid #ea580c;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sales Summary Report</h1>
          <p>Selected Year/Month: ${
            selectedMonth === 'All Year'
              ? `All Year ${selectedYear}`
              : `${selectedMonth} ${selectedYear}`
          }</p>
          <p>Generated Date: ${generatedDate}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date/Month</th>
              <th>Coworking Space Name</th>
              <th>Total Sales</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (item) => `
              <tr>
                <td>${selectedMonth === 'All Year' ? item.date : item.date}</td>
                <td>${item.coworking?.name || 'N/A'}</td>
                <td>฿${(item.amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</td>
              </tr>
            `
              )
              .join('')}
            <tr class="total-row">
              <td colspan="2">Total Revenue</td>
              <td>฿${totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (role !== 'admin' && role !== 'Admin') {
    return null;
  }

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
            Sales Dashboard Filters
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBars((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 border border-border-light dark:border-border-dark text-text-light dark:text-text-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            {showBars ? 'Hide Bars' : 'Show Bars'}
          </button>

          <button
            onClick={() => setShowLine((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 border border-border-light dark:border-border-dark text-text-light dark:text-text-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            {showLine ? 'Hide Line' : 'Show Line'}
          </button>

          <button
            onClick={handleExportClick}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-2">
            Year
          </label>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="w-full pl-4 pr-10 py-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm font-medium text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer appearance-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-2">
            Month
          </label>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="w-full pl-4 pr-10 py-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm font-medium text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer appearance-none"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-2">
            Co-working Space
          </label>
          <div className="relative">
            <select
              value={selectedCoworking}
              onChange={handleCoworkingChange}
              className="w-full pl-4 pr-10 py-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm font-medium text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer appearance-none"
            >
              <option value="all">All Spaces</option>
              {coworkingSpaces.map((space) => (
                <option key={space._id} value={space._id}>
                  {space.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
          Current Filter:{' '}
          <span className="font-medium text-text-light dark:text-text-dark">
            {selectedMonth} {selectedYear}
          </span>
        </p>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-semibold text-text-light dark:text-text-dark">
            {selectedMonth === 'All Year' ? 'Monthly Revenue' : 'Daily Revenue'}
          </h4>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>

        <div className="w-full h-96 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : chartData.length > 0 && (showBars || showLine) ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255, 255, 255, 0.06)"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#d1d5db' }}
                  dy={10}
                  interval={0}
                />

                <YAxis
                  tick={{ fontSize: 12, fill: '#d1d5db' }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={8}
                  minTickGap={10}
                  domain={[0, 'auto']}
                  tickFormatter={formatYAxisCurrency}
                />

                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const barValue = Number(
                        payload.find((p: any) => p.dataKey === 'barValue')?.value ?? 0
                      );
                      const lineValue = Number(
                        payload.find((p: any) => p.dataKey === 'lineValue')?.value ?? 0
                      );

                      return (
                        <div className="bg-gray-800 dark:bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg shadow-xl">
                          {showBars && (
                            <p className="text-sm font-bold text-white">
                              Bar: ฿
                              {barValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          )}
                          {showLine && (
                            <p className="text-sm font-bold text-yellow-300">
                              Line: ฿
                              {lineValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {payload[0].payload?.name}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {showBars && (
                  <Bar dataKey="barValue" radius={[4, 4, 0, 0]} barSize={42}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill="#ea580c"
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    ))}
                  </Bar>
                )}

                {showLine && (
                  <Line
                    type="linear"
                    dataKey="lineValue"
                    stroke="#facc15"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: '#facc15',
                      stroke: '#111827',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: '#ffffff',
                      stroke: '#facc15',
                      strokeWidth: 2,
                    }}
                    connectNulls
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted-light dark:text-text-muted-dark">
              <p className="text-sm">
                {!chartData.length
                  ? 'No sales data available for the selected period'
                  : 'Both chart types are hidden'}
              </p>
            </div>
          )}
        </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
                Export Report
              </h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-2">
                Format
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                    className="text-primary"
                  />
                  <span className="text-sm text-text-light dark:text-text-dark">CSV</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                    className="text-primary"
                  />
                  <span className="text-sm text-text-light dark:text-text-dark">PDF</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-2">
                Sort By
              </label>
              <select
                value={exportSort}
                onChange={(e) => setExportSort(e.target.value as any)}
                className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-2">
                Row Limit
              </label>
              <select
                value={exportLimit}
                onChange={(e) => setExportLimit(e.target.value as any)}
                className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="10">Top 10</option>
                <option value="50">Top 50</option>
                <option value="all">All</option>
                <option value="custom">Custom</option>
              </select>
              {exportLimit === 'custom' && (
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  placeholder="Enter number of rows"
                  className="mt-2 w-full px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-sm font-medium text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? 'Loading...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={pdfRef} className="hidden" />
    </div>
  );
}