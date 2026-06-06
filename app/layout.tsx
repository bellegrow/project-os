import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ProjectOS',
  description: '情報を探す時間は、仕事じゃない。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
