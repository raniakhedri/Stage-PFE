import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const sidebarLinks = [
  { key: 'dashboard', label: 'TABLEAU DE BORD' },
  { key: 'commandes', label: 'COMMANDES' },
  { key: 'adresses', label: 'ADRESSES' },
  { key: 'wishlist', label: 'WISHLIST' },
  { key: 'parametres', label: 'PARAMÈTRES' },
]

const recentOrders = [
  {
    id: '#ORD-88291',
    date: '12 JAN 2024',
    name: 'MANTEAU OVERSIZE EN LAINE',
    status: 'En cours de livraison',
    price: '450,00 DT',
    action: 'SUIVRE LE COLIS',
    actionStyle: 'primary',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwrw-uV7FcrUTp58QS2udx-4YSfi4hlytbkWg5xc_AtYcapr3zSO-8x4fEaHs500YC3ScfZ2DKBhJo-TXYe_qX2Xsb_EpW13Jmas3sM8kFb_d7Bt9KlGwJNtiCUqwwpOosvO7Ep6DnWBA-lC_8XB3XzsfvudVwtYl3J_9DwtNI7_T8wialyw071ZFAAmgkBvj4C2aac0C0P6MtZkJ6htlFdNVr9VGQoMbxQ1omGrmtVqTpqjwP1Ijpj-4s9XlB6yBZ_03KuAKx0BZX',
  },
  {
    id: '#ORD-88104',
    date: '28 DÉC 2023',
    name: 'BOTTINES EN CUIR ÉDITION LIMITÉE',
    status: 'Livré',
    price: '320,00 DT',
    action: 'FACTURE PDF',
    actionStyle: 'secondary',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCysVSmjtIvFeyTMjk-HdHaArMjlfyBmKoj7r2oDzdSou4kd6kbDGkbP8EANHGN0F0vdJO9zIBjveF5P-xTiHA-x0I51cWS8pCyT0zczR3otNV5aeXBJh9KgWerwtr5ImELePj7WEJzbhDm6g3Bj622mPbaHRzFSBHMF9UTWDY8KadLUCMkzpVPvFyLUUbA5Y8OTcBfV_Q7iQf74YKw2GTZFvvxkyrZuK1xncJ4wKfX5LVOem2WcTlw5LX2f4VVDtedslYho-gxJZCz',
  },
]

const wishlistItems = [
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdb9wUqdpKLiZaXPGC3N15IzmyPb0K8DP5N7MM53tqg2QyXHTLUhkbUib3Tq1J3_8FgK4f99R5ZzGtZhOvDo04N1JQTKkaQxibtAuSkE9crcs4vOIK6m3MjIJ8sDIGjWXj_4e7C3DXE_njyg7dwBrJOJobypZFgLhrFX1LBvYR6AdZCzuCkTs2EhKyaP8ZdSv1gdrw_v_8R7WJDfDqENQCh9Qda70pttj0ApcWxfh64rDQ58HPhhzWyi58bZbPtCgEgSJZlQDQvYfu', alt: 'Robe blanche haute couture' },
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFXVIwEAhYGRAB2CzO2_fT5nb32Koz9GpCtZCMkvudft3HMJt8dh_g3FGaO8gkZK5_IDnpCnBEWt79MkVo0OnWipx1B6hhRzlXw756BD0ZFbfBeZisU8ssRjNSdDykRDiBevHulUfTIqpCm3DJvXb8r86yjsAsUcEiAULKG0g-cP0ydYkoGvW5VJeQFrxvr0V0G0wqV3-GS0YWQfHkQ4Puuy5OLUfQ-MdLzB4jvlJAtZWnCoE8LdG19QgzNjx6ZeeuVgxv17bnLbqF', alt: 'Blazer structuré homme' },
]

export default function Profile() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <main className="pt-28 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">MON COMPTE</h1>
        <p className="text-secondary font-label tracking-[0.05em] text-[11px] uppercase">
          TABLEAU DE BORD / BIENVENUE, {user?.name?.toUpperCase() || 'UTILISATEUR'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <nav className="flex flex-col gap-5">
            {sidebarLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => setActiveTab(link.key)}
                className={`text-left font-headline text-sm tracking-tight border-l-2 pl-4 transition-all ${
                  activeTab === link.key
                    ? 'font-bold border-primary text-primary'
                    : 'text-neutral-400 border-transparent hover:text-primary'
                }`}
              >
                {link.label}
              </button>
            ))}
            <hr className="border-outline-variant/15 my-3" />
            <button
              onClick={handleLogout}
              className="text-left font-headline text-error text-sm tracking-tight pl-4"
            >
              DÉCONNEXION
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="lg:col-span-9 flex flex-col gap-20">
          {/* Commandes récentes */}
          <section>
            <div className="flex justify-between items-end mb-8">
              <h2 className="font-headline font-extrabold text-xl tracking-tight uppercase">
                COMMANDES RÉCENTES
              </h2>
              <a
                href="#"
                className="text-[11px] font-label tracking-[0.05em] uppercase underline underline-offset-4 decoration-outline-variant"
              >
                TOUT VOIR
              </a>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-surface-container-low p-6 flex flex-col md:flex-row justify-between items-center gap-6"
                >
                  <div className="flex gap-5 items-center w-full">
                    <div className="w-20 h-24 bg-surface-container-high overflow-hidden shrink-0">
                      <img
                        src={order.img}
                        alt={order.name}
                        className="w-full h-full object-cover grayscale"
                      />
                    </div>
                    <div>
                      <p className="font-label text-[10px] tracking-widest text-secondary mb-1 uppercase">
                        {order.id} / {order.date}
                      </p>
                      <h3 className="font-headline font-bold text-sm tracking-tight">
                        {order.name}
                      </h3>
                      <p className="text-sm text-secondary">
                        Statut:{' '}
                        <span className="text-on-background font-medium">{order.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end w-full md:w-auto shrink-0">
                    <p className="font-headline font-black text-lg mb-2">{order.price}</p>
                    <button
                      className={`px-6 py-2 text-[11px] font-bold tracking-widest uppercase ${
                        order.actionStyle === 'primary'
                          ? 'fo-btn'
                          : 'border border-primary text-primary hover:bg-primary hover:text-on-primary'
                      }`}
                    >
                      {order.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Adresse + Wishlist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Adresse de livraison */}
            <section>
              <h2 className="font-headline font-extrabold text-xl tracking-tight uppercase mb-8">
                ADRESSE DE LIVRAISON
              </h2>
              <div className="bg-surface p-8 border border-outline-variant/15">
                <p className="font-headline font-bold text-sm mb-4">
                  {user?.name?.toUpperCase() || 'UTILISATEUR'}
                </p>
                <p className="text-secondary text-sm leading-relaxed">
                  42 Avenue des Champs-Élysées
                  <br />
                  75008 Paris, France
                  <br />
                  +33 1 23 45 67 89
                </p>
                <button className="mt-6 text-[11px] font-label tracking-[0.05em] uppercase underline underline-offset-4">
                  MODIFIER L'ADRESSE
                </button>
              </div>
            </section>

            {/* Wishlist */}
            <section>
              <h2 className="font-headline font-extrabold text-xl tracking-tight uppercase mb-8">
                WISHLIST
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {wishlistItems.map((item, i) => (
                  <div
                    key={i}
                    className="group relative aspect-[3/4] overflow-hidden bg-surface-container"
                  >
                    <img
                      src={item.img}
                      alt={item.alt}
                      className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white/90 backdrop-blur text-black p-3">
                        <span className="material-symbols-outlined">shopping_bag</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
