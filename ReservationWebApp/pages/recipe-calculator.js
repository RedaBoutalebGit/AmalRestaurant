// pages/recipe-calculator.js
import RecipeCostCalculator from '../components/RecipeCostCalculator';
import ProtectedRoute from '../components/ProtectedRoute';

function RecipeCalculatorContent() {
  return <RecipeCostCalculator />;
}

export default function RecipeCalculatorPage() {
  return (
    <ProtectedRoute pageName="recipe">
      <RecipeCalculatorContent />
    </ProtectedRoute>
  );
}