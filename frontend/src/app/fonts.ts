import localFont from 'next/font/local'

export const clashDisplay = localFont({
  src: '../../public/fonts/ClashDisplay-Variable.woff2',
  weight: '200 700',
  variable: '--font-display',
  display: 'swap',
})

export const satoshi = localFont({
  src: [
    { path: '../../public/fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
})
