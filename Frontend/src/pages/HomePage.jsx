import { useStore } from '../context/StoreContext';
import MinimalHome from '../templates/minimal/MinimalHome';
import BoldHome from '../templates/bold/BoldHome';
import LuxuryHome from '../templates/luxury/LuxuryHome';

const HOMES = { minimal: MinimalHome, bold: BoldHome, luxury: LuxuryHome };

export default function HomePage() {
  const { layout } = useStore();
  const Home = HOMES[layout] || MinimalHome;
  return <Home />;
}
