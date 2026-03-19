import { useStore } from './store/useStore';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';

function App() {
  const isOnboarded = useStore(state => state.isOnboarded);

  // Smooth crossfade between mounting states could be added here
  if (!isOnboarded) {
    return <Onboarding />;
  }

  return <Dashboard />;
}

export default App;
