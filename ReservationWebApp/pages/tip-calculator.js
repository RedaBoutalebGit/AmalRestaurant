// pages/tip-calculator.js
import TipDistributionCalculator from '../components/TipDistributionCalculator';
import ProtectedRoute from '../components/ProtectedRoute';

function TipCalculatorContent() {
  return <TipDistributionCalculator />;
}

export default function TipCalculatorPage() {
  return (
    <ProtectedRoute pageName="tips">
      <TipCalculatorContent />
    </ProtectedRoute>
  );
}