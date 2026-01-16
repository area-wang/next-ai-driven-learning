import Link from "next/link"
import { BookOpen, Brain, Code, Sparkles, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Brain,
    title: "AI智能生成",
    description: "根据您的学习目标，AI自动生成个性化学习计划、大纲和知识内容",
  },
  {
    icon: BookOpen,
    title: "费曼学习法",
    description: "通过讲解知识点来巩固理解，AI分析您的讲解并提供改进建议",
  },
  {
    icon: Code,
    title: "交互式编程",
    description: "内置代码编辑器、虚拟终端和浏览器沙盒，边学边练",
  },
  {
    icon: Sparkles,
    title: "智能测试",
    description: "AI自动生成测试题，即时评估答案，追踪学习进度",
  },
]

const benefits = [
  "个性化学习路径",
  "AI驱动的内容生成",
  "多种学习方法支持",
  "实时进度追踪",
  "离线学习支持",
  "跨设备同步",
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <Brain className="w-8 h-8 text-[var(--color-primary)]" />
              <span className="text-xl font-bold text-[var(--color-text)]">AI学习平台</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">登录</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="cta">免费开始</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero区域 */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-light)] via-white to-[var(--color-secondary)]/20" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[var(--color-secondary)]/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI驱动的个性化学习体验
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--color-text)] mb-6 leading-tight">
            让AI成为您的
            <br />
            <span className="text-[var(--color-primary)]">私人学习导师</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8">
            利用AI生成学习计划、知识内容和测试题，结合费曼学习法等多种学习方法，
            帮助您高效掌握任何知识
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button variant="cta" size="xl" className="group">
                免费开始学习
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                了解更多
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 功能特点 */}
      <section id="features" className="py-20 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              强大的学习功能
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              我们提供全方位的学习工具，帮助您更高效地学习和掌握知识
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} variant="glass" hover="lift" className="p-6">
                <CardContent className="p-0">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 优势列表 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-6">
                为什么选择我们？
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-8">
                我们的平台结合了最先进的AI技术和经过验证的学习方法，
                为您提供最佳的学习体验
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                    <span className="text-[var(--color-text)]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card variant="glass" className="p-8">
                <div className="space-y-4">
                  <div className="h-4 bg-[var(--color-secondary)]/30 rounded-full w-3/4" />
                  <div className="h-4 bg-[var(--color-secondary)]/30 rounded-full w-full" />
                  <div className="h-4 bg-[var(--color-secondary)]/30 rounded-full w-5/6" />
                  <div className="h-32 bg-[var(--color-primary)]/10 rounded-xl mt-6" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-[var(--color-primary)] rounded-lg w-24" />
                    <div className="h-8 bg-[var(--color-secondary)]/30 rounded-lg w-24" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="py-20 px-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            准备好开始您的学习之旅了吗？
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            立即注册，免费体验AI驱动的个性化学习
          </p>
          <Link href="/auth/register">
            <Button
              size="xl"
              className="bg-white text-[var(--color-primary)] hover:bg-white/90 shadow-xl"
            >
              免费开始
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-12 px-4 bg-[var(--color-bg-dark)] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6" />
              <span className="font-semibold">AI学习平台</span>
            </div>
            <p className="text-white/60 text-sm">
              © 2024 AI学习平台. 保留所有权利.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
