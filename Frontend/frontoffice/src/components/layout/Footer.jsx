import { useFoAppearance } from '../../context/AppearanceContext'

export default function Footer() {
  const { brandName, slogan, instagram, facebook, linkedin, whatsapp, phone, email } = useFoAppearance()

  const socialLinks = [
    { label: 'Instagram', href: instagram },
    { label: 'Facebook', href: facebook },
    { label: 'LinkedIn', href: linkedin },
    { label: 'WhatsApp', href: whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : '' },
  ].filter(s => s.href)

  return (
    <footer className="w-full px-6 md:px-12 py-20 bg-neutral-50 grid grid-cols-1 md:grid-cols-4 gap-10">
      {/* Brand */}
      <div className="md:col-span-1">
        <span className="text-lg font-bold text-black uppercase mb-3 block">
          {brandName || 'GMIR'}
        </span>
        {slogan && (
          <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-4 block">{slogan}</span>
        )}
        {(phone || email) && (
          <div className="flex flex-col gap-1 mt-3">
            {phone && <a href={`tel:${phone}`} className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black">{phone}</a>}
            {email && <a href={`mailto:${email}`} className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black">{email}</a>}
          </div>
        )}
      </div>

      {/* Assistance */}
      <div className="flex flex-col gap-4">
        <h3 className="font-label tracking-[0.05em] text-[11px] uppercase font-bold text-black">
          ASSISTANCE
        </h3>
        <ul className="flex flex-col gap-2">
          <li><a className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black" href="#">Nous contacter</a></li>
          <li><a className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black" href="#">Livraison</a></li>
          <li><a className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black" href="#">Retours</a></li>
        </ul>
      </div>

      {/* Suivez-nous */}
      <div className="flex flex-col gap-4">
        <h3 className="font-label tracking-[0.05em] text-[11px] uppercase font-bold text-black">
          SUIVEZ-NOUS
        </h3>
        <ul className="flex flex-col gap-2">
          {socialLinks.length > 0 ? socialLinks.map(s => (
            <li key={s.label}>
              <a
                className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black"
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label}
              </a>
            </li>
          )) : (
            <>
              <li><a className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black" href="#">Instagram</a></li>
              <li><a className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black" href="#">Facebook</a></li>
              <li><a className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black" href="#">Pinterest</a></li>
            </>
          )}
        </ul>
      </div>

      {/* Légal */}
      <div className="flex flex-col gap-4">
        <h3 className="font-label tracking-[0.05em] text-[11px] uppercase font-bold text-black">
          LÉGAL
        </h3>
        <ul className="flex flex-col gap-2">
          <li><a className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black" href="#">Mentions légales</a></li>
          <li><a className="font-label tracking-[0.05em] text-[11px] uppercase text-neutral-600 hover:text-black" href="#">Confidentialité</a></li>
          <li className="mt-8">
            <span className="font-label tracking-[0.05em] text-[10px] uppercase text-neutral-400">
              © {new Date().getFullYear()} {brandName || 'GMIR'}. ALL RIGHTS RESERVED.
            </span>
          </li>
        </ul>
      </div>
    </footer>
  )
}

