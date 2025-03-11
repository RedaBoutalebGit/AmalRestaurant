// pages/performance.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Image from 'next/image';
import Link from 'next/link';
import logo from '../public/logo.png';
import ProtectedRoute from '../components/ProtectedRoute';

// Styles imported from the paste.txt file
const styles = {
  container: {
    margin: 'auto',
    padding: '24px',
    maxWidth: '900px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
    borderBottom: '1px solid #eee',
    paddingBottom: '8px'
  },
  paragraph: {
    marginBottom: '8px'
  },
  chartContainer: {
    height: '300px',
    marginBottom: '16px',
    width: '100%'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '8px'
  },
  cardTitle: {
    fontWeight: 'bold'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  orange: {
    color: '#FF9F40'
  },
  teal: {
    color: '#20B2AA'
  },
  highlight: {
    fontWeight: 'bold',
    marginTop: '4px'
  },
  highlightPositive: {
    fontWeight: 'bold',
    marginTop: '4px',
    color: '#20B2AA'
  },
  highlightNegative: {
    fontWeight: 'bold',
    marginTop: '4px',
    color: '#FF9F40'
  },
  insights: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  insightCard: {
    backgroundColor: '#e6f7f5',
    padding: '16px',
    borderRadius: '8px'
  },
  insightCardTitle: {
    fontWeight: 'bold',
    color: '#20B2AA',
    marginBottom: '8px'
  },
  recommendationCard: {
    backgroundColor: '#fff5e6',
    padding: '16px',
    borderRadius: '8px'
  },
  recommendationCardTitle: {
    fontWeight: 'bold',
    color: '#FF9F40',
    marginBottom: '8px'
  },
  list: {
    listStyleType: 'disc',
    paddingLeft: '20px',
    fontSize: '14px'
  },
  listItem: {
    marginBottom: '4px'
  }
};

function PerformanceContent() {
  // Data from the paste.txt file
  const data = [
    {
      month: 'January',
      revenue2024: 222814,
      revenue2025: 270349,
      covers2024: 1890,
      covers2025: 2306,
      avgSpend2024: 117.89,
      avgSpend2025: 117.23,
      percentRevenueChange: 21.3,
      percentCoversChange: 22.0,
      percentAvgSpendChange: -0.6
    },
    {
      month: 'February',
      revenue2024: 241421,
      revenue2025: 268663,
      covers2024: 2051,
      covers2025: 2203,
      avgSpend2024: 117.70,
      avgSpend2025: 121.95,
      percentRevenueChange: 11.3,
      percentCoversChange: 7.4,
      percentAvgSpendChange: 3.6
    }
  ];

  // Format numbers with commas and currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: 'MAD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${value > 0 ? '+' : ''}${value}%`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image src={logo} alt="Restaurant Logo" width={100} height={100} />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Reservations
              </Link>
              <Link
                href="/inventory"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Inventory
              </Link>
              <Link
                href="/performance"
                className="px-4 py-2 rounded-md text-sm font-medium bg-[#e3902b] text-white"
              >
                Performance
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Performance Dashboard */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>Restaurant Performance Analysis</h1>
            <h2 style={styles.subtitle}>Comparison: 2024 vs 2025</h2>
          </div>
          
          {/* Executive Summary */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Executive Summary</h2>
            <p style={styles.paragraph}>
              Analysis of your restaurant's performance shows significant growth in both January and February 2025 compared to the same months in 2024:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Revenue has increased by 21.3% in January and 11.3% in February</li>
              <li style={styles.listItem}>Customer traffic (covers) is up 22.0% in January and 7.4% in February</li>
              <li style={styles.listItem}>Average spend per cover decreased slightly by 0.6% in January but increased by 3.6% in February</li>
            </ul>
            <p style={styles.paragraph}>
              February 2025 shows a particularly healthy growth pattern with both increased customer count and higher average spending, indicating strong business performance and customer satisfaction.
            </p>
          </div>

          {/* Monthly Revenue Comparison */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Monthly Revenue</h2>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${Math.round(value/1000)}K`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue2024" name="Revenue 2024" fill="#FF9F40" />
                  <Bar dataKey="revenue2025" name="Revenue 2025" fill="#20B2AA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.grid}>
              {data.map((item) => (
                <div key={`revenue-${item.month}`} style={styles.card}>
                  <h3 style={styles.cardTitle}>{item.month}</h3>
                  <div style={styles.cardGrid}>
                    <div style={styles.orange}>{formatCurrency(item.revenue2024)}</div>
                    <div style={styles.teal}>{formatCurrency(item.revenue2025)}</div>
                  </div>
                  <div style={item.percentRevenueChange > 0 ? styles.highlightPositive : styles.highlightNegative}>
                    {formatPercent(item.percentRevenueChange)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Traffic Analysis */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Customer Traffic (Covers)</h2>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="covers2024" name="Covers 2024" fill="#FF9F40" />
                  <Bar dataKey="covers2025" name="Covers 2025" fill="#20B2AA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.grid}>
              {data.map((item) => (
                <div key={`covers-${item.month}`} style={styles.card}>
                  <h3 style={styles.cardTitle}>{item.month}</h3>
                  <div style={styles.cardGrid}>
                    <div style={styles.orange}>{item.covers2024}</div>
                    <div style={styles.teal}>{item.covers2025}</div>
                  </div>
                  <div style={item.percentCoversChange > 0 ? styles.highlightPositive : styles.highlightNegative}>
                    {formatPercent(item.percentCoversChange)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Average Spend Analysis */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Average Spend per Cover</h2>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[100, 130]} />
                  <Tooltip formatter={(value) => `${value.toFixed(2)} MAD`} />
                  <Legend />
                  <Bar dataKey="avgSpend2024" name="Avg Spend 2024" fill="#FF9F40" />
                  <Bar dataKey="avgSpend2025" name="Avg Spend 2025" fill="#20B2AA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.grid}>
              {data.map((item) => (
                <div key={`avgspend-${item.month}`} style={styles.card}>
                  <h3 style={styles.cardTitle}>{item.month}</h3>
                  <div style={styles.cardGrid}>
                    <div style={styles.orange}>{item.avgSpend2024.toFixed(2)} MAD</div>
                    <div style={styles.teal}>{item.avgSpend2025.toFixed(2)} MAD</div>
                  </div>
                  <div style={item.percentAvgSpendChange > 0 ? styles.highlightPositive : styles.highlightNegative}>
                    {formatPercent(item.percentAvgSpendChange)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights and Recommendations */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Key Insights & Recommendations</h2>
            <div style={styles.insights}>
              <div style={styles.insightCard}>
                <h3 style={styles.insightCardTitle}>Key Findings</h3>
                <ul style={styles.list}>
                  <li style={styles.listItem}>Strong overall growth in both revenue and customer traffic</li>
                  <li style={styles.listItem}>February shows healthier balanced growth with increased average spend</li>
                  <li style={styles.listItem}>January shows explosive customer growth but slight decline in average spend</li>
                  <li style={styles.listItem}>Year-over-year performance shows robust business momentum</li>
                </ul>
              </div>
              <div style={styles.recommendationCard}>
                <h3 style={styles.recommendationCardTitle}>Recommendations</h3>
                <ul style={styles.list}>
                  <li style={styles.listItem}>Analyze January's menu performance to identify opportunities to increase average check</li>
                  <li style={styles.listItem}>Investigate successful February strategies that led to higher per-customer spending</li>
                  <li style={styles.listItem}>Consider capacity management planning for continued growth in customer numbers</li>
                  <li style={styles.listItem}>Build on successful customer acquisition strategies from January</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function PerformancePage() {
  return (
    <ProtectedRoute pageName="performance">
      <PerformanceContent />
    </ProtectedRoute>
  );
}