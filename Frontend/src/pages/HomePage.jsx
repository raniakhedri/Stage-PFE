import { useStore } from '../context/StoreContext';
import MinimalHome from '../templates/minimal/MinimalHome';
import BoldHome from '../templates/bold/BoldHome';
import LuxuryHome from '../templates/luxury/LuxuryHome';
import SportHome from '../templates/sport/SportHome';
import TechHome from '../templates/tech/TechHome';
import ArtisanHome from '../templates/artisan/ArtisanHome';
import PopHome from '../templates/pop/PopHome';
import EditorialHome from '../templates/editorial/EditorialHome';

const HOMES = {
  minimal: MinimalHome,
  bold: BoldHome,
  luxury: LuxuryHome,
  sport: SportHome,
  tech: TechHome,
  artisan: ArtisanHome,
  pop: PopHome,
  editorial: EditorialHome,
};

export default function HomePage() {
  const { layout } = useStore();
  const Home = HOMES[layout] || MinimalHome;
  return <Home />;
}
