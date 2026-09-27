import { useStore } from '../context/StoreContext';
import MinimalFooter from '../templates/minimal/MinimalFooter';
import BoldFooter from '../templates/bold/BoldFooter';
import LuxuryFooter from '../templates/luxury/LuxuryFooter';

const FOOTERS = { minimal: MinimalFooter, bold: BoldFooter, luxury: LuxuryFooter };

export default function Footer() {
  const { layout } = useStore();
  const Template = FOOTERS[layout] || MinimalFooter;
  return <Template />;
}
