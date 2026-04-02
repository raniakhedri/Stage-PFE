import { useState } from 'react'
import { Link } from 'react-router-dom'

const initialItems = [
  {
    id: 1,
    name: 'Manteau Oversize en Laine',
    size: 'M',
    color: 'Noir',
    price: 490,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn20aKpI2LFF5ugVaaBe-_PD8LKsG-ZdfEwwR6P5WPXwi79LRVTN-C2M_o0TQRSWALtdq_2kg0O8wZuYMJ-WH_HtvVgCrovBMSiz_QTTEujk9iUnBFtnSaL-9_sb8nuOeCjJNNXd2Ypv6xmaPQyCFaXgJMYZxWQ916Y8bJjLroRqabLUWcMoGVR3GBWv4Znhz5Jq9ycJ59tEIHSjKHj3pyna7l8mMNvurZQLqQPt0kvjhu_rOdrF5ox5itRj464FeI0gQ2WUfh-qCM',
  },
  {
    id: 2,
    name: 'Pantalon Large Structural',
    size: '40',
    color: 'Gris Anthracite',
    price: 215,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJOGvsiowtEPL2P0dCpzFpXUtdBB3bVg376Cb5WDFnhP3R6xbEiMb9jQaxToRxzaapD_5q05DGdMmo2-zFYdPc3oP_xQh3iVOjKO_32nCSwUxXuG8cCuad4OVkrKTBHaWsFv57XvLl0gGu36Eb49SjIqpsNyLkgvTzc87vc7aKZn6sUsERACIWyJuZ03s0MoC2Bi4UKFmkYuJqXuKCmYi82Qd_Pc3sEEJENtvgemeIWCPv7ApcPKYVCiWbHiV8VhrZk32pfHKGvyCG',
  },
]

export default function Cart() {
  const [items, setItems] = useState(initialItems)
  const [payment, setPayment] = useState('card')

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id))

  const subtotal = items.reduce((s, i) => s + i.price, 0)
  const taxes = Math.round(subtotal * 0.2)
  const total = subtotal

  const fmt = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' DT'

  return (
    <main className="pt-28 pb-16 px-6 md:px-12 max-w-[1400px] mx-auto min-h-screen">
      <h1 className="font-headline font-black text-2xl tracking-tighter mb-10 uppercase">
        Votre Panier
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-32">
          <span className="material-symbols-outlined text-6xl text-neutral-300 mb-6 block">shopping_bag</span>
          <p className="font-headline font-bold text-xl uppercase tracking-tight mb-4">Votre panier est vide</p>
          <Link
            to="/"
            className="inline-block fo-btn px-10 py-4 font-bold tracking-[0.1em] text-[12px] uppercase"
          >
            Continuer vos achats
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left column */}
          <div className="lg:col-span-7 space-y-8">
            {/* 01 / Articles */}
            <section>
              <h2 className="font-headline text-[11px] font-bold tracking-[0.1em] uppercase mb-5 text-outline">
                01 / Articles
              </h2>
              <div className="space-y-5">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-5">
                    <div className="w-24 h-32 bg-surface-container overflow-hidden shrink-0">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-between w-full py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-headline font-bold text-sm leading-tight uppercase">
                            {item.name}
                          </h3>
                          <p className="text-xs text-secondary mt-1 font-label tracking-wider uppercase">
                            Taille: {item.size} | {item.color}
                          </p>
                        </div>
                        <p className="font-headline font-bold text-sm tracking-tight">{fmt(item.price)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-2 text-[11px] font-bold tracking-[0.05em] uppercase hover:text-red-600 transition-colors w-fit"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 02 / Informations Client */}
            <section className="pt-4">
              <h2 className="font-headline text-[11px] font-bold tracking-[0.1em] uppercase mb-5 text-outline">
                02 / Informations Client
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-2 block">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    placeholder="nom@exemple.com"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-sm placeholder:text-neutral-300 focus:outline-none focus:border-b-primary focus:ring-0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-2 block">Prénom</label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-sm focus:outline-none focus:border-b-primary focus:ring-0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-2 block">Nom</label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-sm focus:outline-none focus:border-b-primary focus:ring-0"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-2 block">
                    Adresse de livraison
                  </label>
                  <input
                    type="text"
                    placeholder="Rue, numéro, appartement"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-sm placeholder:text-neutral-300 focus:outline-none focus:border-b-primary focus:ring-0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-2 block">Code Postal</label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-sm focus:outline-none focus:border-b-primary focus:ring-0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-2 block">Ville</label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body text-sm focus:outline-none focus:border-b-primary focus:ring-0"
                  />
                </div>
              </div>
            </section>

            {/* 03 / Mode de Paiement */}
            <section className="pt-4">
              <h2 className="font-headline text-[11px] font-bold tracking-[0.1em] uppercase mb-5 text-outline">
                03 / Mode de Paiement
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setPayment('card')}
                  className={`flex items-center justify-between w-full p-4 border ${
                    payment === 'card' ? 'border-primary bg-surface-container-lowest' : 'border-outline-variant hover:border-primary'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${
                      payment === 'card' ? 'border-4 border-primary' : 'border border-outline-variant'
                    }`} />
                    <span className={`font-headline font-bold text-sm uppercase ${
                      payment !== 'card' ? 'text-secondary' : ''
                    }`}>
                      Carte de crédit
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-neutral-400">credit_card</span>
                </button>
                <button
                  onClick={() => setPayment('paypal')}
                  className={`flex items-center justify-between w-full p-4 border ${
                    payment === 'paypal' ? 'border-primary bg-surface-container-lowest' : 'border-outline-variant hover:border-primary'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${
                      payment === 'paypal' ? 'border-4 border-primary' : 'border border-outline-variant'
                    }`} />
                    <span className={`font-headline font-bold text-sm uppercase ${
                      payment !== 'paypal' ? 'text-secondary' : ''
                    }`}>
                      PayPal
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-neutral-400">account_balance_wallet</span>
                </button>
              </div>
            </section>
          </div>

          {/* Right column — Order summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-surface-container-low p-7">
              <h2 className="font-headline text-[11px] font-bold tracking-[0.1em] uppercase mb-6 text-outline">
                Résumé de commande
              </h2>
              <div className="space-y-4 pb-6 border-b border-outline-variant/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-label tracking-wider uppercase text-secondary">Sous-total</span>
                  <span className="font-headline font-bold text-sm">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-label tracking-wider uppercase text-secondary">Livraison</span>
                  <span className="font-headline font-bold text-sm uppercase">Gratuite</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-label tracking-wider uppercase text-secondary">Taxes estimées</span>
                  <span className="font-headline font-bold text-sm">{fmt(taxes)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-6">
                <span className="font-headline font-black text-base uppercase tracking-tighter">Total</span>
                <span className="font-headline font-black text-xl tracking-tighter">{fmt(total)}</span>
              </div>
              <button className="w-full fo-btn py-4 font-headline font-bold text-[11px] tracking-[0.2em] uppercase flex justify-center items-center gap-3">
                Passer au paiement
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <div className="mt-5 space-y-3">
                <p className="text-[10px] text-secondary text-center leading-relaxed tracking-wider uppercase">
                  Livraison standard gratuite (3-5 jours ouvrables).<br />
                  Retours offerts sous 30 jours.
                </p>
                <div className="flex justify-center gap-4 opacity-30 pt-4">
                  <span className="material-symbols-outlined">verified_user</span>
                  <span className="material-symbols-outlined">lock</span>
                  <span className="material-symbols-outlined">package</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
