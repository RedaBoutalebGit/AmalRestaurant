import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, PieChart, Pie, Cell } from 'recharts';

// Import all the data from paste.txt
// Base forecast data (with 1 event in April)
const baseForecast2025 = [
  { mois: "janvier", revenues: 270354.50, ventes: 6542, tCouverts: 2306, status: "Réel" },
  { mois: "février", revenues: 268673.40, ventes: 6999, tCouverts: 2208, status: "Réel" },
  { mois: "mars", revenues: 184408.99, ventes: 5274, tCouverts: 1361, status: "Réel" },
  { mois: "avril", revenues: 322575.85, ventes: 8500, tCouverts: 2100, status: "Projection", hasEvent: true, eventAmount: 45000 },
  { mois: "mai", revenues: 294789.15, ventes: 6800, tCouverts: 2350, status: "Prévision" },
  { mois: "juin", revenues: 151359.69, ventes: 3800, tCouverts: 1200, status: "Prévision" },
  { mois: "juillet", revenues: 123961.79, ventes: 2700, tCouverts: 1050, status: "Prévision" },
  { mois: "septembre", revenues: 210461.92, ventes: 4750, tCouverts: 1700, status: "Prévision" },
  { mois: "octobre", revenues: 311795.79, ventes: 7300, tCouverts: 2500, status: "Prévision" },
  { mois: "novembre", revenues: 295662.73, ventes: 6400, tCouverts: 2250, status: "Prévision" },
  { mois: "décembre", revenues: 260555.16, ventes: 5600, tCouverts: 2150, status: "Prévision" }
];

// Forecast with additional events
const forecastWithEvents = [
  { mois: "janvier", revenues: 270354.50, ventes: 6542, tCouverts: 2306, status: "Réel" },
  { mois: "février", revenues: 268673.40, ventes: 6999, tCouverts: 2208, status: "Réel" },
  { mois: "mars", revenues: 184408.99, ventes: 5274, tCouverts: 1361, status: "Réel" },
  { mois: "avril", revenues: 322575.85, ventes: 8500, tCouverts: 2100, status: "Projection", hasEvent: true, eventAmount: 45000 },
  { mois: "mai", revenues: 294789.15, ventes: 6800, tCouverts: 2350, status: "Prévision" },
  { mois: "juin", revenues: 196359.69, ventes: 4900, tCouverts: 1450, status: "Prévision", hasEvent: true, eventAmount: 45000 },
  { mois: "juillet", revenues: 123961.79, ventes: 2700, tCouverts: 1050, status: "Prévision" },
  { mois: "septembre", revenues: 255461.92, ventes: 5850, tCouverts: 1950, status: "Prévision", hasEvent: true, eventAmount: 45000 },
  { mois: "octobre", revenues: 311795.79, ventes: 7300, tCouverts: 2500, status: "Prévision" },
  { mois: "novembre", revenues: 295662.73, ventes: 6400, tCouverts: 2250, status: "Prévision" },
  { mois: "décembre", revenues: 305555.16, ventes: 6700, tCouverts: 2400, status: "Prévision", hasEvent: true, eventAmount: 45000 }
];

// Full 2024 data for comparison
const data2024 = [
  { mois: "janvier", revenues: 222819.15, ventes: 5515, tCouverts: 1890, annee: 2024 },
  { mois: "février", revenues: 241425.17, ventes: 6291, tCouverts: 2051, annee: 2024 },
  { mois: "mars", revenues: 251712.85, ventes: 8534, tCouverts: 1999, annee: 2024 },
  { mois: "avril", revenues: 229727, ventes: 6414, tCouverts: 1790, annee: 2024 },
  { mois: "mai", revenues: 273953.77, ventes: 6499, tCouverts: 2248, annee: 2024 },
  { mois: "juin", revenues: 140661.75, ventes: 3602, tCouverts: 1162, annee: 2024 },
  { mois: "juillet", revenues: 115200.3, ventes: 2495, tCouverts: 990, annee: 2024 },
  { mois: "septembre", revenues: 195586.7, ventes: 4553, tCouverts: 1624, annee: 2024 },
  { mois: "octobre", revenues: 289758.4, ventes: 7011, tCouverts: 2397, annee: 2024 },
  { mois: "novembre", revenues: 274765.6, ventes: 6051, tCouverts: 2145, annee: 2024 },
  { mois: "décembre", revenues: 242139.4, ventes: 5391, tCouverts: 2042, annee: 2024 }
];

// Events details
const eventsDetails = [
  { month: "avril", name: "Événement spécial printemps", revenue: 45000, date: "13 avril 2025", status: "Réalisé" },
  { month: "juin", name: "Gala d'été", revenue: 45000, date: "21 juin 2025", status: "Planifié" },
  { month: "septembre", name: "Événement de rentrée", revenue: 45000, date: "15 septembre 2025", status: "Planifié" },
  { month: "décembre", name: "Soirée de fin d'année", revenue: 45000, date: "20 décembre 2025", status: "Planifié" }
];

// KPI calculations
const total2024 = data2024.reduce((sum, item) => sum + item.revenues, 0);
const totalBaseCase = baseForecast2025.reduce((sum, item) => sum + item.revenues, 0);
const totalWithEvents = forecastWithEvents.reduce((sum, item) => sum + item.revenues, 0);
const additionalRevenue = totalWithEvents - totalBaseCase;

const baseCaseGrowth = ((totalBaseCase / total2024) - 1) * 100;
const withEventsGrowth = ((totalWithEvents / total2024) - 1) * 100;

// Annual comparison data for chart
const annualComparisonData = [
  { name: "2024", value: total2024, fill: "#8884d8" },
  { name: "2025 (Base)", value: totalBaseCase, fill: "#82ca9d" },
  { name: "2025 (Avec événements)", value: totalWithEvents, fill: "#ff7300" }
];

// Monthly comparison data for chart
const comparisonData = forecastWithEvents.map(month2025 => {
  const month2024 = data2024.find(m => m.mois === month2025.mois) || 
                  { revenues: 0, ventes: 0, tCouverts: 0 };
  const baseMonth = baseForecast2025.find(m => m.mois === month2025.mois);
  
  return {
    mois: month2025.mois,
    revenues2024: month2024.revenues,
    revenuesBase2025: baseMonth.revenues,
    revenuesWithEvents: month2025.revenues,
    hasEvent: month2025.hasEvent || false,
    status: month2025.status
  };
});

// Event impact data
const eventImpactData = [
  { name: "Revenu de base", value: totalBaseCase, fill: "#8884d8" },
  { name: "Revenu des événements", value: additionalRevenue, fill: "#ff7300" }
];

// Scenario data
const scenarioData = [
  { name: "Scénario Optimiste", value: totalWithEvents * 1.1, fill: "#4CAF50" },
  { name: "Scénario Attendu", value: totalWithEvents, fill: "#2196F3" },
  { name: "Scénario Pessimiste", value: totalWithEvents * 0.9, fill: "#F44336" },
  { name: "Référence 2024", value: total2024, fill: "#9E9E9E" }
];

// Quarterly data
const quarterlyData = [
  { quarter: "Q1", revenus2024: data2024.slice(0, 3).reduce((sum, item) => sum + item.revenues, 0), 
    revenus2025: forecastWithEvents.slice(0, 3).reduce((sum, item) => sum + item.revenues, 0) },
  { quarter: "Q2", revenus2024: data2024.slice(3, 6).reduce((sum, item) => sum + item.revenues, 0), 
    revenus2025: forecastWithEvents.slice(3, 6).reduce((sum, item) => sum + item.revenues, 0) },
  { quarter: "Q3", revenus2024: data2024.filter(m => m.mois === "juillet" || m.mois === "septembre").reduce((sum, item) => sum + item.revenues, 0), 
    revenus2025: forecastWithEvents.filter(m => m.mois === "juillet" || m.mois === "septembre").reduce((sum, item) => sum + item.revenues, 0) },
  { quarter: "Q4", revenus2024: data2024.slice(-3).reduce((sum, item) => sum + item.revenues, 0), 
    revenus2025: forecastWithEvents.slice(-3).reduce((sum, item) => sum + item.revenues, 0) }
];

const SalesForecastDashboard = () => {
  return (
    <div className="p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-center">2025 Forecast with Additional Events</h1>
      
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">CA 2025 (Avec événements)</h3>
          <p className="text-xl font-bold">{totalWithEvents.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} mad</p>
          <p className="text-sm text-green-600">
            +{withEventsGrowth.toFixed(2)}% vs 2024
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">CA 2025 (Sans événements)</h3>
          <p className="text-xl font-bold">{totalBaseCase.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} mad</p>
          <p className="text-sm text-green-600">
            +{baseCaseGrowth.toFixed(2)}% vs 2024
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Impact des événements</h3>
          <p className="text-xl font-bold">{additionalRevenue.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} mad</p>
          <p className="text-sm text-green-600">
            +{((additionalRevenue / totalBaseCase) * 100).toFixed(2)}% de revenu supplémentaire
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Events</h3>
          <p className="text-xl font-bold">4</p>
          <p className="text-sm text-gray-600">
            45 000 mad / event (mean)
          </p>
        </div>
      </div>
      
      {/* Annual Comparison Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">
        Comparison of annual Revenues</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={annualComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' mad'} />
                <Bar dataKey="value" name="CA Annuel" fill="#8884d8">
                  {annualComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventImpactData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value, percent }) => `${name}: ${(value/1000000).toFixed(2)}M mad (${(percent*100).toFixed(1)}%)`}
                >
                  {eventImpactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' mad'} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Monthly Revenue Forecast */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">
        Monthly forecast</h2>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip formatter={(value) => value.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' mad'} />
            <Legend />
            <Bar dataKey="revenues2024" name="Revenus 2024" fill="#8884d8" />
            <Bar dataKey="revenuesBase2025" name="Revenus 2025 (Base)" fill="#82ca9d" />
            <Line type="monotone" dataKey="revenuesWithEvents" name="Revenus 2025 (Avec événements)" stroke="#ff7300" strokeWidth={3} dot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-2 text-right">
          <span className="inline-block px-2 py-1 mr-2 bg-green-100 text-green-800 text-xs font-medium rounded">● Données réelles/projections</span>
          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">▲ Mois avec événements spéciaux</span>
        </div>
      </div>
      
      {/* Quarterly Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Quarterly performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quarterlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' mad'} />
              <Legend />
              <Bar dataKey="revenus2024" name="2024" fill="#8884d8" />
              <Bar dataKey="revenus2025" name="2025" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>
         {/* 
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Scénarios prévisionnels 2025</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scenarioData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${(value/1000000).toFixed(2)}M mad`}
              >
                {scenarioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' mad'} />
            </PieChart>
          </ResponsiveContainer>
        </div>*/}
      </div>
      
      {/* Events Calendar 
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">Planification des événements spéciaux 2025</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Événement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenu estimé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eventsDetails.map((event, index) => (
                <tr key={index} className={event.status === "Réalisé" ? "bg-green-50" : "bg-white"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.revenue.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} mad</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      event.status === "Réalisé" ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">TOTAL</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4 événements</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {(eventsDetails.reduce((sum, event) => sum + event.revenue, 0)).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} mad
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      */}
      
      {/* Data Table */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">Detailed Monthly Forecast 2025</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenus 2025</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenus 2024</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Évolution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Événement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparisonData.map((item, index) => {
                const growthRate = ((item.revenuesWithEvents / (item.revenues2024 || 1)) - 1) * 100;
                const hasSpecialEvent = eventsDetails.some(event => event.month === item.mois);
                
                return (
                  <tr key={index} className={index < 3 ? "bg-white" : (index === 3 ? "bg-blue-50" : (hasSpecialEvent ? "bg-yellow-50" : "bg-white"))}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.mois}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.revenuesWithEvents.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} mad
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.revenues2024.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} mad
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {growthRate.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {hasSpecialEvent && (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Événement spécial
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${index < 3 ? 'bg-green-100 text-green-800' : 
                        (index === 3 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800')}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">TOTAL</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {totalWithEvents.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} mad
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {total2024.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} mad
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  +{withEventsGrowth.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Impact Analysis 
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">Analyse d'impact des événements spéciaux</h2>
        <div className="p-4">
          <h3 className="font-medium text-lg mb-3">Bénéfices des événements spéciaux</h3>
          <p className="mb-3">L'ajout de 3 événements supplémentaires similaires à celui d'avril permet :</p>
          <ul className="list-disc pl-5 mb-4">
            <li className="mb-2">Une augmentation du CA annuel de <span className="text-green-600 font-medium">{additionalRevenue.toLocaleString('fr-FR')} mad (+{((additionalRevenue / totalBaseCase) * 100).toFixed(2)}%)</span></li>
            <li className="mb-2">Une croissance annuelle passant de <span className="font-medium">+{baseCaseGrowth.toFixed(2)}%</span> à <span className="text-green-600 font-medium">+{withEventsGrowth.toFixed(2)}%</span> par rapport à 2024</li>
            <li className="mb-2">Un renforcement significatif des mois habituellement moins performants (juin et septembre)</li>
          </ul>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium mb-2">Recommandations pour maximiser l'impact :</h4>
            <ul className="list-disc pl-5">
              <li className="mb-2"><span className="font-medium">Planification anticipée</span> : Prévoir les événements au moins 3 mois à l'avance pour optimiser le taux de participation</li>
              <li className="mb-2"><span className="font-medium">Marketing ciblé</span> : Développer des campagnes promotionnelles spécifiques pour chaque événement</li>
              <li className="mb-2"><span className="font-medium">Thématiques saisonnières</span> : Adapter les événements aux saisons pour maximiser leur attractivité</li>
              <li className="mb-2"><span className="font-medium">Suivi et analyse</span> : Mesurer précisément l'impact de chaque événement pour optimiser les futures éditions</li>
            </ul>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium mb-2">Points de vigilance :</h4>
            <ul className="list-disc pl-5">
              <li className="mb-2"><span className="font-medium">Ressources humaines</span> : S'assurer de disposer du personnel nécessaire pour ces événements spéciaux</li>
              <li className="mb-2"><span className="font-medium">Clientèle régulière</span> : Veiller à maintenir la qualité de service pour la clientèle habituelle pendant ces périodes de forte affluence</li>
              <li className="mb-2"><span className="font-medium">Facteurs externes</span> : Prendre en compte les événements concurrents et facteurs saisonniers (comme le Ramadan pour mars)</li>
            </ul>
          </div>
        </div>
      </div>*/}
    </div>
  );
};

export default SalesForecastDashboard;