import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { clientName, projectName, hearings } = await req.json()

    if (!hearings?.length) {
      return NextResponse.json({ error: 'ヒアリング記録がありません' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY が設定されていません。.env.local を確認してください。' }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const hearingText = hearings
      .map(
        (h: { date: string; memo: string }, i: number) =>
          `【第${i + 1}回 ${h.date}】\n${h.memo}`
      )
      .join('\n\n')

    const prompt = `あなたはWeb制作会社の提案書作成を支援するアシスタントです。
以下のヒアリング記録をもとに、クライアントへの提案書骨子を日本語で作成してください。

案件情報:
クライアント: ${clientName}
案件名: ${projectName}

ヒアリング記録:
${hearingText}

以下の構成で提案書骨子を作成してください。
箇条書きで簡潔にまとめること。ヒアリングの内容を具体的に反映すること。

■ 課題認識
（ヒアリングで確認した現状の課題）

■ 提案方針
（課題を解決するための基本的なアプローチ）

■ 提案内容
（具体的な実施内容）

■ スケジュール概算
（フェーズ分けと期間の目安）

■ 概算費用
（ヒアリングで確認した予算を踏まえた費用感）`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
    })

    const content = response.choices[0].message.content ?? ''
    return NextResponse.json({ content })
  } catch (error) {
    console.error('OpenAI error:', error)
    return NextResponse.json(
      { error: '骨子の生成に失敗しました。しばらく経ってから再試行してください。' },
      { status: 500 }
    )
  }
}
