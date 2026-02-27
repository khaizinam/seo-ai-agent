"use server";

import prisma from "@/lib/prisma";
import { callAi } from "@/lib/ai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCampaign(formData: FormData) {
  const name = formData.get("name") as string;
  const mainKeyword = formData.get("mainKeyword") as string;

  // Gọi lần 1: Lấy chiến lược cốt lõi
  const systemPrompt1 = `Bạn là chuyên gia SEO. Phân tích chiến dịch SEO cho từ khóa. Trả về định dạng JSON:
{
  "strategy": "Phân tích chiến lược ngắn gọn",
  "targets": ["đối tượng 1", "đối tượng 2"],
  "industry": "Ngành nghề",
  "gender": "Giới tính",
  "subKeywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4", "từ khóa 5"],
  "metrics": { "traffic": "tháng", "conversion": "%" }
}`;
  const prompt1 = `Từ khóa: ${mainKeyword} - Chiến dịch: ${name}`;

  try {
    const analysisResult = await callAi(prompt1, systemPrompt1);

    // Gọi lần 2: Lấy Image Prompts tránh token limit
    const systemPrompt2 = `Dựa vào từ khóa đang SEO, hãy viết 3 prompt bằng Tiếng Anh để tạo ảnh minh họa. Trả về JSON:
{
  "imagePrompts": ["prompt 1", "prompt 2", "prompt 3"]
}`;
    let promptsResult: any = { imagePrompts: [] };
    try {
      promptsResult = await callAi(`Từ khóa: ${mainKeyword}`, systemPrompt2);
    } catch (e) {
      console.warn("Lỗi khi sinh image prompts (bỏ qua):", e);
    }

    const finalData = {
      ...analysisResult,
      imagePrompts: promptsResult.imagePrompts || []
    };

    const campaign = await prisma.campaign.create({
      data: {
        name,
        mainKeyword,
        data: finalData,
        status: "PLANNING",
      },
    });

    revalidatePath("/admin/campaigns");
    return { success: true, id: campaign.id };
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCampaign(id: string) {
  await prisma.campaign.delete({
    where: { id },
  });
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function generateCampaignPosts(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { success: false, error: "Không tìm thấy chiến dịch" };

  try {
    const data = campaign.data as any;
    
    // Yêu cầu AI chỉ trả titleVi, week, intent để giảm tải token limit.
    // titleEn sẽ được sinh khi user ấn "Viết bài".
    const systemPrompt = `Bạn là chuyên gia Content SEO. Hãy lập kế hoạch bài viết chuẩn SEO.
Yêu cầu Output JSON Array (Mảng JSON):
[
  { 
    "titleVi": "Tiêu đề hấp dẫn (SEO)", 
    "intent": "Info / Nav / Trans",
    "week": 1
  }
]
Giới hạn trong 12 bài viết. Trả lời ngay mảng JSON hợp lệ, không markdown.`;

    const prompt = `Từ khóa: ${campaign.mainKeyword}\nTừ khóa phụ: ${data?.subKeywords?.slice(0, 5).join(', ')}`;

    const result = await callAi(prompt, systemPrompt);
    
    // Ensure result is array
    const posts = Array.isArray(result) ? result : result?.posts || result?.data || [];
    
    if (posts.length === 0) {
      return { success: false, error: "AI không trả về danh sách bài viết hợp lệ (token trống hoặc JSON lỗi)." };
    }

    await prisma.$transaction(
      posts.map((p: any) => prisma.campaignPost.create({
        data: {
          campaignId,
          titleVi: p.titleVi || "Chưa có tiêu đề",
          titleEn: null, // Sẽ dịch sau
          intent: p.intent || "Info",
          week: parseInt(p.week) || 1,
        }
      }))
    );

    revalidatePath(`/admin/campaigns/${campaignId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Lỗi khi tạo danh sách:", err);
    return { success: false, error: err.message };
  }
}

export async function generateArticleForPost(postId: string) {
  const post = await prisma.campaignPost.findUnique({
    where: { id: postId },
    include: { campaign: true }
  });

  if (!post || !post.campaign) {
    return { success: false, error: "Không tìm thấy chiến dịch hoặc bài viết" };
  }

  try {
    const data = post.campaign.data as any;
    
    // Get all previous posts in this campaign to provide context
    const allPosts = await prisma.campaignPost.findMany({
      where: { campaignId: post.campaignId },
      orderBy: [{ week: 'asc' }, { createdAt: 'asc' }]
    });

    const contextStr = `
Chiến lược tổng quan: ${data?.strategy}
Đối tượng: ${data?.targets?.join(', ')}
Từ khóa chính của cụm: ${post.campaign.mainKeyword}
Từ khóa phụ: ${data?.subKeywords?.join(', ')}
Tiêu đề bài viết này: "${post.titleVi}" (Intent: ${post.intent})
    `;

    // STEP 1: Generate Metadata (Title En, Meta Vi/En, Image Prompt, Social)
    const prompt1 = `Dựa vào ngữ cảnh chiến dịch sau:
${contextStr}
Hãy sinh ra các thông tin Metadata cho bài viết này. Trả về đúng 1 Object JSON:
{
  "titleEn": "Tiêu đề tiếng Anh",
  "metaDescVi": "Meta desc tiếng Việt (150-160 ký tự, có từ khóa)",
  "metaDescEn": "Meta desc tiếng Anh (150-160 ký tự)",
  "imagePrompt": "Prompt tiếng Anh cho AI tạo ảnh cartoonish/illustration cho bài này. Cực kỳ chi tiết về nhân vật, màu sắc, bố cục.",
  "socialContent": "1 đoạn content ngắn post Facebook giới thiệu bài này (song ngữ Vi-En kèm hashtag)"
}
Không trả về code block, chỉ nội dung JSON hợp lệ.`;

    const metaResult = await callAi(prompt1, "Bạn là một SEO Metadata Expert.");
    let metaContent = metaResult;
    if (typeof metaResult === "string") {
      try {
        metaContent = JSON.parse(metaResult.replace(/```json/g, "").replace(/```/g, ""));
      } catch (e) {
        // fallback
        metaContent = {
           titleEn: post.titleVi + " in English",
           metaDescVi: "Bài viết chi tiết về " + post.titleVi,
           metaDescEn: "Detailed article about " + post.titleVi,
           imagePrompt: "Cartoon illustration for " + post.titleVi,
           socialContent: "Khám phá bài viết mới nhất về: " + post.titleVi,
        };
      }
    }

    // STEP 2: Generate Content Vietnamese
    const prompt2 = `Hãy viết một bài viết chuẩn SEO bằng TIẾNG VIỆT cho tiêu đề: "${post.titleVi}".
Ngữ cảnh chiến lược: ${data?.strategy}
Từ khóa chính: ${post.campaign.mainKeyword}

QUY TẮC CỨNG (BẮT BUỘC TUÂN THỦ 100% TRẢ VỀ HTML RAW):
1. Bọc toàn bộ trong thẻ <article>. Trả về mảng HTML trực tiếp, không bọc trong markdown \`\`\`html.
2. Không dùng H1, H2. Chỉ dùng H3 cho mục chính, H4 cho mục con.
3. Luôn có đoạn mở đầu, và Mục lục (Table of Contents) ngay sau đó dùng <h4>Mục Lục</h4>. Các mục dùng anchor link #phan-1, #phan-2.
4. Mỗi heading H3 phải có id tương ứng (vd <h3 id="phan-1"><strong>Tên</strong></h3>).
5. Luôn bọc chữ trong <strong> ở các thẻ heading.
6. Ít nhất 1 thẻ <figure class="image"><img style="aspect-ratio:600/400;" src="https://placehold.co/600x400/1e293b/fff?text=Image" alt="alt text" loading="lazy" /><figcaption>Mô tả caption</figcaption></figure>
7. Phải có phần "FAQ: Giải đáp thắc mắc" dùng H3, câu hỏi dùng H5, câu trả lời dùng <p>.
8. Mật độ từ khóa chuẩn, văn phong chuyên nghiệp nhưng dễ hiểu.

Chỉ xuất ra nội dung HTML. Bắt đầu ngay bằng thẻ <article>.`;

    let contentViResult = await callAi(prompt2, "Bạn là SEO Content Writer siêu đẳng. Chỉ sinh ra mã HTML thuần.", false);
    if (typeof contentViResult !== "string") {
      contentViResult = JSON.stringify(contentViResult); // fallback logic in case AI returns JSON mistakenly
    }
    // Clean up potential markdown formatting
    let htmlVi = contentViResult.replace(/```html/g, "").replace(/```/g, "").trim();
    if (!htmlVi.startsWith("<article>")) htmlVi = "<article>\n" + htmlVi;
    if (!htmlVi.endsWith("</article>")) htmlVi = htmlVi + "\n</article>";

    // STEP 3: Generate Content English
    const prompt3 = `Based on the exact HTML structure you would use for an SEO article, write the ENGLISH EQUIVALENT article for the translated title: "${metaContent.titleEn || post.titleVi}".
Use the exact same HTML formatting rules (<article>, H3 with ids, Table of Contents, FAQ with H5, <figure> images). 
Make the tone professional natively English.

Only output raw HTML starting with <article>. No markdown backticks.`;

    let contentEnResult = await callAi(prompt3, "You are a native English SEO Content Writer. Output strict HTML only.", false);
    if (typeof contentEnResult !== "string") {
      contentEnResult = JSON.stringify(contentEnResult);
    }
    let htmlEn = contentEnResult.replace(/```html/g, "").replace(/```/g, "").trim();
    if (!htmlEn.startsWith("<article>")) htmlEn = "<article>\n" + htmlEn;
    if (!htmlEn.endsWith("</article>")) htmlEn = htmlEn + "\n</article>";

    // STEP 4: Save to Database
    const author = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!author) throw new Error("Chưa có user ADMIN nào trong hệ thống");

    function generateSlug(str: string) {
       return str
         .normalize('NFD') // Chuẩn hóa Unicode phân tổ hợp (tách dấu)
         .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu
         .replace(/đ/g, 'd')
         .replace(/Đ/g, 'd')
         .toLowerCase()
         .replace(/[^a-z0-9]+/g, '-') // Đổi các ký tự không gian/từ thành gạch nối
         .replace(/(^-|-$)+/g, ''); // Cắt gạch nối thừa ở 2 đầu
    }
    
    const baseSlug = generateSlug(post.titleVi || "bai-viet");
    const existingArticle = await prisma.article.findUnique({ where: { slug: baseSlug } });
    const finalSlug = existingArticle ? `${baseSlug}-${Date.now()}` : baseSlug;

    const article = await prisma.article.create({
      data: {
        slug: finalSlug,
        status: "DRAFT",
        authorId: author.id,
        campaignId: post.campaignId,
        titleVi: post.titleVi,
        metaDescVi: metaContent.metaDescVi || "...",
        contentVi: htmlVi,
        titleEn: metaContent.titleEn || "...",
        metaDescEn: metaContent.metaDescEn || "...",
        contentEn: htmlEn,
        socialContent: metaContent.socialContent || "",
        imagePrompt: metaContent.imagePrompt || "",
      } // Attach CampaignPost id later in update
    });

    await prisma.campaignPost.update({
      where: { id: post.id },
      data: {
        isCreated: true,
        articleId: article.id,
        titleEn: metaContent.titleEn || post.titleEn,
      }
    });

    revalidatePath(`/admin/campaigns/${post.campaignId}`);
    return { success: true, articleId: article.id };

  } catch (err: any) {
    console.error("Lỗi khi viết bài:", err);
    return { success: false, error: err.message };
  }
}

export async function updateCampaignFeedback(campaignId: string, feedback: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { success: false, error: "Không tìm thấy chiến dịch" };

  try {
    const currentData = campaign.data;
    const systemPrompt = `Bạn là chuyên gia SEO. Người dùng yêu cầu chỉnh sửa lại dữ liệu chiến dịch SEO hiện tại dựa trên nhận xét của họ.
Dữ liệu hiện tại của dự án:
${JSON.stringify(currentData)}

Nhận xét/Yêu cầu của người dùng:
"${feedback}"

Hãy cập nhật lại toàn bộ object JSON sao cho phù hợp với yêu cầu.
Chỉ trả về JSON, không thêm văn bản giải thích. Cấu trúc gồm: strategy, targets, industry, gender, subKeywords, metrics, imagePrompts.`;

    const result = await callAi(feedback, systemPrompt);
    let updatedData = result;
    if (typeof result === "string") {
      try {
        updatedData = JSON.parse(result.replace(/```json/g, "").replace(/```/g, ""));
      } catch (e) {
        throw new Error("AI trả về JSON không hợp lệ khi cập nhật");
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { data: updatedData }
    });

    revalidatePath(`/admin/campaigns/${campaignId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi cập nhật feedback:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCampaignPostsListFeedback(campaignId: string, feedback: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { posts: true }
  });
  if (!campaign) return { success: false, error: "Không tìm thấy chiến dịch" };

  try {
    const currentPosts = campaign.posts.map(p => ({
      id: p.id,
      titleVi: p.titleVi,
      intent: p.intent,
      week: p.week,
      isCreated: p.isCreated
    }));

    const systemPrompt = `Bạn là chuyên gia Content SEO. Người dùng muốn chỉnh sửa danh sách bài viết hiện tại.
Từ khóa chính: ${campaign.mainKeyword}

Danh sách bài viết HIỆN TẠI:
${JSON.stringify(currentPosts)}

Yêu cầu người dùng: "${feedback}"

HƯỚNG DẪN CẬP NHẬT:
1. Bạn trả về MỘT MẢNG JSON chứa TOÀN BỘ danh sách bài viết sau khi điều chỉnh.
2. NHỮNG BÀI CÓ "isCreated": true TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA HOẶC SỬA. (Vẫn phải giữ nguyên chúng trong mảng trả về).
3. ĐỂ SỬA bài (chưa created), bạn sửa giá trị titleVi, intent, week NHƯNG PHẢI GIỮ NGUYÊN "id".
4. ĐỂ TẠO bài mới, bạn truyền "id": null.
5. ĐỂ XÓA bài (chưa created), bạn loại bỏ cấu trúc của nó khỏi mảng trả về.
6. Cấu trúc mỗi object: {"id": "...", "titleVi": "...", "intent": "...", "week": 1, "isCreated": false}
7. CHỈ trả về đúng định dạng JSON Array. Không có chữ nào bên ngoài.`;

    const result = await callAi(feedback, systemPrompt);
    let updatedPosts: any[] = [];
    if (typeof result === "string") {
      try {
        updatedPosts = JSON.parse(result.replace(/```json/g, "").replace(/```/g, ""));
      } catch (e) {
        throw new Error("AI trả về danh sách JSON không hợp lệ");
      }
    } else if (Array.isArray(result)) {
      updatedPosts = result;
    } else {
       // case object wrapped -> fallback
       updatedPosts = result.posts || result.data || [];
    }

    if (!Array.isArray(updatedPosts)) throw new Error("Kết quả từ AI không phải là mảng");

    // Lọc lại dữ liệu để Update DB
    const incomingIds = updatedPosts.filter(p => p.id).map(p => p.id);
    
    // Tìm các bài cần xóa (Bấm id không tồn tại trong incomingIds & isCreated === false)
    const postsToDelete = campaign.posts.filter(p => !p.isCreated && !incomingIds.includes(p.id));
    
    await prisma.$transaction(async (tx) => {
       // Xóa các records không có trong updated list
       for (const p of postsToDelete) {
          await tx.campaignPost.delete({ where: { id: p.id } });
       }
       
       // Update hoặc Create
       for (const p of updatedPosts) {
          if (!p.titleVi) continue; // skip empty
          
          if (p.id) {
             const existing = campaign.posts.find(ep => ep.id === p.id);
             // Chỉ cập nhật nếu bài chưa viết
             if (existing && !existing.isCreated) {
                await tx.campaignPost.update({
                   where: { id: p.id },
                   data: {
                      titleVi: p.titleVi,
                      intent: p.intent || "Info",
                      week: parseInt(p.week) || 1,
                   }
                });
             }
          } else {
             // Create new
             await tx.campaignPost.create({
                data: {
                   campaignId: campaign.id,
                   titleVi: p.titleVi,
                   titleEn: null,
                   intent: p.intent || "Info",
                   week: parseInt(p.week) || 1,
                }
             });
          }
       }
    });

    revalidatePath(`/admin/campaigns/${campaignId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi cập nhật Posts Feedback:", error);
    return { success: false, error: error.message };
  }
}

export async function createCampaignPost(campaignId: string, data: { titleVi: string, intent: string, week: number }) {
  try {
    await prisma.campaignPost.create({
      data: {
        campaignId,
        titleVi: data.titleVi,
        titleEn: null,
        intent: data.intent || "Info",
        week: data.week || 1,
      }
    });
    revalidatePath(`/admin/campaigns/${campaignId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCampaignPost(id: string, data: { titleVi: string, intent: string, week: number }) {
  try {
    const post = await prisma.campaignPost.findUnique({ where: { id } });
    if (!post) return { success: false, error: "Không tìm thấy bài viết" };
    if (post.isCreated) return { success: false, error: "Không được sửa bài đã tạo nội dung" };

    await prisma.campaignPost.update({
      where: { id },
      data: {
        titleVi: data.titleVi,
        intent: data.intent || "Info",
        week: data.week || 1,
      }
    });
    revalidatePath(`/admin/campaigns/${post.campaignId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCampaignPost(id: string) {
  try {
    const post = await prisma.campaignPost.findUnique({ where: { id } });
    if (!post) return { success: false, error: "Không tìm thấy bài viết" };
    if (post.isCreated) return { success: false, error: "Không được xoá bài đã tạo nội dung" };

    await prisma.campaignPost.delete({ where: { id } });
    revalidatePath(`/admin/campaigns/${post.campaignId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

