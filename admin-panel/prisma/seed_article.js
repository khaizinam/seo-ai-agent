/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@seo.local' }
  });

  if (!admin) {
    console.error("Admin user not found. Please run seed.js first.");
    process.exit(1);
  }

  const demoArticle = await prisma.article.upsert({
    where: { slug: 'demo-seo-article' },
    update: {},
    create: {
      slug: 'demo-seo-article',
      status: 'PUBLISHED',
      authorId: admin.id,
      titleVi: 'Bài viết Demo quản lý SEO Pipeline',
      metaDescVi: 'Đây là bài viết demo để kiểm tra giao diện quản lý SEO Pipeline.',
      contentVi: '<h1>Demo Nội Dung</h1><p>Nội dung mẫu bằng tiếng Việt để test CKEditor.</p>',
      titleEn: 'Demo Article for SEO Pipeline Management',
      metaDescEn: 'This is a demo article to verify the SEO Pipeline management interface.',
      contentEn: '<h1>Demo Content</h1><p>Sample content in English to test CKEditor visualization.</p>',
      socialContent: 'Check out our new tool! #SEO #Tools',
      imagePrompt: 'A futuristic robot organizing documents in a glowing neon library, digital art style.',
    },
  });

  console.log('Demo article created:', demoArticle.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
