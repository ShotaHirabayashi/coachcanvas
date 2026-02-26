import Link from "next/link";
import { FileText, Brain, Mail, ArrowRight, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-600">CoachCanvas</span>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            セッション記録を、
            <br />
            <span className="text-indigo-600">5分で完了。</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            AIがセッションノートを要約し、フォローアップメールを自動生成。
            クライアント管理からセッション記録まで、コーチングビジネスを一気通貫でサポートします。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-indigo-700 transition-colors"
            >
              無料で始める
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            こんな課題はありませんか？
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "セッション記録に30分以上", desc: "毎回のセッション後、ノートの整理や記録の作成に時間がかかっていませんか？" },
              { title: "クライアント管理が混乱", desc: "15名を超えるとNotionやスプレッドシートでの管理が破綻し始めます。" },
              { title: "フォローアップの質が低下", desc: "忙しさからメールの作成が後回しに。クライアント体験の質が下がっていませんか？" },
            ].map((pain, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{pain.title}</h3>
                <p className="text-sm text-gray-600">{pain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            CoachCanvasが解決します
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            セッション記録から、フォローアップメール作成まで。AIの力でコーチングビジネスを効率化。
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "カルテ管理", desc: "クライアントの基本情報、目標、セッション履歴を一元管理。セッション前にここを開けば全体像を把握できます。" },
              { icon: Brain, title: "AIセッション要約", desc: "セッションノートをワンクリックでAIが構造化。話題・気づき・アクションアイテム・次回アジェンダを自動生成します。" },
              { icon: Mail, title: "フォローアップメール自動生成", desc: "セッション内容に基づいたフォローアップメールをAIが自動ドラフト。編集してそのまま送信できます。" },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">料金プラン</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Free",
                price: "0",
                features: ["クライアント3名まで", "AI要約 月5回", "セッション記録", "基本テンプレート3種"],
                cta: "無料で始める",
                highlight: false,
              },
              {
                name: "Pro",
                price: "4,980",
                features: ["クライアント無制限", "AI要約 無制限", "カスタムテンプレート", "CSVエクスポート", "メール送信機能", "優先サポート"],
                cta: "Proプランで始める",
                highlight: true,
              },
              {
                name: "Team",
                price: "14,800",
                features: ["コーチ5名まで", "Pro全機能", "管理者ダッシュボード", "クライアント共有", "チーム分析"],
                cta: "お問い合わせ",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 ${
                  plan.highlight
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-600 scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                <h3 className={`text-lg font-semibold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                    ¥{plan.price}
                  </span>
                  <span className={`ml-1 text-sm ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}>
                    /月
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? "text-indigo-200" : "text-indigo-600"}`} />
                      <span className={plan.highlight ? "text-indigo-100" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`mt-8 block text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            今すぐ始めましょう
          </h2>
          <p className="text-gray-600 mb-8">
            セッション記録の効率化は、今日から始められます。
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-indigo-700 transition-colors"
          >
            無料で始める
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500">CoachCanvas</span>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>利用規約</span>
            <span>プライバシーポリシー</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
