// app/components/FoodApp.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, TrendingUp, Filter, Database } from 'lucide-react';
import { Food, SummaryStats, SensitivityData, TopFood } from '@/lib/types';

export default function FoodApp() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [summaryStats, setSummaryStats] = useState<SummaryStats[]>([]);
  const [selectedNutrients, setSelectedNutrients] = useState<string[]>(['Protein', 'Carbohydrate', 'Total lipid (fat)']);
  const [sensitivityData, setSensitivityData] = useState<SensitivityData[]>([]);
  const [topFoods, setTopFoods] = useState<TopFood[]>([]);
  const [selectedNutrient, setSelectedNutrient] = useState('Protein');
  const [dataType, setDataType] = useState('all');

  const searchFoods = async () => {
    setLoading(true);
    try {
      const dataTypeFilter = dataType === 'all' ? undefined : [dataType];
      const response = await fetch('/api/foods/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          dataType: dataTypeFilter,
          pageSize: 25 
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchStoredFoods();
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
    setLoading(false);
  };

  const fetchStoredFoods = async () => {
    try {
      const response = await fetch('/api/foods?limit=50');
      const data = await response.json();
      if (data.success) {
        setFoods(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stored foods:', error);
    }
  };

  const fetchSummaryStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/summary');
      const data = await response.json();
      if (data.success) {
        setSummaryStats(data.data.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
    setLoading(false);
  };

  const performSensitivityAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/sensitivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nutrients: selectedNutrients,
          foodQuery: searchQuery 
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSensitivityData(data.data);
      }
    } catch (error) {
      console.error('Sensitivity analysis failed:', error);
    }
    setLoading(false);
  };

  const fetchTopFoods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/top-foods?nutrient=${selectedNutrient}&limit=15`);
      const data = await response.json();
      if (data.success) {
        setTopFoods(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch top foods:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStoredFoods();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchSummaryStats();
    } else if (activeTab === 'sensitivity') {
      if (selectedNutrients.length > 0) {
        performSensitivityAnalysis();
      }
    } else if (activeTab === 'top') {
      fetchTopFoods();
    }
  }, [activeTab]);

  const prepareChartData = () => {
    const grouped: { [key: string]: any } = {};
    
    sensitivityData.forEach(item => {
      if (!grouped[item.description]) {
        grouped[item.description] = { name: item.description.substring(0, 30) };
      }
      grouped[item.description][item.nutrient_name] = item.value;
    });
    
    return Object.values(grouped).slice(0, 15);
  };

  const toggleNutrient = (nutrient: string) => {
    setSelectedNutrients(prev =>
      prev.includes(nutrient)
        ? prev.filter(n => n !== nutrient)
        : [...prev, nutrient]
    );
  };

  const commonNutrients = [
    'Protein', 'Carbohydrate', 'Total lipid (fat)', 'Energy',
    'Fiber', 'Sugars', 'Calcium', 'Iron', 'Sodium', 'Vitamin C'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Food & Nutrition Analysis Platform
          </h1>
          <p className="text-gray-600">
            USDA FoodData Central API with PostgreSQL Database & Interactive Analytics
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'search'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Search className="inline w-4 h-4 mr-2" />
              Search Foods
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="inline w-4 h-4 mr-2" />
              Summary Analytics
            </button>
            <button
              onClick={() => setActiveTab('sensitivity')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'sensitivity'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Filter className="inline w-4 h-4 mr-2" />
              Sensitivity Analysis
            </button>
            <button
              onClick={() => setActiveTab('top')}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                activeTab === 'top'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Database className="inline w-4 h-4 mr-2" />
              Top Foods
            </button>
          </div>
        </div>

        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchFoods()}
                  placeholder="Search for foods (e.g., apple, chicken, milk)..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Types</option>
                  <option value="Foundation">Foundation Foods</option>
                  <option value="SR Legacy">SR Legacy</option>
                  <option value="Branded">Branded Foods</option>
                  <option value="Survey (FNDDS)">Survey Foods</option>
                </select>
                <button
                  onClick={searchFoods}
                  disabled={loading || !searchQuery}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Results: {foods.length} foods stored in database
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key Nutrients
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {foods.map((food) => (
                      <tr key={food.fdc_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {food.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {food.data_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {food.brand_owner || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {food.nutrients && food.nutrients.length > 0 ? (
                            <div className="space-y-1">
                              {food.nutrients.slice(0, 3).map((n, i) => (
                                <div key={i} className="text-xs">
                                  {n.nutrient_name}: {n.value} {n.unit_name}
                                </div>
                              ))}
                            </div>
                          ) : (
                            'No nutrient data'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Nutrient Summary Statistics</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nutrient</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Foods</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Average</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Min</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Max</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Median</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Std Dev</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {summaryStats.map((stat, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.nutrient_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{stat.unit_name}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{stat.food_count}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{Number(stat.avg_value).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{Number(stat.min_value).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{Number(stat.max_value).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{Number(stat.median_value).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{Number(stat.std_dev).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {summaryStats.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">Nutrient Distribution</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={summaryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nutrient_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_value" fill="#10b981" name="Average Value" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sensitivity' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Sensitivity Analysis</h2>
              <p className="text-gray-600 mb-4">
                Select nutrients to compare across different foods
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Nutrients to Analyze:
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonNutrients.map(nutrient => (
                    <button
                      key={nutrient}
                      onClick={() => toggleNutrient(nutrient)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedNutrients.includes(nutrient)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {nutrient}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by food name (optional)..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={performSensitivityAnalysis}
                  disabled={loading || selectedNutrients.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>

              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedNutrients.join(', ')}
              </p>
            </div>

            {sensitivityData.length > 0 && (
              <>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Nutrient Comparison Chart</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {selectedNutrients.map((nutrient, i) => (
                        <Bar
                          key={nutrient}
                          dataKey={nutrient}
                          fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Food</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nutrient</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sensitivityData.slice(0, 50).map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{item.brand_owner || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.nutrient_name}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900">{Number(item.value).toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{item.unit_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
                    Showing {Math.min(50, sensitivityData.length)} of {sensitivityData.length} results
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'top' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Top Foods by Nutrient</h2>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <select
                  value={selectedNutrient}
                  onChange={(e) => setSelectedNutrient(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {commonNutrients.map(nutrient => (
                    <option key={nutrient} value={nutrient}>{nutrient}</option>
                  ))}
                </select>
                <button
                  onClick={fetchTopFoods}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                >
                  {loading ? 'Loading...' : 'Find Top Foods'}
                </button>
              </div>
            </div>

            {topFoods.length > 0 && (
              <>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4">
                    Top 15 Foods Highest in {selectedNutrient}
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topFoods} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="description" type="category" width={200} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Food</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{selectedNutrient}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {topFoods.map((food, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">#{i + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{food.description}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{food.brand_owner || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                            {Number(food.value).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{food.unit_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}