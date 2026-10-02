import { useStore } from '../context/StoreContext';
import MinimalFooter from '../templates/minimal/MinimalFooter';
import BoldFooter from '../templates/bold/BoldFooter';
import LuxuryFooter from '../templates/luxury/LuxuryFooter';
import SportFooter from '../templates/sport/SportFooter';
import TechFooter from '../templates/tech/TechFooter';
import ArtisanFooter from '../templates/artisan/ArtisanFooter';
import PopFooter from '../templates/pop/PopFooter';
import EditorialFooter from '../templates/editorial/EditorialFooter';

const FOOTERS = {
  minimal: MinimalFooter,
  bold: BoldFooter,
  luxury: LuxuryFooter,
  sport: SportFooter,
  tech: TechFooter,
  artisan: ArtisanFooter,
  pop: PopFooter,
  editorial: EditorialFooter,
};

export default function Footer() {
  const { layout } = useStore();
  const Template = FOOTERS[layout] || MinimalFooter;
  return <Template />;
}
