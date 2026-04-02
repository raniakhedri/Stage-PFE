import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'

/* ── All products data (shared source of truth) ── */
const allProducts = [
  {
    id: 1, slug: 'robe-soie-minimaliste',
    name: 'Robe Longue en Soie', collection: 'Nouvelle Collection', price: '280 DT',
    colorName: 'Noir Profond',
    colors: ['#000000', '#d6cec4', '#9e9e9e'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Robe longue fluide confectionnée dans une soie de mûrier de haute qualité. Coupe asymétrique, décolleté plongeant et finitions invisibles pour une allure architecturale et épurée.',
    composition: '100% Soie de mûrier. Doublure en cupro. Lavage à sec recommandé.',
    shipping: 'Livraison standard gratuite (3-5 jours ouvrables). Retours offerts sous 30 jours.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBRUbUTWjh6vtDyy4Q_buLXeSmUAA9iYWzocxRhysVa6IMCXvzL6qWg9Pn1DlaSR0aJKKNkBCkCrRgZb5RudlFPpNqtsIJ1l7X4XlZjmr5cq2d_zX_-KPtrYVDWjesj7foRhHSFWNTsbYjrbmdOnVLXH2Fr-pMTI45j4ZbT6WiDUSXnVSgEA0XxcaqyAdS-Ge0I2XRURaTcIAv3B2na1NnrJ3c1tv8DYiVacwRXtY2fhCqqrhyRDz8xqUSFq6qFD1gregRfsdljGVVn',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBGMeK5qM-VKFogvrkOnblGVR4F1kg2g0X-rj6d-d9Ln5MNPaYkK1nLCSOzJhpMZRHIW7XFK3SfOSwnZEUJUJ6W6go6vO9fnP7-21Ze3sUjSmpI8E43VOz5eqj7bvafuEZTJdTNDsLqe1naG_g9f-AMgCxBEjm7khFxiSzLCGm37idYv8DB-zuIAOZF-ooo-cuJaOwoyq877dptbN-Ga7YOUwY8jpVteqa3yg1BanOOcM8Bhl2bTy0MpOsK2TKDp3PTihw-hNTJ7tdg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDut3lfd_6tKaNkgE6cpBeKCRLHuNdLo23NnB8RgJJfz_nwmnUfptuo1C446qOjtclLF1Lu5zQWwvTP0C2ktdRCWJgbrJNfV-000DYRzhtfWrnnn12MQT1dBebORfwVR6sg9wSbq_0wcmUK4MRDAkTrhuxCFb1Ueup_oYLO5IryPEDIpuz11B7jsYXx7RSHFLL1TkL1odcDyJYlpxOjEJzt7pxDo609hz5sC6SSKFmG_X6pkv_m3owcFZ5wCWAw4Pd7c-ol9eYTEclm',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYiCwjF0qTXXgd8ibaC8Ki1BLwq7szu5pKjBCCDvKL9DMTZ_PiQPK6Yx7hhdFHLiOkkS1pQomH88xDJKjDAzgRdts4Gn-aUikpFOsZQv-y0XeXiUtw4OzReylweukNAG3vCOO4T8uCkVi0V_daj7iHvAPRLxskBbTJ4V-lUHqUHzo_wz1LL_f4wIh_6BgQs_X1ksaybuXZ144lQd--IcIzD1_ZSsG6zuxd6y_POQr9WwPxwhdVQMzzNigLhqf577nzQ4Crkw6yddEH',
    ],
  },
  {
    id: 2, slug: 'chemise-oversize-coton',
    name: 'Chemise Oversize Coton', collection: 'Essentiels', price: '145 DT',
    colorName: 'Blanc',
    colors: ['#ffffff', '#e2e2e2'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Chemise oversize en coton premium avec coupe décontractée et finitions raffinées. Tissu respirant et léger, idéal pour les looks superposés.',
    composition: '100% Coton biologique. Lavage en machine à 30°C.',
    shipping: 'Livraison standard gratuite (3-5 jours ouvrables). Retours offerts sous 30 jours.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB1-bXKWhCL07flnD2XRbGUwK27MpXKxLrFEcPXrEI48d7oT5MXzl2q-gWkmIsPXPG-i6O4QSZqkeMzUiwsANdqeUOC8q_3I1mmk0wjbUEMI4D2cqn13TRLpt0eQosHqx7Tn1AHELmXkVdbdzwhwAfrY8CON_FWuZti7VDyoN2WCHBmWW3ZjR7svvxQhD6JMvzStGP7OFxg4qcprE9eGOAXS23S3vnuoina4rs_THC4TywPOIvVIDjQ8CTC7ThDEd48sXStXTJxZ4M2',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBJxJGPt0OA_cvOEDIDCobVyGWg5Debkg3jAnkYbqW3VftPhnDG1uWdnxSXp-x76P5wj0GfilbXRF03g6_jMKltdPfi3w8Pu1K9T2Tlan_AkXT98uHebyb9piFmCXjuv3ID92KZoxX6weNYzpKslfTinQdqTqzpBWC0QVCs9EMcpnMaYAttQeD9a_oHXx_V6FXo5f7Ry_OLi21UllXeSSqMwN8aBbyV2VDk0kE5C_ikQVpnECpMfXQFm8jkrWMLfej2UJ2E2ljZHpQF',
    ],
  },
  {
    id: 3, slug: 'trench-gabardine-structure',
    name: 'Trench Gabardine Structuré', collection: 'Nouvelle Collection', price: '420 DT',
    colorName: 'Gris Pierre',
    colors: ['#adabaa', '#474747'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Trench en gabardine technique avec structure architecturale. Double boutonnage, ceinture detachable et col surdimensionné pour une silhouette imposante.',
    composition: '65% Polyester, 35% Coton. Doublure viscose. Nettoyage à sec.',
    shipping: 'Livraison standard gratuite (3-5 jours ouvrables). Retours offerts sous 30 jours.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAYIxhk5PDZhb3-W19oV-_bn-eFYcI5ZXlk9H9ksJnWMApEi1ADJNmGmHMLnaeSwv8W9GiUJofuooqoMP7f1iv4S4yyZSSScbCqyFzlud1M_PogS5UBni47G_hlcmAx592UcGqszUP2I8SZ6KW_JZVDxKMLHylEhjBNjxpFNylUCkSL03-i7uL03rAue-jcLEKE_2RrrPF6wwwFG1wJYmeSuyeao_BDFkkIAfvL1dsgGI7dqKFNVSd_F0okdKhWPDOydUTnkFYe_HSH',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDUATeJ0ZRPlm49COh58qLWBpvdCQJF4SUZJmjtt0RsAEcvpmUjr6260affFPDB3Mf84u4gWbhsV_q2SYI1KxnaIjZfD-7Z0QfD2i16wEe97aCSHF2aO7F57Y2chA3UCgs2CfQ0-AqTvErT0Wtj1wQXw6F03VDI-alEnH7iwFsoW3QM8jtntnJXlL-bQvHsTF-S7VwqobZim3kpfQ7HMZZtueYIGMf1x9dLY8e2Kt3REbLoM8AJw4TBa3lcxZNSEUbt5KkNQwLk9TwD',
    ],
  },
  {
    id: 4, slug: 'pantalon-large-laine',
    name: 'Pantalon Large Laine', collection: 'Essentiels', price: '190 DT',
    colorName: 'Anthracite',
    colors: ['#474747', '#000000'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Pantalon large en laine mérinos avec pli permanent. Taille haute, coupe fluide et tombé impeccable pour une allure contemporaine.',
    composition: '100% Laine mérinos. Doublure polyester. Nettoyage à sec.',
    shipping: 'Livraison standard gratuite (3-5 jours ouvrables). Retours offerts sous 30 jours.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-k36kV7TPM31RxnnZi5YPSv9sV_yQxpuYZl3H_7d5HRXXof9ZADnZOJOORk4oSo1cvuijGnCitnZVA3Nftt3MLoomRkpMs8Fp8f_IUr_tCeg5xM-Od918A51kmJSbFT4jR16M4u2eyJnKnGqmGEqcURaTjFJm-KD-I8mvDK18SQk7N_nFY5coX3Z706-T9Ref95tlnqUxANB8K1o-fj4TsfEbMh-V8FTNtp6_IYn4yqH-YgDioLwFd0BB4bByB23vwB-yj9EurG7M',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAMCQaqukLrN4LPY6Ddhj87XTqrlTAIbXlzkV4I2RDzTIudm9pD0mxnv6QMFzesXJDHI7qC1RtF0SQAqCmVCSN849Y6uQv_uQBn8UMFPZXaXisymMAz5YlFtKPuvkQpijohD5yVCtkju3r8v3rTEWYD1JDWX6Umb4dhWJxw1myz9jMtc-nmJ3NHB_EwQSFbVSNBzRmNWTQuwx5h_tt34YTZUXNW2FFddnFVD-lat7AR0ei6lzIWY04x7L--i4I7bbnLSXIOh7VWcxDX',
    ],
  },
  {
    id: 5, slug: 'top-fluide-imprime',
    name: 'Top Fluide Imprimé', collection: 'Printemps-Été', price: '85 DT',
    colorName: 'Écru',
    colors: ['#e2e2e2'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Top fluide à imprimé floral délicat. Coupe ample et manches tombantes pour un look sophistiqué et décontracté.',
    composition: '100% Viscose. Lavage en machine à 30°C.',
    shipping: 'Livraison standard gratuite (3-5 jours ouvrables). Retours offerts sous 30 jours.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAjqLnyVIbURx-170kFClmuOhHhZPBVeWwM-mq4ly8iEd10jFWJo8_sBJvtTSIgKKh8rV9uyzsXrMeUEr1X0hvh16K5ch5ftld-FFAj9lNlHObB2-xye1U9yAZAipEQqVBGa9UFmdMZSmUOIrdp1jGzJp4vDF70m3njbCmUTpr5weKQKN2O0hlQCyiu1uV070yb1OWnD2nC_-dwV5fOCVAt_0HRU9BQYXo891KQnU9inNENh4pI7JQYQ75A0EDWBh63xA8o3FP6BWeY',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBQhKkfivL-HieAAgjsv_s6NYVn4nqWoLoCINRph-fJdz0bhYbpuUQoTyla_etUfRRqX6AmszNzHmf3vuFVAeW0k0cdGtJrlW74Ut6O7fvwA-5eokpujxgwRDYzfrSQQVHcAL7EjLJI3Vg2MpTYLhb8GHM0RjeQHMeItnirSrg5OpJvGJ0UU6kKb0UJnlvjs_gcGFG65A8NNbDSJU4iEUxyH2TptuYDXDwV-pnWnDbewhwxWJwTfeGU3OLk3KlzOWilMLd8BI_GGqn7',
    ],
  },
  {
    id: 6, slug: 'veste-croisee-charcoal',
    name: 'Veste Croisée Charcoal', collection: 'Essentiels', price: '350 DT',
    colorName: 'Charcoal',
    colors: ['#3b3b3c'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Veste croisée en laine mélangée, coupe cintrée avec épaules structurées. Doublure intérieure en cupro et boutons en corne naturelle.',
    composition: '80% Laine, 20% Polyamide. Doublure cupro. Nettoyage à sec.',
    shipping: 'Livraison standard gratuite (3-5 jours ouvrables). Retours offerts sous 30 jours.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAkM6aVE9mwbDwxqKCHnloJzCXQAyiN2H4gBQYUtXpRVytVu5BSB9eMG3LBaG-N9yYOiXLntFp8L0zjobWFXcDM3XbAckMMgiS_GVZqVtBvw8tF2WgUfKrc8NTQMpRfiOnK1_Gk5XwyGqq8L2jHJFlJkuHbi9WxjZx73ECYkNESMrJrGiKrMwXypsT3KSJ3lJXumDUhn2tSX3dLghYBNlcy_sA-rxHgyRI1SsUVUvDErEHBgVWvIQEguKrFf8lLYd9w9_CczUm5rJgm',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDF-OvGyj4TWLAxfafwhHj-HhDvcDXG48BapiECmH8QN49WYS82Cbqk6CnDTjiPM6x6zbY_V6ENYJpAShW9lNRKRaIsvCTKtHp1W85B3WwAaCZqy7FuHX446aflZtRyX9kYeXQ94I7osOZz-gOFBcRJumhpGlmI_oMGfU2fhnRuzRrMZpAWbyufWzQex59Cl9mN0ZSOvMsE3v7cVMMsSN-FGNJVngL1z9kfGcaO1iENAdAPsdKXigSmyhusXdLu5Vj5V3VP3vIa7PDZ',
    ],
  },
  {
    id: 7, slug: 'sac-cabas-cuir-graine',
    name: 'Sac Cabas Cuir Grainé', collection: 'Accessoires', price: '550 DT',
    colorName: 'Noir',
    colors: ['#000000'],
    sizes: ['UNIQUE'],
    description: 'Sac cabas en cuir de veau grainé avec structure rigide. Intérieur suédé avec poche zippée. Poignées renforcées et fermoir magnétique.',
    composition: '100% Cuir de veau. Doublure suède. Entretien cuir recommandé.',
    shipping: 'Livraison standard gratuite (3-5 jours ouvrables). Retours offerts sous 30 jours.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9zdNGeYA42g1ssyN0P1A90519ujotj9oBWAMKLKFGsDG7Wxh39v2w76MFiIQTr7u5S7ZpTHarqFWYGdCFVYPoQZmuXcUMK6zBCe-aoOfRaLEJ3U5ZsfdVl-zvm6Zm_dn63Ny8RLhu0-IVa8yavl58MyYJVzrWY1srWeGDeT9RknI5cJtTr0wssp89h1vzcZkmvhwgljud-fLvUCplYL5asA9HGT9Jf5IzTUNK8aDAM0bCbfcBuE2Qdq9ObJEUwPNd9efJoaodBjbH',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAyHE2TTSh98KhvpoHNw15Vv9nqfomIf9yijJ1bm97F_jD5nOzuEH4d0Ng7UNNRMdG3CK76iE7N1Q-nEcEhfa7mMUZuuVdNn7M0MOxzDLQRhg0Ga_y79yAheaDo9U60KyDQ7G3MSMGbQunDxFAer2aeI-d3kfg_A00DbVBnQLvZ0x8F3BM_YHBNdgkkjIIScJ2SuAlkx0CE7tAIhzHCMXhRYYsulB59di8Eq_5CI83lkzzqONRwl_vYUiZ9WqRoG10lk17EpN7PF8Jc',
    ],
  },
  {
    id: 8, slug: 'pull-cachemire-epais',
    name: 'Pull Cachemire Épais', collection: 'Essentiels', price: '295 DT',
    colorName: 'Perle',
    colors: ['#e2e2e2', '#adabaa'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Pull en cachemire épais avec maille côtelée et coupe légèrement oversize. Finitions roulottées et emmanchures tombantes.',
    composition: '100% Cachemire. Lavage à la main recommandé.',
    shipping: 'Livraison standard gratuite (3-5 jours ouvrables). Retours offerts sous 30 jours.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBJth2A7HL2azpBJAAwM9NgXQcXJKLNka-Erl0U7RnPSJu1v0ZT8bpfwnWVjDhkJDzq3OhdDr9vc0oAtsJmBBsCavBffiu1IGx_EndfN3ROuWKpm0-eppZx_JNLanKJP6gyfsZHSeg8JyZPeiGJ64IAbDaId07aBCrjF7hLF7LgMcX20nnHMe1PRJhMZ2uwxec2RQrAlCTDW3VeP23B6xpAQOL5furhYZ-p7jAiQ2RNhIc1MjsRK4eNfnPRvMzsJOB5SdVTSp1nTNye',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMzHS9vvV1T8m2KuY_iwkNT3ha1NeWu90QOjdUlAsa_OET716bpNX9yJB7QkYI_-EYGZED9kdhhzS3Qui-a7SNy3OaNVLLixDFMMUdvXN3PczCmRtPjhZb2Qkx46wVoNybYsJ0D6xa98H9fg49cX8wZNCVaf4bcdhib5m482mwLJHXDnVCrkFvgrmtO_RpmJYZyEfYsUk55LZfuavlqAF_xf-R2oyJKHi9gk5wtkC5PQrBuuL2ph1r7r8-P-pkgAsnpYsc3DdVuSuQ',
    ],
  },
]

const similarProducts = [
  { name: 'Blazer Structuré', price: '189 DT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcPTIe4KpvarIxt541R0Om-eb_9dMd63YtAaFATTIymfU7m026h2PKN4HQYdxuH7e1EKYEvpAd-i3tctnsWUzw88vQbeVJEHRYG01Z1mmm_Gt6SNSEueXdxVpxVC_88hxQHC3sfHZAu4DYRXB_wi5-4snPVt79I7BDU_esq4UfyS78XoqwOy6z_EMiO4-SYpFRgWtONFEOpbGQbGX57xDnul0AZ7kZy71QN712q2_aJMQ0ghaZInP5hlqASaDocq4wQ8yPZEH27zNg' },
  { name: 'Pantalon Large en Laine', price: '95 DT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrkINWGSPeBdQgSF9KZ82vd3891E4467EiXKjBKlOykKNTNrYJfEEeqZ9vCemAAxyFocVikXNeIKi2KY-8w9_NIBd5afEo8Rldq0Lv1PZjcR8cRdUY0dBI1uX9MssfSqXNSwTNG0xGs4726FP8uTwP69F068gyKeZKgk99BQspI3HcALJINBq5wgJ9fMe_0G54GtCdY-vCCYzc76uQCWfMIKZELFx6XZCOqZ4ToOQiZVMmOKJck-_MEdaY4zyxCCYiPiJ9irr91j39' },
  { name: 'Top en Maille Fine', price: '59 DT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKU1mroyKUsGn5c4ReIE1JGodFlFXL2Sovt2OFe5z622gHhqo3VQm4OdDZnR__frw-Lp8_FDTN2d0YR2JKP-e1Qm-RYNJLOfAZvcNMB3EXuuz6SqCYkrIgD0skbfvJLI48zF-nmxTXEA1FSXZPykPyp0RQw0vTxauj8gw53qs1LmGBFRIlAijJXH0Qn1V_lZbShkxZl1zulYWw1JA3cXCzDkqKXr-M7F4b7o-8fLFsYAAmwzCmAIrjLyI-KNTBsXVZ5K6yVc7V-COA' },
  { name: 'Manteau en Cachemire', price: '450 DT', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALOc-p7AGF5fuEYdOTzWuwDyHZTUvkx1UWZQlKurRFJBDwH9Bjct6wkHC2RMFRHMWH8HuflXBV3xcB9vFn9ay4Oe9BFG4N_3K3u4q79bsXg6aDEgQw1qMIfk11fDlD9cprgOBhvxr-xJN5_pYL-ZdrEIm1yXFdnhl3PdQr60qm7NSmTpGLjYsQ0-rHRxsAgnutsY_ce9KOgxCgT9SRQIK1-2WT6yjr5g0Ifwru7pkGl1M2-3PgoNMbAY6JrP2YIXmKPN-D0cNeNipM' },
]

export default function ProductDetail() {
  const { slug } = useParams()
  const product = allProducts.find((p) => p.slug === slug) || allProducts[0]

  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState(0)
  const [openAccordion, setOpenAccordion] = useState('description')

  const toggleAccordion = (key) => {
    setOpenAccordion(openAccordion === key ? null : key)
  }

  return (
    <main className="pt-32 pb-20 px-4 md:px-12 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Left: Editorial Image Gallery */}
        <div className="lg:col-span-7 grid grid-cols-1 gap-4">
          {/* Main image */}
          <div className="aspect-[2/3] w-full bg-surface-container overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Two small images side by side */}
          {product.images.length > 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[2/3] bg-surface-container overflow-hidden">
                <img src={product.images[1]} alt="Détail" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[2/3] bg-surface-container overflow-hidden">
                <img src={product.images[2]} alt="Vue alternative" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          {/* Full-width lookbook image */}
          {product.images.length > 3 && (
            <div className="aspect-[2/3] w-full bg-surface-container overflow-hidden">
              <img src={product.images[3]} alt="Lookbook" className="w-full h-full object-cover" />
            </div>
          )}
          {/* Fallback for products with only 2 images */}
          {product.images.length === 2 && (
            <div className="aspect-[2/3] w-full bg-surface-container overflow-hidden">
              <img src={product.images[1]} alt="Vue alternative" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Right: Product Details (Sticky) */}
        <div className="lg:col-span-5 flex flex-col h-fit lg:sticky lg:top-32">
          {/* Title & Price */}
          <div className="mb-10">
            <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500 mb-2 block font-label">
              {product.collection}
            </span>
            <h1 className="text-4xl font-bold tracking-tight uppercase mb-4">{product.name}</h1>
            <p className="text-2xl font-light text-on-surface">{product.price}</p>
          </div>

          {/* Color Selection */}
          <div className="mb-8">
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase block mb-4 font-label">
              Couleur : {product.colorName}
            </span>
            <div className="flex gap-3">
              {product.colors.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(i)}
                  className="w-8 h-8"
                  style={{
                    backgroundColor: c,
                    border: c === '#ffffff' ? '1px solid #c6c6c6' : '1px solid transparent',
                    outline: selectedColor === i ? '1px solid rgba(0,0,0,0.2)' : 'none',
                    outlineOffset: '4px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-10">
            <div className="flex justify-between items-end mb-4">
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase block font-label">
                Sélectionner la Taille
              </span>
              <button className="text-[11px] uppercase underline underline-offset-4 text-neutral-500 hover:text-black">
                Guide des tailles
              </button>
            </div>
            <div className="grid gap-0 border border-neutral-200" style={{ gridTemplateColumns: `repeat(${product.sizes.length}, 1fr)` }}>
              {product.sizes.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`py-4 text-[13px] ${
                    i < product.sizes.length - 1 ? 'border-r border-neutral-200' : ''
                  } ${
                    selectedSize === s
                      ? 'bg-black text-white'
                      : 'hover:bg-black hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 mb-12">
            <button className="w-full fo-btn py-6 text-[14px] font-bold uppercase tracking-widest">
              Ajouter au Panier
            </button>
            <button className="w-full flex items-center justify-center gap-2 py-4 border border-neutral-200 hover:border-black uppercase text-[12px] font-bold tracking-widest">
              <span className="material-symbols-outlined">favorite</span>
              Ajouter aux favoris
            </button>
          </div>

          {/* Accordions */}
          <div className="border-t border-neutral-200">
            {/* Description */}
            <div className="py-6 border-b border-neutral-200 cursor-pointer" onClick={() => toggleAccordion('description')}>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold tracking-[0.1em] uppercase font-label">Description</span>
                <span className="material-symbols-outlined">{openAccordion === 'description' ? 'expand_less' : 'expand_more'}</span>
              </div>
              {openAccordion === 'description' && (
                <p className="mt-4 text-[14px] leading-relaxed text-neutral-600">
                  {product.description}
                </p>
              )}
            </div>
            {/* Composition */}
            <div className="py-6 border-b border-neutral-200 cursor-pointer" onClick={() => toggleAccordion('composition')}>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold tracking-[0.1em] uppercase font-label">Composition</span>
                <span className="material-symbols-outlined">{openAccordion === 'composition' ? 'expand_less' : 'expand_more'}</span>
              </div>
              {openAccordion === 'composition' && (
                <p className="mt-4 text-[14px] leading-relaxed text-neutral-600">
                  {product.composition}
                </p>
              )}
            </div>
            {/* Livraison & Retours */}
            <div className="py-6 border-b border-neutral-200 cursor-pointer" onClick={() => toggleAccordion('shipping')}>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold tracking-[0.1em] uppercase font-label">Livraison & Retours</span>
                <span className="material-symbols-outlined">{openAccordion === 'shipping' ? 'expand_less' : 'expand_more'}</span>
              </div>
              {openAccordion === 'shipping' && (
                <p className="mt-4 text-[14px] leading-relaxed text-neutral-600">
                  {product.shipping}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      <section className="mt-40">
        <h2 className="text-[13px] font-bold tracking-[0.2em] uppercase mb-12 text-center font-label">
          Vous aimerez aussi
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {similarProducts.map((item) => (
            <div key={item.name} className="group cursor-pointer">
              <div className="aspect-[3/4] bg-surface-container mb-4 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-tight">{item.name}</p>
                <p className="text-[12px] text-neutral-500">{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
