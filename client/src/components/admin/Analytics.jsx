import React, { useState, useEffect } from 'react';
import {
  Users,
  BarChart2,
  CheckCircle,
  X,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Loader,
  Activity,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import AdminNavbar from '../../navbar/adminNavbar';
import { API_URL } from '../../config';
import { Bar } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const calculateChange = (data) => {
  if (!data || data.length < 2)
    return {
      change: 0,
      icon: <TrendingUp size={16} className="text-zinc-400" />,
      color: 'text-zinc-400',
    };

  const latest = data[data.length - 1].registered;
  const previous = data[data.length - 2].registered;

  if (previous === 0)
    return {
      change: latest > 0 ? 100 : 0,
      icon: <TrendingUp size={16} className="text-emerald-400" />,
      color: 'text-emerald-400',
    };

  const percentage = ((latest - previous) / previous) * 100;

  if (percentage > 0) {
    return {
      change: percentage.toFixed(1),
      icon: <TrendingUp size={16} className="text-emerald-400" />,
      color: 'text-emerald-400',
    };
  } else if (percentage < 0) {
    return {
      change: Math.abs(percentage).toFixed(1),
      icon: <TrendingDown size={16} className="text-rose-400" />,
      color: 'text-rose-400',
    };
  }
  return {
    change: 0,
    icon: <TrendingUp size={16} className="text-zinc-400" />,
    color: 'text-zinc-400',
  };
};

const MonthlyUserChart = ({ data }) => {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Registered Users',
        data: data.map((d) => d.registered),
        backgroundColor: 'rgba(239, 68, 68, 0.65)', // Crimson-red
        borderColor: 'rgba(239, 68, 68, 0.9)',
        borderWidth: 1.5,
        borderRadius: 8,
      },
      {
        label: 'Active Learners',
        data: data.map((d) => d.active),
        backgroundColor: 'rgba(59, 130, 246, 0.65)', // Electric blue
        borderColor: 'rgba(59, 130, 246, 0.9)',
        borderWidth: 1.5,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e4e4e7',
          font: { family: "'Space Grotesk', system-ui, sans-serif", size: 12 },
          boxWidth: 12,
          usePointStyle: true,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 15, 18, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e4e4e7',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
        },
        ticks: {
          color: '#a1a1aa',
          font: { family: "'Space Grotesk', system-ui, sans-serif" },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#a1a1aa',
          font: { family: "'Space Grotesk', system-ui, sans-serif" },
        },
      },
    },
  };

  return (
    <div className="relative h-80 w-full">
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setAnalytics(result.data);
        } else {
          console.error('Failed to fetch analytics:', result.message);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="glass-page min-h-screen text-zinc-100 flex items-center justify-center">
        <AdminNavbar />
        <div className="text-center">
          <Loader size={36} className="animate-spin text-red-400 mx-auto" />
          <p className="mt-3 text-sm text-zinc-400">Loading system analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-page min-h-screen text-zinc-100 flex items-center justify-center">
        <AdminNavbar />
        <div className="surface-card p-8 text-center max-w-md">
          <X size={36} className="mx-auto text-rose-400" />
          <h2 className="mt-4 text-xl font-bold text-white">Could not load analytics data.</h2>
          <p className="text-zinc-400 text-sm mt-2">
            Please refresh or check administrator privileges.
          </p>
        </div>
      </div>
    );
  }

  const { totalUsers, activeUsers, instructors, learners, reportedPostsCount, monthlyData } =
    analytics;
  const userGrowthChange = calculateChange(monthlyData);
  const engagementRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(0) : 0;
  const instructorPercent = totalUsers > 0 ? ((instructors / totalUsers) * 100).toFixed(0) : 0;
  const learnerPercent = totalUsers > 0 ? ((learners / totalUsers) * 100).toFixed(0) : 0;

  const dataCards = [
    {
      title: 'Total Platform Users',
      value: totalUsers,
      icon: <Users size={20} className="text-blue-400" />,
      badgeBg: 'bg-blue-500/10 border-blue-400/25',
      footer: `${userGrowthChange.change}% vs. last month`,
      footerColor: userGrowthChange.color,
      footerIcon: userGrowthChange.icon,
    },
    {
      title: 'Active Learners',
      value: activeUsers,
      icon: <CheckCircle size={20} className="text-emerald-400" />,
      badgeBg: 'bg-emerald-500/10 border-emerald-400/25',
      footer: `${engagementRate}% engagement rate`,
      footerColor: 'text-zinc-400',
      footerIcon: <Activity size={16} className="text-emerald-400" />,
    },
    {
      title: 'Reported Flags',
      value: reportedPostsCount,
      icon: <MessageSquare size={20} className="text-rose-400" />,
      badgeBg: 'bg-rose-500/10 border-rose-400/25',
      footer: reportedPostsCount > 0 ? 'Requires attention' : 'Platform clean',
      footerColor: reportedPostsCount > 0 ? 'text-rose-400' : 'text-emerald-400',
      footerIcon: <ShieldCheck size={16} />,
    },
    {
      title: 'Instructors & Mentors',
      value: instructors,
      icon: <BarChart2 size={20} className="text-amber-400" />,
      badgeBg: 'bg-amber-500/10 border-amber-400/25',
      footer: `${instructorPercent}% of total network`,
      footerColor: 'text-zinc-400',
      footerIcon: <Sparkles size={16} className="text-amber-400" />,
    },
  ];

  return (
    <div className="glass-page min-h-screen text-zinc-100 font-sans">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <header className="mb-8">
          <div className="eyebrow mb-3">
            <Activity size={14} className="text-red-300" />
            System Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Platform Analytics & Growth Telemetry
          </h1>
          <p className="mt-2 text-zinc-400 text-sm max-w-2xl">
            Real-time metric synthesis tracking learner velocity, mentor network density, and
            retention trends.
          </p>
        </header>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {dataCards.map((card, index) => (
            <div
              key={index}
              className="surface-card card-spotlight p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {card.title}
                  </span>
                  <div className={`p-2 rounded-xl border ${card.badgeBg}`}>{card.icon}</div>
                </div>
                <div className="text-3xl font-black text-white">{card.value}</div>
              </div>

              <div className="flex items-center gap-1.5 pt-4 mt-4 border-t border-white/10 text-xs font-semibold">
                {card.footerIcon}
                <span className={card.footerColor}>{card.footer}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Card */}
        <div className="surface-card card-spotlight p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-red-400" />
                Monthly User Growth Trajectory
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Comparing newly registered profiles against active monthly study sessions.
              </p>
            </div>
          </div>
          <MonthlyUserChart data={monthlyData} />
        </div>

        {/* Role Distribution Card */}
        <div className="surface-card card-spotlight p-6 md:p-8">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            Network Role Balance
          </h2>
          <p className="text-xs text-zinc-400 mb-8">
            Ratio of knowledge providers to active learning accounts across the platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="p-6 rounded-2xl border border-blue-500/25 bg-blue-500/5 relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                Mentors & Instructors
              </div>
              <div className="text-5xl font-black text-white my-2">{instructors}</div>
              <p className="text-xs text-zinc-400">
                Representing {instructorPercent}% of total network
              </p>
              <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${instructorPercent}%` }}
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-red-500/25 bg-red-500/5 relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1">
                Active Learners
              </div>
              <div className="text-5xl font-black text-white my-2">{learners}</div>
              <p className="text-xs text-zinc-400">
                Representing {learnerPercent}% of total network
              </p>
              <div className="w-full bg-white/10 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${learnerPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
