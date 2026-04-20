import React from 'react';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark">View performance metrics and download reports.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Revenue Overview</h2>
              <div className="flex items-center gap-2 text-sm text-text-muted-light dark:text-text-muted-dark bg-background-light dark:bg-background-dark px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark">
                <Calendar className="w-4 h-4" /> This Month
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {[40, 60, 45, 80, 55, 90, 75].map((height, i) => (
                <div key={i} className="w-full bg-primary/20 rounded-t-sm relative group">
                  <div 
                    className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-500" 
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded transition-opacity">
                    ${height * 100}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-text-muted-light dark:text-text-muted-dark">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Key Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Occupancy Rate</div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">+5% from last month</div>
                  </div>
                </div>
                <div className="text-xl font-bold">82%</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Avg. Revenue/User</div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">+12% from last month</div>
                  </div>
                </div>
                <div className="text-xl font-bold">$420</div>
                 {/* test1 */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
