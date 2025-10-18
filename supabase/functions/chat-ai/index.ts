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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log("Calling Lovable AI with", messages.length, "messages");

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
            content: `Bạn là trợ lý AI chuyên nghiệp của Shoppet - nền tảng chăm sóc thú cưng toàn diện tại Việt Nam.

NHIỆM VỤ CHÍNH:
- Tư vấn sức khỏe thú cưng (triệu chứng, bệnh tật, phòng ngừa)
- Tư vấn dinh dưỡng và chế độ ăn
- Hướng dẫn chăm sóc hàng ngày
- Tư vấn huấn luyện và hành vi
- Giải đáp thắc mắc về tiêm chủng
- Tư vấn sản phẩm và dịch vụ phù hợp

HƯỚNG DẪN TƯ VẤN:
1. Luôn hỏi thông tin thú cưng: loài, tuổi, cân nặng, giống trước khi tư vấn chi tiết
2. Đưa ra câu trả lời rõ ràng, dễ hiểu, có cấu trúc
3. Nếu là tình huống khẩn cấp, khuyên đưa thú cưng đến bác sĩ thú y ngay
4. Luôn nhấn mạnh việc tham khảo bác sĩ thú y cho các vấn đề nghiêm trọng
5. Cung cấp giải pháp thực tế, dễ áp dụng
6. Thân thiện, chuyên nghiệp và đầy đủ thông tin

TRƯỜNG HỢP KHẨN CẤP (cần đến bác sĩ ngay):
- Khó thở, thở nhanh bất thường
- Chảy máu không cầm được
- Co giật, ngất xỉu
- Không ăn uống quá 24h
- Tiêu chảy hoặc nôn mửa kéo dài với máu
- Tai nạn, chấn thương nghiêm trọng
- Ngộ độc

Trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ thông tin.` 
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
