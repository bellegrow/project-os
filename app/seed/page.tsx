'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function isoAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFrom(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function SeedPage() {
  const router = useRouter()

  useEffect(() => {
    const today = daysAgo(0)

    // ─── Project IDs ─────────────────────────────────────────────
    const p1 = 'seed0001-0001-0001-0001-000000000001' // さくら整体院
    const p2 = 'seed0002-0002-0002-0002-000000000002' // 山田建設 コーポレート
    const p3 = 'seed0003-0003-0003-0003-000000000003' // Fleur Design Studio
    const p4 = 'seed0004-0004-0004-0004-000000000004' // 田中税理士事務所
    const p5 = 'seed0005-0005-0005-0005-000000000005' // ao cafe
    const p6 = 'seed0006-0006-0006-0006-000000000006' // 山田建設 採用

    // ─── Estimate IDs ────────────────────────────────────────────
    const e1 = 'est00001-e001-e001-e001-000000000001' // Fleur approved
    const e2 = 'est00002-e002-e002-e002-000000000001' // 山田建設 sent
    const e3 = 'est00003-e003-e003-e003-000000000001' // ao cafe sent
    const e4 = 'est00004-e004-e004-e004-000000000001' // 山田採用 approved

    // ─── Contract IDs ────────────────────────────────────────────
    const c1 = 'cont0001-c001-c001-c001-000000000001' // Fleur signed
    const c2 = 'cont0002-c002-c002-c002-000000000001' // 山田建設 sent
    const c3 = 'cont0003-c003-c003-c003-000000000001' // 山田採用 signed

    // ─── Invoice IDs ─────────────────────────────────────────────
    const inv1 = 'invo0001-i001-i001-i001-000000000001' // Fleur paid
    const inv2 = 'invo0002-i002-i002-i002-000000000001' // 山田採用 sent

    // ─── Settings ────────────────────────────────────────────────
    const settings = {
      issuerName: 'ProjectOS デモ事務所',
      issuerDepartment: '',
      issuerEmail: 'demo@project-os.example',
      issuerPhone: '03-1234-5678',
      issuerPostalCode: '150-0001',
      issuerAddress: '東京都渋谷区神宮前1-1-1',
      issuerInvoiceNumber: 'T1234567890123',
      bankName: 'デモ銀行',
      bankBranch: '渋谷支店',
      bankAccountType: '普通',
      bankAccountNumber: '1234567',
      bankAccountHolder: 'デモ ジムショ',
      taxRate: 10,
      estimateValidDays: 30,
      invoiceDueDays: 30,
      documentNote: 'お振込の際は振込手数料をご負担ください。',
      neglectedCheckDays: 7,
      neglectedActionDays: 14,
      profitRateThreshold: 20,
      costOnlyAsCheck: true,
    }

    // ─── Projects ────────────────────────────────────────────────
    const projects = [
      {
        id: p1,
        clientName: 'さくら整体院',
        name: 'ホームページリニューアル',
        status: '進行中',
        budget: 480000,
        createdAt: isoAgo(45),
        updatedAt: isoAgo(10), // neglected (>7 days)
      },
      {
        id: p2,
        clientName: '山田建設株式会社',
        name: 'コーポレートサイト大規模リニューアル',
        status: '受注',
        budget: 2800000,
        createdAt: isoAgo(32),
        updatedAt: isoAgo(2),
      },
      {
        id: p3,
        clientName: 'Fleur Design Studio',
        name: 'ブランドサイト・ECサイト制作',
        status: '完了',
        budget: 1200000,
        createdAt: isoAgo(120),
        updatedAt: isoAgo(22),
      },
      {
        id: p4,
        clientName: '田中税理士事務所',
        name: '顧問先向けポータルサイト構築',
        status: '商談中',
        budget: 3500000,
        createdAt: isoAgo(14),
        updatedAt: isoAgo(3),
      },
      {
        id: p5,
        clientName: 'ao cafe',
        name: '新メニュー告知LP制作',
        status: '提案済',
        budget: 350000,
        createdAt: isoAgo(20),
        updatedAt: isoAgo(5),
      },
      {
        id: p6,
        clientName: '山田建設株式会社',
        name: '採用特設サイト制作',
        status: '進行中',
        budget: 1500000,
        createdAt: isoAgo(62),
        updatedAt: isoAgo(1),
      },
    ]

    // ─── Hearings ────────────────────────────────────────────────
    const hearings = [
      // p1 さくら整体院
      {
        id: 'hear0001-h001-h001-h001-000000000001',
        projectId: p1,
        date: daysAgo(42),
        memo: `目的：
既存サイトのリニューアル相談

現状の課題：
スマートフォン対応が不十分で表示が崩れる
予約フォームがなく電話対応に依存している
施術メニューの説明が少なく問い合わせが多い

要望：
モバイルファーストで使いやすいデザイン
Web予約システムの組み込み（外部サービス連携）
施術メニュー・料金表を見やすく整理

予算感：
40〜50万円

スケジュール：
夏頃のリニューアルオープンに間に合わせたい`,
        createdAt: isoAgo(42),
      },
      {
        id: 'hear0001-h001-h001-h001-000000000002',
        projectId: p1,
        date: daysAgo(25),
        memo: `デザイン方向性の確認：

トーン：
やさしさ・温かみを重視。白×淡いピンク・ベージュ系

参考サイト：
先生が選んだ参考事例3件を共有。共通点は余白が多くシンプルなデザイン

コンテンツ決定事項：
トップ、メニュー・料金、アクセス、予約、施術者紹介の5ページ構成
施術者写真は先方が用意（来週撮影予定）
予約システムはSTORESを使用予定（埋め込みで対応）

追加要望：
メニュー一覧にアイコンを入れてほしい
「よくある質問」セクションを追加希望`,
        createdAt: isoAgo(25),
      },

      // p2 山田建設 コーポレート
      {
        id: 'hear0002-h002-h002-h002-000000000001',
        projectId: p2,
        date: daysAgo(30),
        memo: `目的：
創業55周年に向けてコーポレートサイトを全面刷新したい

現状の課題：
12年前に制作したサイトでスマートフォン未対応
施工実績の掲載数が少なく訴求力が弱い
採用ページへのアクセスが低く応募が集まらない

要望：
施工事例を写真中心で大きく見せるデザイン
採用ページを充実させてエンジニア・施工管理職の採用強化
CMS対応で社内で実績更新できるようにしたい
地図・アクセス情報の改善

予算感：
280万円程度で検討中

スケジュール：
来年3月の創業記念日に合わせてリリース希望`,
        createdAt: isoAgo(30),
      },
      {
        id: 'hear0002-h002-h002-h002-000000000002',
        projectId: p2,
        date: daysAgo(10),
        memo: `キックオフ後の要件整理：

サイト構成（確定）：
トップ / 会社案内 / 事業内容（建築・土木・設備の3部門）
施工事例（カテゴリ別） / 採用情報 / お問い合わせ

CMS方針：
施工事例と採用情報のみCMS化（microCMS使用）
事例は写真・工期・エリアを管理

デザインイメージ：
重厚感・信頼感。紺×白×ゴールド系
競合他社との差別化ポイントは「地域密着55年の実績」を押し出す

体制：
当社：PM1名＋デザイン1名＋フロントエンド1名
先方窓口：広報担当の田中さん
定例：隔週月曜10時`,
        createdAt: isoAgo(10),
      },

      // p3 Fleur Design Studio
      {
        id: 'hear0003-h003-h003-h003-000000000001',
        projectId: p3,
        date: daysAgo(115),
        memo: `目的：
セレクトショップ兼デザイン事務所のブランドサイトとECサイトを制作したい

現状：
Instagram中心でWebサイトはない状態
商品販売はBase経由で行っているが自社サイトが欲しい

要望：
ブランドらしい世界観を表現したデザイン
EC機能は最初はシンプルでよい（Shopify等との連携も検討）
日英バイリンガル対応希望

予算感：
120万円前後

スケジュール：
3〜4ヶ月で制作`,
        createdAt: isoAgo(115),
      },
      {
        id: 'hear0003-h003-h003-h003-000000000002',
        projectId: p3,
        date: daysAgo(90),
        memo: `デザイン方向性の決定：

コンセプト：
「静謐と存在感」。余白を大切にしたミニマルデザイン
フランス語のブランド名を活かした欧文タイポグラフィ重視

カラーパレット：
ほぼモノトーン（白・黒・グレー）にベージュのアクセント

EC方針：
独自デザインでフロントを作りAPIで繋ぐ
まずは10〜20点程度の商品展開

提供素材：
プロカメラマンで撮影した写真300点を提供済み
ブランドロゴのベクターデータあり`,
        createdAt: isoAgo(90),
      },
      {
        id: 'hear0003-h003-h003-h003-000000000003',
        projectId: p3,
        date: daysAgo(35),
        memo: `最終確認ミーティング：

修正対応の確認：
トップのビジュアルアニメーションを調整済み
商品詳細ページのレイアウト変更完了
英語テキストの校正（先方手配のネイティブチェック済み）

納品内訳の確認：
デザインデータ（Figma）
ソースコード（GitHub）
CMS操作マニュアル（PDF）

請求・契約確認：
請求書は今週中に送付予定
振込期限は月末まで`,
        createdAt: isoAgo(35),
      },

      // p4 田中税理士事務所
      {
        id: 'hear0004-h004-h004-h004-000000000001',
        projectId: p4,
        date: daysAgo(13),
        memo: `目的：
顧問先（法人50社）向けの月次報告・資料共有ポータルサイトを作りたい

現状：
毎月メールで資料を送付しているが管理が煩雑
顧問先からの問い合わせが多く対応コストがかかっている

要望：
ログイン機能付きのポータル（顧問先ごとにデータ閲覧）
月次レポートのPDFアップロード・ダウンロード機能
問い合わせフォーム・チャット機能があれば尚可

技術面：
セキュリティを最重視（会計情報を扱うため）
スマートフォンでも使いやすいこと

予算感：
350万円以内

スケジュール：
半年程度で稼働したい`,
        createdAt: isoAgo(13),
      },
      {
        id: 'hear0004-h004-h004-h004-000000000002',
        projectId: p4,
        date: daysAgo(3),
        memo: `技術選定の議論：

認証方式：
Supabase Auth（マジックリンク）で顧問先ごとのログインを管理
RLS（Row Level Security）でデータの分離を実現

ファイル管理：
Supabase Storageにアップロード
フォルダ構造：/顧問先ID/年月/ファイル名

フロント：
Next.js + Tailwind CSS
レスポンシブ対応必須

次のアクション：
システム設計書のドラフトを2週間以内に提出
セキュリティ要件の洗い出しを先方と合わせて進める`,
        createdAt: isoAgo(3),
      },

      // p5 ao cafe
      {
        id: 'hear0005-h005-h005-h005-000000000001',
        projectId: p5,
        date: daysAgo(18),
        memo: `目的：
夏季限定メニューの告知LP制作

訴求ポイント：
かき氷・冷製スムージー新メニューの紹介
写真映えを意識したビジュアル重視
カフェの世界観（北欧×和）を伝える

ターゲット：
20〜35歳の女性
インスタ経由でLPに誘導する想定

要件：
LPは1ページ完結
予約・問い合わせはInstagramへのリンクのみ
掲載期間：7月〜9月の3ヶ月

予算感：
30〜35万円

スケジュール：
7月1日オープンに間に合わせたい`,
        createdAt: isoAgo(18),
      },

      // p6 山田建設 採用
      {
        id: 'hear0006-h006-h006-h006-000000000001',
        projectId: p6,
        date: daysAgo(60),
        memo: `目的：
エンジニア・施工管理職を中心とした採用特設サイトの制作

現状の課題：
採用サイトがなく求人票のみで応募者に会社の雰囲気が伝わらない
特にエンジニア採用が難しく、SNS活用も検討中

ターゲット：
第二新卒〜30代前半のエンジニア・施工管理職

要望：
社員インタビューで職場の雰囲気を伝えたい
フレックスタイム・リモートワーク制度を前面に出す
エントリーフォームはGoogleフォームで代替可

予算感：
150万円

スケジュール：
春の採用シーズンに間に合わせたい`,
        createdAt: isoAgo(60),
      },
      {
        id: 'hear0006-h006-h006-h006-000000000002',
        projectId: p6,
        date: daysAgo(45),
        memo: `キックオフ確認ミーティング：

サイト構成（決定）：
トップ / 募集要項（職種別） / 社員インタビュー（5名）
職場環境 / よくある質問 / エントリーページ

インタビュー対象者：
エンジニア2名・施工管理1名・ディレクター1名・人事1名
撮影は外注カメラマンに依頼済み

コンテンツ提供スケジュール：
写真素材：先月提供済み
インタビュー原稿：先方担当者が草案作成中

技術要件：
CMS：microCMSで求人情報管理
GA4設置必須
モバイルファースト`,
        createdAt: isoAgo(45),
      },
    ]

    // ─── Estimates ───────────────────────────────────────────────
    // subtotal / tax(10%) / total はすべて手計算で一致させること
    const estimates = [
      {
        id: e1,
        projectId: p3,
        title: 'ブランドサイト・ECサイト制作 御見積書',
        status: 'approved',
        subtotal: 1090000, // 450000+380000+200000+60000
        tax: 109000,
        total: 1199000,
        note: '本見積書の有効期限は発行日より30日間です。',
        items: [
          { id: 'esti0001-ei01-ei01-ei01-000000000001', estimateId: e1, name: 'デザイン制作', description: 'トップ・下層ページのデザイン全ページ分', quantity: 1, unitPrice: 450000, amount: 450000, sortOrder: 1 },
          { id: 'esti0001-ei01-ei01-ei01-000000000002', estimateId: e1, name: 'フロントエンド実装', description: 'HTML/CSS/JSによるコーディング・レスポンシブ対応', quantity: 1, unitPrice: 380000, amount: 380000, sortOrder: 2 },
          { id: 'esti0001-ei01-ei01-ei01-000000000003', estimateId: e1, name: 'CMS構築', description: 'microCMS連携・管理画面設定', quantity: 1, unitPrice: 200000, amount: 200000, sortOrder: 3 },
          { id: 'esti0001-ei01-ei01-ei01-000000000004', estimateId: e1, name: 'コンテンツ入稿サポート', description: '初期コンテンツの入稿代行・確認', quantity: 1, unitPrice: 60000, amount: 60000, sortOrder: 4 },
        ],
        createdAt: isoAgo(100),
        updatedAt: isoAgo(95),
      },
      {
        id: e2,
        projectId: p2,
        title: 'コーポレートサイト大規模リニューアル 御見積書',
        status: 'sent',
        subtotal: 2550000, // 300000+600000+800000+500000+200000+150000
        tax: 255000,
        total: 2805000,
        note: '本見積書の有効期限は発行日より30日間です。不明点はお気軽にご連絡ください。',
        items: [
          { id: 'esti0002-ei02-ei02-ei02-000000000001', estimateId: e2, name: 'ディレクション・要件定義', description: '要件ヒアリング・サイト設計・スケジュール管理', quantity: 1, unitPrice: 300000, amount: 300000, sortOrder: 1 },
          { id: 'esti0002-ei02-ei02-ei02-000000000002', estimateId: e2, name: 'UXデザイン', description: 'ワイヤーフレーム・デザインカンプ（全ページ）', quantity: 1, unitPrice: 600000, amount: 600000, sortOrder: 2 },
          { id: 'esti0002-ei02-ei02-ei02-000000000003', estimateId: e2, name: 'フロントエンド実装', description: 'HTML/CSS/JSコーディング・レスポンシブ・アニメーション', quantity: 1, unitPrice: 800000, amount: 800000, sortOrder: 3 },
          { id: 'esti0002-ei02-ei02-ei02-000000000004', estimateId: e2, name: 'CMS構築（microCMS）', description: '施工事例・採用情報のCMS化', quantity: 1, unitPrice: 500000, amount: 500000, sortOrder: 4 },
          { id: 'esti0002-ei02-ei02-ei02-000000000005', estimateId: e2, name: 'SEO対策・メタ設定', description: 'タイトル・ディスクリプション・構造化データ設定', quantity: 1, unitPrice: 200000, amount: 200000, sortOrder: 5 },
          { id: 'esti0002-ei02-ei02-ei02-000000000006', estimateId: e2, name: '施工事例ページ制作', description: '事例1件あたりの制作費', quantity: 10, unitPrice: 15000, amount: 150000, sortOrder: 6 },
        ],
        createdAt: isoAgo(20),
        updatedAt: isoAgo(20),
      },
      {
        id: e3,
        projectId: p5,
        title: '夏季限定メニュー告知LP 御見積書',
        status: 'sent',
        subtotal: 330000, // 180000+120000+30000
        tax: 33000,
        total: 363000,
        note: '素材（写真・テキスト）はクライアント様にご用意いただきます。',
        items: [
          { id: 'esti0003-ei03-ei03-ei03-000000000001', estimateId: e3, name: 'LPデザイン制作', description: 'ランディングページ全セクションのデザイン', quantity: 1, unitPrice: 180000, amount: 180000, sortOrder: 1 },
          { id: 'esti0003-ei03-ei03-ei03-000000000002', estimateId: e3, name: 'LPコーディング・レスポンシブ対応', description: 'HTML/CSS/JSによるコーディング・スマートフォン対応', quantity: 1, unitPrice: 120000, amount: 120000, sortOrder: 2 },
          { id: 'esti0003-ei03-ei03-ei03-000000000003', estimateId: e3, name: '撮影ディレクション', description: '料理写真撮影の立ち会い・ディレクション', quantity: 1, unitPrice: 30000, amount: 30000, sortOrder: 3 },
        ],
        createdAt: isoAgo(12),
        updatedAt: isoAgo(12),
      },
      {
        id: e4,
        projectId: p6,
        title: '採用特設サイト制作 御見積書',
        status: 'approved',
        subtotal: 1380000, // 200000+480000+550000+150000
        tax: 138000,
        total: 1518000,
        note: '社員インタビューの撮影費用は別途外注費として計上します。',
        items: [
          { id: 'esti0004-ei04-ei04-ei04-000000000001', estimateId: e4, name: '採用サイト設計・ディレクション', description: '要件定義・サイトマップ設計・進行管理', quantity: 1, unitPrice: 200000, amount: 200000, sortOrder: 1 },
          { id: 'esti0004-ei04-ei04-ei04-000000000002', estimateId: e4, name: 'デザイン制作', description: 'トップ〜下層ページのデザイン制作', quantity: 1, unitPrice: 480000, amount: 480000, sortOrder: 2 },
          { id: 'esti0004-ei04-ei04-ei04-000000000003', estimateId: e4, name: 'フロントエンド実装', description: 'Next.js実装・アニメーション・レスポンシブ', quantity: 1, unitPrice: 550000, amount: 550000, sortOrder: 3 },
          { id: 'esti0004-ei04-ei04-ei04-000000000004', estimateId: e4, name: '社員インタビューページ制作', description: 'インタビューページ1名分のコーディング・デザイン', quantity: 5, unitPrice: 30000, amount: 150000, sortOrder: 4 },
        ],
        createdAt: isoAgo(55),
        updatedAt: isoAgo(50),
      },
    ]

    // ─── Contracts ───────────────────────────────────────────────
    const contracts = [
      {
        id: c1,
        projectId: p3,
        estimateId: e1,
        title: 'Fleur Design Studio ブランドサイト・EC制作 業務委託契約',
        status: 'signed',
        contractDate: daysAgo(95),
        startDate: daysAgo(95),
        endDate: daysAgo(25),
        amount: 1199000,
        note: '納品後60日以内に全額お振込みください。',
        createdAt: isoAgo(96),
        updatedAt: isoAgo(25),
      },
      {
        id: c2,
        projectId: p2,
        estimateId: e2,
        title: '山田建設株式会社 コーポレートサイトリニューアル 業務委託契約',
        status: 'sent',
        contractDate: daysAgo(15),
        startDate: daysAgo(10),
        amount: 2805000,
        note: '着手金として総額の30%（841,500円）を契約締結後10日以内にお振込みください。',
        createdAt: isoAgo(18),
        updatedAt: isoAgo(15),
      },
      {
        id: c3,
        projectId: p6,
        estimateId: e4,
        title: '山田建設株式会社 採用特設サイト制作 業務委託契約',
        status: 'signed',
        contractDate: daysAgo(52),
        startDate: daysAgo(50),
        endDate: daysAgo(5),
        amount: 1518000,
        note: '中間払いとして50%を制作開始1ヶ月後にお振込みください。残額は納品時。',
        createdAt: isoAgo(54),
        updatedAt: isoAgo(52),
      },
    ]

    // ─── Invoices ────────────────────────────────────────────────
    const invoices = [
      {
        id: inv1,
        projectId: p3,
        estimateId: e1,
        title: 'Fleur Design Studio ブランドサイト・EC制作 御請求書',
        status: 'paid',
        subtotal: 1090000, // 450000+380000+200000+60000
        tax: 109000,
        total: 1199000,
        dueDate: daysAgo(8),
        paidAt: daysAgo(3),
        paidAmount: 1199000,
        paymentNote: '入金確認済み。領収書を発行済み。',
        note: '大変お世話になりました。引き続きよろしくお願いいたします。',
        items: [
          { id: 'invi0001-ii01-ii01-ii01-000000000001', invoiceId: inv1, name: 'デザイン制作', description: 'トップ・下層ページのデザイン全ページ分', quantity: 1, unitPrice: 450000, amount: 450000, sortOrder: 1 },
          { id: 'invi0001-ii01-ii01-ii01-000000000002', invoiceId: inv1, name: 'フロントエンド実装', description: 'HTML/CSS/JSによるコーディング・レスポンシブ対応', quantity: 1, unitPrice: 380000, amount: 380000, sortOrder: 2 },
          { id: 'invi0001-ii01-ii01-ii01-000000000003', invoiceId: inv1, name: 'CMS構築', description: 'microCMS連携・管理画面設定', quantity: 1, unitPrice: 200000, amount: 200000, sortOrder: 3 },
          { id: 'invi0001-ii01-ii01-ii01-000000000004', invoiceId: inv1, name: 'コンテンツ入稿サポート', description: '初期コンテンツの入稿代行・確認', quantity: 1, unitPrice: 60000, amount: 60000, sortOrder: 4 },
        ],
        createdAt: isoAgo(25),
        updatedAt: isoAgo(3),
      },
      {
        id: inv2,
        projectId: p6,
        estimateId: e4,
        title: '採用特設サイト制作 中間請求書（着手金50%）',
        status: 'sent',
        subtotal: 690000,
        tax: 69000,
        total: 759000,
        dueDate: daysFrom(20),
        note: 'お振込の際は振込手数料をご負担ください。',
        items: [
          { id: 'invi0002-ii02-ii02-ii02-000000000001', invoiceId: inv2, name: '採用特設サイト制作 着手金（50%）', description: '総額1,518,000円のうち50%', quantity: 1, unitPrice: 690000, amount: 690000, sortOrder: 1 },
        ],
        createdAt: isoAgo(5),
        updatedAt: isoAgo(5),
      },
    ]

    // ─── Activities ──────────────────────────────────────────────
    const activities = [
      {
        id: 'acti0001-a001-a001-a001-000000000001',
        projectId: p2,
        type: 'meeting',
        title: '【山田建設】キックオフ前の事前確認MTG',
        body: '担当の田中さんと電話で事前確認。見積書の内容に概ね合意。来週のキックオフMTGで細部を詰める予定。',
        occurredAt: isoAgo(2),
        createdAt: isoAgo(2),
      },
      {
        id: 'acti0002-a002-a002-a002-000000000001',
        projectId: p4,
        type: 'meeting',
        title: '【田中税理士】技術選定の打ち合わせ',
        body: 'Supabaseを使ったポータルサイトの設計について議論。RLSによるデータ分離とマジックリンク認証の方針で合意。次回は設計書のドラフトを提出する。',
        occurredAt: isoAgo(3),
        createdAt: isoAgo(3),
      },
      {
        id: 'acti0003-a003-a003-a003-000000000001',
        projectId: p5,
        type: 'note',
        title: '【ao cafe】見積書送付・フォローアップ',
        body: '見積書（363,000円）をメールで送付した。1週間後に返答予定。撮影ディレクションの範囲についても確認を依頼した。',
        occurredAt: isoAgo(5),
        createdAt: isoAgo(5),
      },
      {
        id: 'acti0004-a004-a004-a004-000000000001',
        projectId: p1,
        type: 'note',
        title: '【さくら整体院】修正指示の受け取り・写真素材の確認',
        body: 'トップページのファーストビュー写真について修正指示を受けた。先方提供の写真素材を確認したところ解像度が不足しており、Adobe Stockでの購入を提案した。',
        occurredAt: isoAgo(10),
        createdAt: isoAgo(10),
      },
      {
        id: 'acti0005-a005-a005-a005-000000000001',
        projectId: p3,
        type: 'payment_received',
        title: 'Fleur Design Studio から入金を確認',
        body: '1,199,000円の入金を確認。領収書を発行してメール送付済み。',
        occurredAt: isoAgo(3),
        createdAt: isoAgo(3),
      },
      {
        id: 'acti0006-a006-a006-a006-000000000001',
        projectId: p2,
        type: 'estimate_created',
        title: 'コーポレートサイトリニューアル 見積書を作成',
        occurredAt: isoAgo(20),
        createdAt: isoAgo(20),
      },
      {
        id: 'acti0007-a007-a007-a007-000000000001',
        projectId: p6,
        type: 'contract_signed',
        title: '採用特設サイト制作 契約締結',
        body: '山田建設株式会社との業務委託契約を締結。制作スタート。',
        occurredAt: isoAgo(52),
        createdAt: isoAgo(52),
      },
      {
        id: 'acti0008-a008-a008-a008-000000000001',
        projectId: p6,
        type: 'invoice_sent',
        title: '採用特設サイト制作 中間請求書を送付',
        body: '着手金50%（759,000円）の請求書を送付した。支払期限は20日後。',
        occurredAt: isoAgo(5),
        createdAt: isoAgo(5),
      },
    ]

    // ─── Tasks ───────────────────────────────────────────────────
    const tasks = [
      // 期限超過
      {
        id: 'task0001-t001-t001-t001-000000000001',
        projectId: p1,
        title: '修正デザインの確認依頼',
        description: 'クライアントから修正指示を受けたデザインの最終確認を取る',
        status: 'todo',
        priority: 'high',
        dueDate: daysAgo(5),
        createdAt: isoAgo(12),
        updatedAt: isoAgo(12),
      },
      {
        id: 'task0002-t002-t002-t002-000000000001',
        projectId: p6,
        title: '社員インタビュー原稿の最終確認',
        description: '先方担当者が作成した5名分のインタビュー原稿を確認してフィードバックを返す',
        status: 'todo',
        priority: 'medium',
        dueDate: daysAgo(3),
        createdAt: isoAgo(15),
        updatedAt: isoAgo(15),
      },
      // 今日
      {
        id: 'task0003-t003-t003-t003-000000000001',
        projectId: p2,
        title: 'キックオフMTG資料の最終確認',
        description: 'プロジェクト計画書・スケジュール表を完成させて事前送付する',
        status: 'todo',
        priority: 'high',
        dueDate: today,
        createdAt: isoAgo(5),
        updatedAt: isoAgo(5),
      },
      {
        id: 'task0004-t004-t004-t004-000000000001',
        projectId: p6,
        title: 'デザインカンプv2 クライアント提出',
        status: 'in_progress',
        priority: 'medium',
        dueDate: today,
        createdAt: isoAgo(8),
        updatedAt: isoAgo(1),
      },
      // 今後
      {
        id: 'task0005-t005-t005-t005-000000000001',
        projectId: p2,
        title: 'ワイヤーフレーム作成',
        description: '全ページのワイヤーフレームをFigmaで作成する',
        status: 'todo',
        priority: 'medium',
        dueDate: daysFrom(7),
        createdAt: isoAgo(5),
        updatedAt: isoAgo(5),
      },
      {
        id: 'task0006-t006-t006-t006-000000000001',
        projectId: p4,
        title: 'システム設計書ドラフト提出',
        description: 'ポータルサイトのDB設計・API設計・認証フローをまとめる',
        status: 'todo',
        priority: 'high',
        dueDate: daysFrom(11),
        createdAt: isoAgo(3),
        updatedAt: isoAgo(3),
      },
      {
        id: 'task0007-t007-t007-t007-000000000001',
        projectId: p1,
        title: 'トップページコーディング実装',
        description: 'Figma承認済みデザインをコーディング',
        status: 'in_progress',
        priority: 'medium',
        dueDate: daysFrom(14),
        createdAt: isoAgo(20),
        updatedAt: isoAgo(3),
      },
      // 完了
      {
        id: 'task0008-t008-t008-t008-000000000001',
        projectId: p3,
        title: '最終納品ファイルの整理・GitHubへのプッシュ',
        status: 'done',
        priority: 'medium',
        completedAt: isoAgo(22),
        createdAt: isoAgo(30),
        updatedAt: isoAgo(22),
      },
    ]

    // ─── Project Costs ───────────────────────────────────────────
    const projectCosts = [
      {
        id: 'cost0001-c001-c001-c001-000000000001',
        projectId: p3,
        title: '外注カメラマン費（商品撮影）',
        category: 'outsourcing',
        amount: 80000,
        note: 'Fleurブランド商品の撮影費用。写真300点提供。',
        costDate: daysAgo(80),
        createdAt: isoAgo(80),
        updatedAt: isoAgo(80),
      },
      {
        id: 'cost0002-c002-c002-c002-000000000001',
        projectId: p6,
        title: '社員インタビュー写真撮影 外注費',
        category: 'outsourcing',
        amount: 120000,
        note: '社員5名のポートレート撮影・職場環境撮影込み。',
        costDate: daysAgo(35),
        createdAt: isoAgo(35),
        updatedAt: isoAgo(35),
      },
      {
        id: 'cost0003-c003-c003-c003-000000000001',
        projectId: p6,
        title: 'Figmaプロフェッショナルプラン（月額）',
        category: 'tool',
        amount: 15000,
        note: 'チームプラン月額費用（本案件按分）',
        costDate: daysAgo(55),
        createdAt: isoAgo(55),
        updatedAt: isoAgo(55),
      },
      {
        id: 'cost0004-c004-c004-c004-000000000001',
        projectId: p2,
        title: '外注フロントエンドエンジニア費',
        category: 'outsourcing',
        amount: 500000,
        note: '山田建設コーポレートサイトのフロントエンド実装を外注。',
        costDate: daysAgo(3),
        createdAt: isoAgo(3),
        updatedAt: isoAgo(3),
      },
      {
        id: 'cost0005-c005-c005-c005-000000000001',
        projectId: p1,
        title: 'Adobe Stock 写真素材費',
        category: 'material',
        amount: 25000,
        note: 'さくら整体院サイト用の写真素材購入費（10点）',
        costDate: daysAgo(15),
        createdAt: isoAgo(15),
        updatedAt: isoAgo(15),
      },
    ]

    // ─── Project Files ───────────────────────────────────────────
    const projectFiles = [
      {
        id: 'file0001-f001-f001-f001-000000000001',
        projectId: p3,
        name: 'Figmaデザインファイル（Fleur）',
        category: 'design',
        externalUrl: 'https://www.figma.com/file/fleur-brand-design',
        note: '最終納品デザインデータ。共有リンク有効期限なし。',
        createdAt: isoAgo(30),
        updatedAt: isoAgo(22),
      },
      {
        id: 'file0002-f002-f002-f002-000000000001',
        projectId: p2,
        name: '要件定義書（Google ドキュメント）',
        category: 'document',
        externalUrl: 'https://docs.google.com/document/d/yamada-requirements-spec',
        note: 'キックオフMTGで確認した要件をまとめたドキュメント',
        createdAt: isoAgo(9),
        updatedAt: isoAgo(9),
      },
      {
        id: 'file0003-f003-f003-f003-000000000001',
        projectId: p6,
        name: '社員写真素材フォルダ（Google ドライブ）',
        category: 'image',
        externalUrl: 'https://drive.google.com/drive/folders/yamada-recruit-photos',
        note: '撮影済み写真素材一式。使用許諾済み。',
        createdAt: isoAgo(30),
        updatedAt: isoAgo(30),
      },
      {
        id: 'file0004-f004-f004-f004-000000000001',
        projectId: p1,
        name: 'ワイヤーフレーム（Figma）',
        category: 'design',
        externalUrl: 'https://www.figma.com/file/sakura-seitaiin-wireframe',
        note: 'クライアント確認済み（2回目の修正後）',
        createdAt: isoAgo(20),
        updatedAt: isoAgo(15),
      },
      {
        id: 'file0005-f005-f005-f005-000000000001',
        projectId: p4,
        name: '提案書ドラフト（Google ドキュメント）',
        category: 'document',
        externalUrl: 'https://docs.google.com/document/d/tanaka-portal-proposal',
        note: '次回MTGで提出予定のシステム設計書ドラフト',
        createdAt: isoAgo(2),
        updatedAt: isoAgo(2),
      },
    ]

    // ─── Write to localStorage ────────────────────────────────────
    localStorage.setItem('pos_settings', JSON.stringify(settings))
    localStorage.setItem('pos_projects', JSON.stringify(projects))
    localStorage.setItem('pos_hearings', JSON.stringify(hearings))
    localStorage.setItem('pos_estimates', JSON.stringify(estimates))
    localStorage.setItem('pos_contracts', JSON.stringify(contracts))
    localStorage.setItem('pos_invoices', JSON.stringify(invoices))
    localStorage.setItem('pos_activities', JSON.stringify(activities))
    localStorage.setItem('pos_tasks', JSON.stringify(tasks))
    localStorage.setItem('pos_project_costs', JSON.stringify(projectCosts))
    localStorage.setItem('pos_project_files', JSON.stringify(projectFiles))

    router.push('/projects')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-sm text-gray-500">デモデータを読み込んでいます...</p>
    </div>
  )
}
