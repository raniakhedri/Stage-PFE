import { useStore } from '../context/StoreContext';
import MinimalHeader from '../templates/minimal/MinimalHeader';
import BoldHeader from '../templates/bold/BoldHeader';
import LuxuryHeader from '../templates/luxury/LuxuryHeader';
import SportHeader from '../templates/sport/SportHeader';
import TechHeader from '../templates/tech/TechHeader';
import ArtisanHeader from '../templates/artisan/ArtisanHeader';
import PopHeader from '../templates/pop/PopHeader';
import EditorialHeader from '../templates/editorial/EditorialHeader';

const HEADERS = {
  minimal: MinimalHeader,
  bold: BoldHeader,
  luxury: LuxuryHeader,
  sport: SportHeader,
  tech: TechHeader,
  artisan: ArtisanHeader,
  pop: PopHeader,
  editorial: EditorialHeader,
};

export default function Navbar() {
  const { layout } = useStore();
  const Header = HEADERS[layout] || MinimalHeader;
  return <Header />;
}
