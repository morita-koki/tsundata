'use client';

import { useState } from 'react';

interface Stats {
  totalBooks: number;
  readBooks: number;
  unreadBooks: number;
  totalValue: number;
  unreadValue: number;
}

interface StatsDisplayProps {
  stats: Stats;
  title: string;
}

export default function StatsDisplay({ stats, title }: StatsDisplayProps) {

  const readPercentage = stats.totalBooks > 0 ? (stats.readBooks / stats.totalBooks) * 100 : 0;
  const unreadPercentage = 100 - readPercentage;

  const CircularProgress = ({ percentage, color, size = 120 }: { percentage: number; color: string; size?: number }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(229, 231, 235)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Math.round(percentage)}%</div>
          </div>
        </div>
      </div>
    );
  };

  const BarChart = ({ value, maxValue, color, label }: { value: number; maxValue: number; color: string; label: string }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{value.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    );
  };


  return (
    <div className="mb-8">
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* 読書進捗の円グラフ */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">読書進捗</h3>
          <div className="flex justify-center mb-4">
            <CircularProgress percentage={readPercentage} color="rgb(34, 197, 94)" size={100} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-green-600">{stats.readBooks}</div>
              <div className="text-xs text-gray-600">読了</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">{stats.unreadBooks}</div>
              <div className="text-xs text-gray-600">未読</div>
            </div>
          </div>
        </div>

        {/* 金額の棒グラフ */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">金額統計</h3>
          <div className="space-y-4">
            <div className="text-center mb-3">
              <div className="text-2xl font-bold text-purple-600">
                ¥{stats.totalValue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">総金額</div>
            </div>
            
            <BarChart
              value={stats.totalValue - stats.unreadValue}
              maxValue={stats.totalValue}
              color="rgb(34, 197, 94)"
              label="読了本金額"
            />
            
            <BarChart
              value={stats.unreadValue}
              maxValue={stats.totalValue}
              color="rgb(239, 68, 68)"
              label="未読本金額（積読コスト）"
            />
            
            {stats.unreadValue > 0 && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm font-semibold text-red-700">
                    積読率: {Math.round((stats.unreadValue / stats.totalValue) * 100)}%
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    ¥{stats.unreadValue.toLocaleString()} 分の本が未読です
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}