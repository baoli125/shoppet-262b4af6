import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, isNewUser } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Calling Lovable AI with", messages.length, "messages");

    const systemPrompt = isNewUser 
      ? `Bạn là "Tay Nhỏ" - trợ lý ảo thân thiện của Shoppet. Nhiệm vụ của bạn là hướng dẫn người dùng mới khám phá website một cách chi tiết và thân thiện.

Shoppet có các tính năng chính:
1. **AI Chat** (/ai-chat): Trợ lý AI tư vấn sức khỏe, dinh dưỡng thú cưng 24/7
2. **Hồ sơ thú cưng** (/pets): Quản lý thông tin thú cưng (tên, giống, tuổi, cân nặng, hồ sơ tiêm chủng)
3. **Marketplace** (/marketplace): Mua sắm sản phẩm cho thú cưng (thức ăn, đồ chơi, phụ kiện, dịch vụ)
4. **Giỏ hàng** (/cart): Xem và thanh toán đơn hàng
5. **Đơn hàng** (/orders): Theo dõi lịch sử mua hàng và trạng thái đơn

CÁCH TRẢ LỜI:
- NGẮN GỌN, TỐI ĐA 2-3 CÂU (khoảng 50-80 từ)
- Đi thẳng vào vấn đề, không dài dòng
- Giải thích cụ thể, rõ ràng
- Sử dụng emoji nhẹ nhàng 🐾

SAU KHI TRẢ LỜI: Thêm dấu phân cách "---FOLLOW_UP---" và liệt kê 3-4 câu hỏi gợi ý liên quan để người dùng hỏi tiếp (mỗi câu một dòng, không đánh số).

Ví dụ:
Để thêm thú cưng, vào menu 'Thú cưng của tôi' → bấm 'Thêm thú cưng'. Điền tên, giống, ngày sinh là xong! 🐶

---FOLLOW_UP---
Làm sao để cập nhật thông tin thú cưng?
Marketplace có những sản phẩm gì?
Làm sao để đặt hàng?`
      : `Bạn là "Tay Nhỏ" - trợ lý AI chuyên nghiệp của Shoppet.

NHIỆM VỤ: Tư vấn sức khỏe, dinh dưỡng và chăm sóc thú cưng.

CÁCH TRẢ LỜI:
- NGẮN GỌN, TỐI ĐA 3-4 CÂU (khoảng 60-100 từ)
- Đi thẳng vào câu trả lời, không dài dòng
- Hỏi thông tin cần thiết: loài, tuổi, cân nặng (nếu chưa có)
- Nếu khẩn cấp (khó thở, chảy máu, co giật, không ăn >24h): BẮT BUỘC khuyên đến bác sĩ thú y NGAY

SAU KHI TRẢ LỜI: Thêm dấu phân cách "---FOLLOW_UP---" và liệt kê 3-4 câu hỏi gợi ý liên quan để người dùng hỏi tiếp (mỗi câu một dòng, không đánh số).

Ví dụ:
Chó bị tiêu chảy có thể do ăn nhầm hoặc nhiễm khuẩn. Nhịn ăn 12h, cho uống nước nhiều. Nếu tiêu chảy >24h hoặc có máu, đến bác sĩ ngay! Chó bạn bao nhiêu tháng tuổi?

---FOLLOW_UP---
Kèm theo tiêu chảy có nôn ói không?
Thú cưng có bỏ ăn không?
Có dấu hiệu sốt không?
Đã cho thuốc gì chưa?

Trả lời bằng tiếng Việt, súc tích và chuyên nghiệp.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: systemPrompt
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Dịch vụ AI tạm thời không khả dụng." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    console.log("Streaming AI response");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
