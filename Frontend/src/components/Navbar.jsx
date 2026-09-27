import { useStore } from '../context/StoreContext';
import MinimalHeader from '../templates/minimal/MinimalHeader';
import BoldHeader from '../templates/bold/BoldHeader';
import LuxuryHeader from '../templates/luxury/LuxuryHeader';

const HEADERS = { minimal: MinimalHeader, bold: BoldHeader, luxury: LuxuryHeader };

export default function Navbar() {
  const { layout } = useStore();
  const Header = HEADERS[layout] || MinimalHeader;
  return <Header />;
}
