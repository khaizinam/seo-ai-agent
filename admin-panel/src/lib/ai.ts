import prisma from "./prisma";

export async function getActiveAiAgent() {
  const agent = await prisma.aiAgent.findFirst({
    where: { status: 1 },
  });
  return agent;
}

export async function callAi(prompt: string, systemPrompt?: string, isJson: boolean = true) {
  const agent = await getActiveAiAgent();
  if (!agent) {
    throw new Error("Không có AI Agent nào đang hoạt động. Vui lòng cấu hình trong mục Cấu hình AI.");
  }

  if (agent.provider === "GEMINI") {
    const generationConfig: any = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
    
    if (isJson) {
      generationConfig.responseMimeType = "application/json";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${agent.model}:generateContent?key=${agent.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          generationConfig,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Lỗi khi gọi Gemini API");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!isJson) return text;
    
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  } else if (agent.provider === "CLAUDE") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": agent.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: agent.model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Lỗi khi gọi Claude API");
    }

    const text = data.content[0].text;
    
    if (!isJson) return text;
    
    // Claude usually returns text, we might need to extract JSON if it wraps it in markdown
    try {
      return JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return text;
    }
  }

  throw new Error("Provider không được hỗ trợ");
}
