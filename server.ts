import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// ES Module compatible workspace routing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable large base64 uploads (e.g. PDFs)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

  // Initialize Gemini SDK with User-Agent header as mandated
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 1. Analyze Core Literary Contents and Generate Discussion & Educational Assets
  app.post("/api/analyze-book", async (req, res) => {
    try {
      const { title, author, pages, textData, pdfData } = req.body;

      if (!title || !pages) {
        return res.status(400).json({ error: "도서 제목과 읽은 쪽수를 꼭 적어주세요." });
      }

      // Reconstruct Gemini Content parts
      const parts: any[] = [];

      if (pdfData) {
        const rawBase64 = pdfData.includes(",") ? pdfData.split(",")[1] : pdfData;
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: rawBase64
          }
        });
      }

      const infoPrompt = `
당신은 대한민국 초등학교 교실에서 고전독서 교사로 활동하고 있는 친절하고 현명한 교육용 AI 코치입니다.
학생들과 고전독서 토의/토론 활동을 진행하고 있습니다.

제공된 도서 자료 또는 기입된 정보를 분석하여 오늘 학생들이 읽은 분량에 맞추어 다음 가이드를 제공해 주세요.

[요청 사항]
1. 오늘 읽은 부분([도서명: ${title}], [저자: ${author || "미상"}], [읽은 쪽수: ${pages}쪽])에 관한 줄거리 및 핵심 사상, 교육적 가치를 한글 약 1000자(공백 포함) 내외로 자세하고 탄탄하게 요약해 주세요. 친근하고 따뜻한 문체로 작성해 주기 바랍니다.
2. 본문에 등장하는 낱말 중 초등학생 수준에서 다소 어렵거나 배움의 가치가 있는 핵심 어휘 또는 사자성어를 2~3개 발췌하여 상세한 낱말 풀이 및 예시 맥락을 작성해 주세요.
3. 책의 가장 인상 깊은 구절을 2개 발췌하고, 해당 구절이 초등학생에게 줄 수 있는 교훈을 가르쳐 주세요.
4. 초등학생 수준에서 '자신의 실제 경험(가족, 친구 관계, 학교생활 등)'을 자연스럽게 끌어낼 수 있는 연쇄식(꼬리에 꼬리를 무는) 토의/토론 주제를 3가지 추천해 주세요.
   - 각 토론 주제는 인물들의 갈등, 가치의 대립, 도덕적 딜레마를 담고 있어 흥미를 자극해야 합니다.
   - 아이들이 일상에서 가질 법한 생각을 융합하고, '첫 발문 -> 꼬리 질문 1 -> 꼬리 질문 2'형태로 사고가 연달아 심화되거나 경험을 자극하도록 유도해야 합니다.
   - 찬성(Positive), 반대(Negative), 중립(Neutral) 등의 찬반 가이드나 주장에 대한 피드백 관점도 제공해 주세요.

기타 텍스트 제보 사항:
${textData || "추가 제공 텍스트 없음"}
      `;

      parts.push({ text: infoPrompt });

      // Build precise response schema to eliminate structural failures
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "오늘 지정 부위 도서 요약(1000자 내외로 풍성하고 교육적인 줄거리와 철학 설명)"
          },
          keyQuotes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                quote: { type: Type.STRING, description: "도서 내 주요 구절" },
                speaker: { type: Type.STRING, description: "구절을 말한 인물이나 서술자" },
                lesson: { type: Type.STRING, description: "구절이 주는 교훈과 의미" }
              },
              required: ["quote", "speaker", "lesson"]
            }
          },
          vocab: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: "초등학생 학습용 핵심 어휘 혹은 한자어" },
                meaning: { type: Type.STRING, description: "누구나 알기 쉬운 뜻풀이" },
                exampleInsideBook: { type: Type.STRING, description: "책 속 혹은 일상에서의 사용 예문이나 맥락" }
              },
              required: ["word", "meaning", "exampleInsideBook"]
            }
          },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "topic_1, topic_2, topic_3 형태의 고유 아이디" },
                title: { type: Type.STRING, description: "가치 대립이 명확하고 아이들의 호기심을 끄는 토의 주제 제목" },
                description: { type: Type.STRING, description: "이 토론 주제가 나오게 된 배경과 개념 설명" },
                linkToExperience: { type: Type.STRING, description: "초등학생 경험 연계 가이드 (예: '여러분도 친구와의 비밀을 지키려고 곤란했던 적이 있나요?')" },
                startingQuestion: { type: Type.STRING, description: "토론의 포문을 여는 첫 질문 (질문 시작하기)" },
                tailQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "연달아 묻는 꼬리 질문 2개 이상 (더 높은 도덕성이나 대안을 촉구하는 깊은 질문)"
                },
                suggestedStances: {
                  type: Type.OBJECT,
                  properties: {
                    positive: { type: Type.STRING, description: "찬성 의견 예시 또는 지지 근거" },
                    negative: { type: Type.STRING, description: "반대 의견 예시 또는 지지 근거" },
                    neutral: { type: Type.STRING, description: "중립 의견 혹은 타협책 근거" }
                  },
                  required: ["positive", "negative", "neutral"]
                }
              },
              required: ["id", "title", "description", "linkToExperience", "startingQuestion", "tailQuestions", "suggestedStances"]
            }
          }
        },
        required: ["summary", "keyQuotes", "vocab", "topics"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: parts,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.7
        }
      });

      if (!response.text) {
        throw new Error("Gemini API가 비어있는 텍스트를 반환했습니다.");
      }

      const result = JSON.parse(response.text.trim());
      res.json(result);

    } catch (error: any) {
      console.error("도서 분석 중 오류 발생:", error);
      res.status(500).json({
        error: "도서 자료를 분석하는 데 실패했습니다.",
        details: error.message || error
      });
    }
  });

  // 2. Class Active Debate Feedback: Realtime Discussion Assistant
  app.post("/api/class-feedback", async (req, res) => {
    try {
      const { topic, opinions } = req.body;

      if (!topic || !opinions || !Array.isArray(opinions)) {
        return res.status(400).json({ error: "주제 정보와 취합된 의견 배열이 필요합니다." });
      }

      if (opinions.length === 0) {
        return res.status(400).json({ error: "취합된 학생 의견이 없습니다." });
      }

      const studentOpinionsText = opinions
        .map((o: any, idx: number) => `[학생 ${o.studentName || idx+1}] (${o.stance}): ${o.opinion}`)
        .join("\n");

      const systemInstruction = `
당신은 학업 분위기를 고취시키는 토론 퍼실리테이터(사회자) 교사입니다.
제시된 토론 주제에 대해 어린이들이 올린 의견 리스트를 분석하고, 다음 작업을 수행하세요:

1. 의견 분석 및 요약 (summaryOfOpinions):
   아이들이 어떤 생각들을 위주로 제시했는지 (찬성/반대의 주요 줄기) 정갈하고 객관적으로 요약해 주세요.
2. 폭풍 칭찬 및 가치 고취 (praise):
   어린이들이 낸 창의적인 시선, 진솔한 경험 공유, 용기 있는 견해 발표에 대해 구체적인 표현을 사용하여 폭풍 칭찬과 긍정적인 지지 한마디를 적어 주십시오. (예: "태영이의 '친구의 마음도 보물이다'라는 시선은 무척 감동적이네요!")
3. 꼬리에 꼬리를 무는 연쇄 자극용 심화 다음 질문 (nextDeeperQuestion):
   토의를 종결하기보다 대립되는 부분을 균형 있게 짚으며, 학생들의 생각을 한 차원 더 넓히는 도전적인 연쇄 질문을 1가지 제시해 주세요.
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          summaryOfOpinions: { type: Type.STRING, description: "의견 취합 및 요약 분석" },
          praise: { type: Type.STRING, description: "아이들의 발언에 대한 세심하고 진정성 어린 격려와 칭찬" },
          nextDeeperQuestion: { type: Type.STRING, description: "대립과 타협을 고도화하는 흥미진진한 다음 꼬리 질문" }
        },
        required: ["summaryOfOpinions", "praise", "nextDeeperQuestion"]
      };

      const prompt = `
[토론 주제]
제목: "${topic.title}"
설명: ${topic.description}

[우리 학급 학생들의 실제 발언 목록]
${studentOpinionsText}

위 자료를 기반으로 교육적 피드백을 완성해 주세요.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.8
        }
      });

      if (!response.text) {
        throw new Error("Gemini API가 비어있는 피드백을 반환했습니다.");
      }

      const result = JSON.parse(response.text.trim());
      res.json(result);

    } catch (error: any) {
      console.error("클래스 토론 의견 분석 오류 발생:", error);
      res.status(500).json({
        error: "토론 피드백을 생성하는 데 실패했습니다.",
        details: error.message || error
      });
    }
  });

  // Serve static client bundle or run Vite Dev Server
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[고전독서 토론 백엔드] http://0.0.0.0:${PORT} 에서 정상 가동 중...`);
  });
}

startServer();
