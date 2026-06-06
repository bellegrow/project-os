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

export default function SeedPage() {
  const router = useRouter()

  useEffect(() => {
    const p1 = 'a1b2c3d4-0001-0001-0001-000000000001'
    const p2 = 'a1b2c3d4-0002-0002-0002-000000000002'
    const p3 = 'a1b2c3d4-0003-0003-0003-000000000003'

    const h1a = 'b1b2c3d4-1001-1001-1001-000000000101'
    const h1b = 'b1b2c3d4-1002-1002-1002-000000000102'
    const h2a = 'b1b2c3d4-2001-2001-2001-000000000201'
    const h3a = 'b1b2c3d4-3001-3001-3001-000000000301'
    const h3b = 'b1b2c3d4-3002-3002-3002-000000000302'
    const h3c = 'b1b2c3d4-3003-3003-3003-000000000303'

    const d3a = 'c1b2c3d4-4001-4001-4001-000000000401'
    const d3b = 'c1b2c3d4-4002-4002-4002-000000000402'
    const d1a = 'c1b2c3d4-4003-4003-4003-000000000403'

    const projects = [
      {
        id: p1,
        clientName: '株式会社山田建設',
        name: 'コーポレートサイトリニューアル',
        status: '提案済',
        budget: 3000000,
        createdAt: isoAgo(22),
        updatedAt: isoAgo(15),
      },
      {
        id: p2,
        clientName: 'Beauty Salon Luce',
        name: '新規集客LP制作',
        status: '商談中',
        budget: 800000,
        createdAt: isoAgo(12),
        updatedAt: isoAgo(10),
      },
      {
        id: p3,
        clientName: '株式会社グリーンテック',
        name: '採用特設サイト制作',
        status: '受注',
        budget: 1500000,
        createdAt: isoAgo(32),
        updatedAt: isoAgo(5),
      },
    ]

    const hearings = [
      {
        id: h1a,
        projectId: p1,
        date: daysAgo(20),
        createdAt: isoAgo(20),
        memo: `目的：
コーポレートサイトのリニューアルについて相談したい

現状の課題：
現行サイトが10年前に制作されたもので、スマートフォン未対応
採用ページへのアクセスが少なく、応募が集まらない
施工実績の訴求力が弱い

要望：
施工事例を写真・動画で見やすく見せたい
採用ページを強化したい
管理しやすいCMS対応希望

予算感：
300万円以内で検討中

スケジュール：
来年3月の創業50周年に合わせてリリースしたい`,
      },
      {
        id: h1b,
        projectId: p1,
        date: daysAgo(15),
        createdAt: isoAgo(15),
        memo: `競合調査の共有：
同業他社のサイトをいくつか見せてもらった
A社：施工事例が写真中心でわかりやすい
B社：採用ページが充実していて応募数が多い

追加要件：
施工前後の比較スライダーを入れたい
社員インタビュー動画を掲載予定
地図・アクセス情報の改善も希望

デザインイメージ：
信頼感・重厚感を大切にしたい
色は紺・グレー系希望`,
      },
      {
        id: h2a,
        projectId: p2,
        date: daysAgo(10),
        createdAt: isoAgo(10),
        memo: `目的：
新規集客のためのLPを制作したい

現状：
Instagram経由の集客がメイン
Webサイトはあるがモバイル対応が古い
予約はInstagram DMで対応しており手間がかかっている

ターゲット：
20〜40代女性、近隣在住

訴求ポイント：
産後ケアメニューが他サロンにない強み
代表の国家資格保有
完全個室で安心感

予算感：
80万円前後

スケジュール：
2ヶ月以内にリリース希望
夏のキャンペーンに合わせて使いたい`,
      },
      {
        id: h3a,
        projectId: p3,
        date: daysAgo(30),
        createdAt: isoAgo(30),
        memo: `目的：
採用強化のための特設サイトを制作したい

現状の課題：
採用サイトがなく、求人票だけで訴求している
応募者に会社の雰囲気が伝わらない
エンジニア職の採用が特に難しい

ターゲット：
第二新卒〜30代のエンジニア・デザイナー

予算：
150万円

スケジュール：
3ヶ月以内にリリース希望`,
      },
      {
        id: h3b,
        projectId: p3,
        date: daysAgo(20),
        createdAt: isoAgo(20),
        memo: `コンテンツ方針の確認：

社員インタビュー：
5名を予定（エンジニア2名、デザイナー1名、ディレクター1名、営業1名）

職場環境の見せ方：
リモートワーク可能な点を強調
フレックスタイム制
技術勉強会の取り組みを紹介

提供コンテンツ：
写真素材はプロカメラマンに依頼予定
インタビュー原稿は先方担当者が草案を書く`,
      },
      {
        id: h3c,
        projectId: p3,
        date: daysAgo(5),
        createdAt: isoAgo(5),
        memo: `受注後キックオフミーティング：

サイトマップ確認：
トップ / 会社紹介 / 事業内容 / 採用情報（職種別）
社員インタビュー / よくある質問 / エントリーフォーム

技術要件：
CMS：microCMSで管理
エントリーフォーム：Googleフォームで代替
GA4設置必須

体制確認：
当社：PMとフロントエンド担当
先方：人事2名が窓口
週次定例：毎週月曜13時`,
      },
    ]

    const drafts = [
      {
        id: d3a,
        projectId: p3,
        createdAt: isoAgo(20),
        content: `■ 課題認識
・採用サイトがなく求人票のみでは会社の魅力が伝わらない
・エンジニア・デザイナー採用の競争が激しく差別化が必要
・リモートワーク可・フレックス制など強みが外部に伝わっていない

■ 提案方針
「技術者が働きたい会社」であることを社員の言葉で伝える採用サイトを構築。第二新卒〜30代エンジニアに響くコンテンツ設計を重視する。

■ 提案内容
・5名の社員インタビューを中核に据えた採用特設サイト（7ページ）
・職種別採用情報ページでターゲットに合わせた訴求
・勉強会・技術文化のコンテンツで技術者へのアピールを強化
・microCMS導入で人事担当者が自走できる更新体制を構築
・GA4によるエントリー導線の計測設計

■ スケジュール概算
・フェーズ1（要件定義・情報設計・デザイン）：4週間
・フェーズ2（コーディング・CMS・フォーム構築）：4週間
・フェーズ3（コンテンツ入稿・修正・納品）：3週間
・合計：約11週間（3ヶ月以内）

■ 概算費用
基本構成（7ページ・microCMS・GA4込み）：150万円（税別）
社員インタビュー撮影同行オプション：+15万円`,
      },
      {
        id: d3b,
        projectId: p3,
        createdAt: isoAgo(15),
        content: `■ 課題認識
・採用サイト不在により求人票のみでの訴求が限界に達している
・エンジニア・デザイナー採用において他社との差別化ポイントが不明確
・技術文化・リモートワーク等の強みが採用活動に活かせていない

■ 提案方針
社員の「生の声」と職場環境のリアルを前面に出したストーリー型採用サイトを構築。技術者コミュニティへの認知獲得も視野に入れたコンテンツ設計とする。

■ 提案内容
・社員インタビュー5名（エンジニア2名・デザイナー1名・ディレクター1名・営業1名）
・職種別採用ページ：求める人物像・仕事内容・キャリアパスを明示
・「技術文化」ページ：勉強会・技術スタック・開発環境を紹介
・microCMS：人事担当者が独自に更新可能な体制
・Googleフォーム連携エントリー・GA4計測設計

■ スケジュール概算
・フェーズ1（要件定義・情報設計・デザイン）：4週間
・フェーズ2（コーディング・CMS・フォーム実装）：4週間
・フェーズ3（コンテンツ入稿・テスト・納品）：3週間
・合計：11週間（3ヶ月以内に納品可能）

■ 概算費用
基本構成（7ページ・microCMS・GA4込み）：150万円（税別）
撮影同行オプション：+15万円`,
      },
      {
        id: d1a,
        projectId: p1,
        createdAt: isoAgo(15),
        content: `■ 課題認識
・現行サイトがスマートフォン非対応で機会損失が発生している
・採用ページの訴求力が弱く、応募数が伸び悩んでいる
・施工実績が写真中心でなく、強みが伝わっていない

■ 提案方針
「信頼と実績」を前面に出した重厚感のあるデザインで、施工事例を軸に採用・集客の双方に機能するコーポレートサイトを構築する。

■ 提案内容
・施工前後の比較スライダーを活用した事例ページ
・採用特化ページ：社員インタビュー・動画掲載対応
・CMSによる施工事例・お知らせの自社更新体制
・レスポンシブデザイン（スマートフォン完全対応）
・地図・アクセス情報の改善

■ スケジュール概算
・フェーズ1（要件定義・デザイン）：6週間
・フェーズ2（コーディング・CMS構築）：6週間
・フェーズ3（コンテンツ制作・修正・納品）：4週間
・合計：約16週間（創業50周年の3月に間に合う）

■ 概算費用
デザイン・コーディング・CMS・施工事例ページ込みで280〜300万円（税別）`,
      },
    ]

    localStorage.setItem('pos_projects', JSON.stringify(projects))
    localStorage.setItem('pos_hearings', JSON.stringify(hearings))
    localStorage.setItem('pos_drafts', JSON.stringify(drafts))

    router.push('/projects')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-sm text-gray-500">デモデータを読み込んでいます...</p>
    </div>
  )
}
