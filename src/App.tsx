/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, Upload, Plus, Trash2, Volume2, ArrowRight, Sparkles, 
  BookMarked, Users, MessageSquare, HelpCircle, CheckCircle2, 
  Languages, Award, ChevronRight, Quote, Smile, Compass, AlertCircle, FileText, Check, Play, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PRESET_BOOKS, PresetBook } from "./presets";
import { AnalysisResponse, DiscussionRecord, TopicFeedback, VocabularyWord, KeyQuote, DiscussionTopic } from "./types";

export default function App() {
  // Navigation & Config Choice State
  const [activeTab, setActiveTab] = useState<'summary' | 'topics'>('summary');
  const [viewMode, setViewMode] = useState<'preset' | 'manual'>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  
  // Custom manual input state
  const [customBook, setCustomBook] = useState({
    title: "",
    author: "",
    pages: "",
    textData: ""
  });
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Core API Analysis States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Classroom Live Debate States
  const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);
  const [studentNameInput, setStudentNameInput] = useState("");
  const [opinionInput, setOpinionInput] = useState("");
  const [stanceChoice, setStanceChoice] = useState<'positive' | 'negative' | 'neutral'>('positive');
  const [opinions, setOpinions] = useState<DiscussionRecord[]>([]);

  // Storing and generating Gemini feedback for classroom opinions
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [topicFeedback, setTopicFeedback] = useState<{ [topicId: string]: TopicFeedback }>({});
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // TTS Voice State
  const [isPlayingText, setIsPlayingText] = useState<string | null>(null);

  // Pedagogical Loading Text cycle
  const LOADING_STEPS = [
    "고전 명작의 배경과 철학을 정밀 탐독하는 중입니다...",
    "초등 어린이 맞춤형 줄거리와 교육 목표 요약안을 집필하고 있습니다...",
    "본문 속 다소 까다로운 고전 명자 어휘들을 엄선하여 사전 카드로 구성 중입니다...",
    "가족, 친구, 학교 등 아이들의 친밀한 경험과 닿을 수 있는 토론 주제를 생성 중입니다...",
    "생각의 임계점을 돌파해주는 '꼬리에 꼬리를 무는 연쇄형 질문'을 가다듬고 있습니다..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 4000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load Initial Preset Analytical Demo on first mount
  useEffect(() => {
    // Generate a default AnalysisResult for user to play with instantly!
    setAnalysisResult({
      summary: "오늘 함께 읽은 생텍쥐페리의 <어린 왕자> 92-96쪽은 주인공 어린 왕자가 지구라는 사막에서 신비한 '여우'를 만나는 아주 중요한 약속의 순간입니다. 어린 왕자는 장미로 인해 입은 마음의 상처를 가득 안고 사막을 헤매던 중 여우에게 '이리 와서 나랑 같이 놀자'며 외로움을 손 내밀어 표현합니다. 그러나 지혜롭고 정갈한 사막 여우는 거절합니다. 아직 서로가 길들여지지 않았기 때문이지요. 여우는 어린 왕자에게 '길들인다는 것'이란 바로 서로에게 '사슬(관계)을 맺는 일'이라고 조근조근 설명해 줍니다. 길들이기 전에는 수만 마리의 사내아이와 여우 중 머나먼 남에 불과하지만, 서로를 길들인다면 이 세상에서 우린 오직 단 하나뿐인 특별한 사이가 된다는 따뜻한 보석 같은 진리를 일깨워 줍니다. 진정한 친구, 특별한 존재는 하루아침에 반짝 생겨나는 것이 아니라, 서로가 관계를 맺고 길들이는 오랜 약속의 기다림과 책임으로부터 다듬어지는 것임을 초등학생 어린이들도 마음속 깊이 느낄 수 있도록 안목을 비추어 주는 놀랍고 아름다운 가르침이 담긴 대목입니다.",
      keyQuotes: [
        {
          quote: "네가 나를 길들인다면 우리는 서로가 필요해지게 돼. 너는 나에게 세상에서 단 하나뿐인 존재가 되고, 나도 너에게 세상에서 단 하나뿐인 존재가 되는 거야...",
          speaker: "사막여우",
          lesson: "진정한 단짝이나 우정은 쉽게 상점에서 사듯 만드는 것이 아니라, 서로 배려하고 관계를 잘 물들여갈 때 탄생한다는 뜻이란다."
        },
        {
          quote: "길들인다는 게 무슨 뜻이지? ... 그건 사슬을 맺는다는 뜻이야.",
          speaker: "어린 왕자와 여우",
          lesson: "사랑과 깊은 우정을 쌓는다는 것은 서로에 대해 책임을 지고 약속을 지속해 나가기로 단단히 끈을 연결하는 멋진 행동이란다."
        }
      ],
      vocab: [
        {
          word: "길들이다",
          meaning: "동물에게 사람을 따르게 하거나, 익숙하고 친밀하지 않았던 관계가 점차 아주 가깝고 없어서는 안 될 특별한 사이가 되도록 매만지다.",
          exampleInsideBook: "사막여우는 단순히 우연히 만난 것에 그치지 않고, 예의 바르고 약속된 기다림 속에서 특별한 관계(길들임)를 쌓을 가치를 왕자에게 들려주었어요."
        },
        {
          word: "인연(因緣)",
          meaning: "어떤 물일이나 사람 사이에 가늘고 튼튼하게 이어져 있는 신비로운 연결 고리나 우정의 운명적인 끈.",
          exampleInsideBook: "우리가 살아가며 만나는 친구, 가족, 선생님 등 소중한 관계 모두가 이 특별한 인연으로부터 싹튼답니다."
        }
      ],
      topics: [
        {
          id: "topic_1",
          title: "아끼던 소중한 장난감을 친구와 나눠 쓰며 관계 맺는 것이 늘 행복하기만 할까요?",
          description: "여우와 왕자의 서로 '길들여진다'는 것의 이면에는 책임과 조율이 필요합니다. 물건이나 마음을 나눌 때 무조건 기쁘기만 한지, 혹은 양보하느라 힘들었던 적은 없었는지 들여다봅니다.",
          linkToExperience: "학교나 집에서 나만 쓰고 싶은 아끼는 물건이 있을 거야. 그걸 친구나 동생에게 양보해 줬을 때의 솔직한 우리 감정을 떠올려 볼까?",
          startingQuestion: "내 소중한 보물 1호를 친구에게 흔쾌히 양보하거나 같이 써서 더 친해진 경험이 있나요? 그때 진짜 기분이 어땠나요?",
          tailQuestions: [
            "만약 친구가 내가 양보해 준 장물감을 망가뜨렸다면, '특별한 관계'를 유지하기 위해 여전히 참아야 할까요?",
            "남에게 한 번도 상처 주지 않고 진정한 보물 같은 친구를 얻는 것은 과연 가능할까요?"
          ],
          suggestedStances: {
            positive: "진짜 소중한 친구가 생기는 과정이므로 마찰이 있거나 빌려주고 양보하며 조금 손해를 보더라도 기쁜 일이다.",
            negative: "친구와 사이가 깊어지는 것은 좋지만, 내 소중한 권리나 아끼는 보물을 무리하여 양보하면서까지 억지로 맞출 필요는 없다.",
            neutral: "서로 선을 넘지 않도록 우정의 대화를 통해 각자의 보물을 안전하게 배려하는 규칙을 함께 의논해야 한다."
          }
        },
        {
          id: "topic_2",
          title: "서로에게 '단 하나뿐인 특별한 사이'라면, 매일 비밀을 단짝끼리만 공유해야 할까요?",
          description: "길들임은 우정의 튼튼한 끈을 의미하지만, 한편으로는 소유욕이나 집착으로 이어져 다른 친구들과의 교류를 방해할 위험도 있습니다.",
          linkToExperience: "학급에서 '너랑 나만 단짝이니까 다른 친구랑은 놀지 마!'라며 섭섭해하거나 비밀 공유를 졸랐던 적이 있었는지 생각해 봐요.",
          startingQuestion: "특정한 베스트 프렌드 한 명하고만 모든 비밀을 나누고 싶어 하는 마음에 찬성하나요, 반대하나요?",
          tailQuestions: [
            "만약 내 단짝 친구가 나보다 다른 친구와 더 즐겁게 귓속말을 나누고 있다면, 나는 질투심을 다스려야 할까요?",
            "특별한 하나뿐인 친구가 되면서도, 반 전체의 다른 프렌드들과도 넓고 자유롭게 인사를 나누는 좋은 비결은 무엇일까요?"
          ],
          suggestedStances: {
            positive: "어린 여우의 말처럼 우정의 깊이를 위해서는 서로만의 약속과 내밀한 비밀을 지키는 끈끈한 1:1 결속이 최고다.",
            negative: "비밀을 독점하거나 한 사람에게만 매달리면 서로 구속감을 느끼고 피곤해질 수 있으므로, 우정의 문은 넓게 열려 있어야 한다.",
            neutral: "단짝과의 의리와 약속은 존중하되, 다른 친구들의 참여를 질투 없이 유연하게 인정하는 균형감이 정답이다."
          }
        },
        {
          id: "topic_3",
          title: "길들인 장미에 책임을 진 어린 왕자처럼, 키우던 반려동물이 아플 때 끝까지 책임져야 할까요?",
          description: "여우는 작별 인사로 '네 장미에 대해 너는 책임이 있어'라고 조언합니다. 우리가 기르는 생명이나 맺은 인연에 책임감이 왜 필요한지 토론해 봅니다.",
          linkToExperience: "집에서 상추나 토마토를 키워보았거나, 강아지, 고양이, 햄스터 같은 소중한 영혼을 직접 보듬어 본 아날로그 추억이 있니?",
          startingQuestion: "동물을 기를 때, 그 동물이 늙거나 무척 아파서 치료비가 많이 들고 돌보기 귀찮아져도 끝까지 정성껏 지켜야 할까요?",
          tailQuestions: [
            "만약 우리의 부주의가 아니라 부득이한 이사나 알레르기 수치 폭발 같은 큰 문제가 생겼다면 동물을 보내는 선택은 괜찮을까요?",
            "어린이가 생명을 입양할 때, 끝까지 책임지겠다는 약속을 실천하기 위한 법률적·도덕적 의무 장치에는 무엇이 필요할까요?"
          ],
          suggestedStances: {
            positive: "우리가 선택해서 맺은 관계(길들임)이므로, 아프거나 가치가 떨어졌다고 손을 놓는 것은 여우가 말한 소중함을 배신하는 행위와 같다.",
            negative: "가족 전체의 건강이 위협받거나 감당할 수 없을 때는 억지로 고통을 지속하기보다 동물을 좋은 전문 시설로 인도하는 것이 타협책이 될 수 있다.",
            neutral: "책임이란 감정뿐 아니라, 입양 시점부터 보호자의 엄격한 교육과 제도적 서약을 통해 의무적으로 준비되어야 한다."
          }
        }
      ]
    });

    // Preset opinions for testing out feedback seamlessly
    setOpinions([
      { id: "1", topicId: "topic_1", studentName: "민수", opinion: "친구에게 내 장난감을 빌려줄 때 처음에는 고장 날 것 같아서 주저하고 걱정됐지만, 같이 재미있게 우주 정거장 만드는 비밀 미션을 성공하니까 그냥 혼자 노는 것보다 백 배는 훨씬 더 뿌듯하고 행복했어요!", stance: "positive", createdAt: "10:15 AM" },
      { id: "2", topicId: "topic_1", studentName: "하은", opinion: "저는 조금 다르게 생각해요. 저번에 진짜 아끼던 수제 다이어리를 빌려줬는데 친구가 음료수를 쏟아서 얼룩을 만들어왔어요. 하지만 소심해서 화도 못 내고 속으로만 울었거든요. 친구 관계 때문에 너무 무조건 양보하는 것은 오히려 병을 키우는 것 같아 반대해요.", stance: "negative", createdAt: "10:18 AM" },
      { id: "3", topicId: "topic_1", studentName: "지한", opinion: "양보하는 것이 좋은 미덕이긴 하지만 상처받지 않으려면 미리 빌린 사람의 약속 서약서를 쓰거나, 소중한 물건 대신에 같이 사용할 수 있는 공용 보드게임 같은 것을 사용해 타협하는 똑똑한 양보 규칙을 지켜야 한다고 봐요.", stance: "neutral", createdAt: "10:20 AM" }
    ]);
  }, []);

  // Standard preset option selector autofilling fields
  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = PRESET_BOOKS[index];
    setCustomBook({
      title: preset.title,
      author: preset.author,
      pages: preset.pages,
      textData: preset.excerpt
    });
    setPdfBase64(null);
    setPdfFileName(null);
  };

  // Drag and Drop PDF triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processPdfFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPdfFile(e.target.files[0]);
    }
  };

  const processPdfFile = (file: File) => {
    if (file.type !== "application/pdf") {
      alert("⚠️ 파일 형식이 다릅니다. 초등학교 독서 교재 PDF 자료를 업로드해 주세요!");
      return;
    }
    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // TTS Read Aloud trigger using local Web Speech API
  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) {
      alert("이 브라우저는 음성 합성 기능을 지원하지 않습니다. 구글 크롬 또는 Edge 브라우저를 이용해 주세요!");
      return;
    }

    if (isPlayingText === text) {
      window.speechSynthesis.cancel();
      setIsPlayingText(null);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlayingText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      setIsPlayingText(null);
    };
    utterance.onerror = () => {
      setIsPlayingText(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start Gemini Main Analysis Call
  const handleAnalyzeBook = async () => {
    let titleToDeploy = "";
    let authorToDeploy = "";
    let pagesToDeploy = "";
    let textToDeploy = "";

    if (viewMode === "preset") {
      const p = PRESET_BOOKS[selectedPresetIndex];
      titleToDeploy = p.title;
      authorToDeploy = p.author;
      pagesToDeploy = p.pages;
      textToDeploy = p.excerpt;
    } else {
      if (!customBook.title || !customBook.pages) {
        setErrorText("도서명과 오늘 학습한 책 쪽수를 정확히 적어주세요!");
        return;
      }
      titleToDeploy = customBook.title;
      authorToDeploy = customBook.author;
      pagesToDeploy = customBook.pages;
      textToDeploy = customBook.textData;
    }

    setLoading(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/analyze-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleToDeploy,
          author: authorToDeploy,
          pages: pagesToDeploy,
          textData: textToDeploy,
          pdfData: pdfBase64
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "분석 과정에서 이상이 보고되었습니다.");
      }

      setAnalysisResult(data);
      // Reset live discussion opinions list for new educational session
      setOpinions([]);
      setTopicFeedback({});
      setActiveTopicIndex(0);
      setActiveTab("summary");
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  // Add customized student opinion locally
  const handleAddOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNameInput.trim() || !opinionInput.trim()) return;

    const newOpinion: DiscussionRecord = {
      id: Date.now().toString(),
      topicId: analysisResult?.topics[activeTopicIndex].id || "topic_1",
      studentName: studentNameInput.trim(),
      opinion: opinionInput.trim(),
      stance: stanceChoice,
      createdAt: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };

    setOpinions((prev) => [...prev, newOpinion]);
    setStudentNameInput("");
    setOpinionInput("");
  };

  const handleRemoveOpinion = (id: string) => {
    setOpinions((prev) => prev.filter((op) => op.id !== id));
  };

  // Fetch AI Critique & Educational Feedback for collected opinions on this topic
  const handleGetClassFeedback = async () => {
    if (!analysisResult) return;
    const currentTopic = analysisResult.topics[activeTopicIndex];
    const filteredOpinions = opinions.filter((op) => op.topicId === currentTopic.id);

    if (filteredOpinions.length === 0) {
      setFeedbackError("최소 한 명 이상의 학생 의견을 수집해야 칭찬 피드백을 열 수 있습니다!");
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const response = await fetch("/api/class-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: currentTopic,
          opinions: filteredOpinions
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "피드백 처리 실패");
      }

      setTopicFeedback((prev) => ({
        ...prev,
        [currentTopic.id]: data
      }));
    } catch (err: any) {
      console.error(err);
      setFeedbackError(err.message || "피드백을 생성할 수 없습니다.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Calculate stats for current active discussion records
  const getActiveTopicStats = () => {
    if (!analysisResult) return { positive: 0, negative: 0, neutral: 0 };
    const currentTopicId = analysisResult.topics[activeTopicIndex].id;
    const filtered = opinions.filter((op) => op.topicId === currentTopicId);
    
    return filtered.reduce(
      (acc, op) => {
        if (op.stance === "positive") acc.positive++;
        else if (op.stance === "negative") acc.negative++;
        else acc.neutral++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );
  };

  const stats = getActiveTopicStats();
  const currentTopic = analysisResult?.topics[activeTopicIndex];
  const activeTopicOpinions = opinions.filter((op) => op.topicId === (currentTopic?.id || ""));

  return (
    <div className="min-h-screen bg-[#FCFBF8] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Professional Navigation Bar */}
      <header className="bg-white border-b border-[#E6DEC4] sticky top-0 z-50 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                고전독서 토론 도우미
                <span className="text-xs font-normal bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  초등 학습용
                </span>
              </h1>
              <p className="text-xs text-slate-500">교사·어린이가 함께 만드는 생각의 정원</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-2 font-mono hidden lg:inline">AI Engine: gemini-3.5-flash</span>
            <div className="h-6 w-px bg-slate-200 mr-2 hidden lg:inline"></div>
            <button
              onClick={() => {
                if (viewMode === "preset") {
                  handleSelectPreset(selectedPresetIndex);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 duration-150"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              수업 초기화
            </button>
          </div>
        </div>
      </header>

      {/* Main Educational Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input setup & Literature Selection (4 Columns) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-[#E9E4D4] p-5 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-rose-50/80 pb-3">
              <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-orange-500" />
                오늘 학습할 고전 선택
              </h2>
              <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setViewMode('preset')}
                  className={`px-3 py-1 rounded-md transition-all duration-200 font-medium ${
                    viewMode === 'preset' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  명작 프리셋
                </button>
                <button
                  onClick={() => setViewMode('manual')}
                  className={`px-3 py-1 rounded-md transition-all duration-200 font-medium ${
                    viewMode === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  직접 구성 (PDF)
                </button>
              </div>
            </div>

            {/* PRESET BOOK MODE */}
            {viewMode === 'preset' && (
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-slate-500">교과서 수록 대표 고전 목록</label>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {PRESET_BOOKS.map((book, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(idx)}
                      className={`text-left p-3 rounded-xl border text-xs transition-all duration-150 relative ${
                        selectedPresetIndex === idx
                          ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-medium shadow-2xs'
                          : 'border-[#EDEAE0] bg-white hover:bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{book.title}</span>
                        {selectedPresetIndex === idx && <Check className="w-3.5 h-3.5 text-orange-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 lines-clamp-1">{book.description}</div>
                      <div className="text-[10px] text-orange-800 mt-1.5 font-semibold bg-white/60 inline-block px-1.5 py-0.5 rounded-sm">
                        쪽수 설정: {book.pages}쪽
                      </div>
                    </button>
                  ))}
                </div>

                {/* Mini Box showing Excerpt of preset */}
                <div className="bg-slate-50 border border-[#ECE9DF] p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    선택된 작품 핵심 본문 발췌
                  </span>
                  <p className="text-xs font-serif text-slate-600 leading-relaxed bg-white border border-[#EBE8DD] p-2.5 rounded-lg max-h-28 overflow-y-auto">
                    {PRESET_BOOKS[selectedPresetIndex].excerpt}
                  </p>
                </div>
              </div>
            )}

            {/* MANUAL MANUSCRIPT MODE */}
            {viewMode === 'manual' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">도서명 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="text-xs border border-[#E4DFD0] rounded-xl p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="예: 별주부전"
                      value={customBook.title}
                      onChange={(e) => setCustomBook({ ...customBook, title: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">지은이/저자</label>
                    <input
                      type="text"
                      className="text-xs border border-[#E4DFD0] rounded-xl p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="예: 미상"
                      value={customBook.author}
                      onChange={(e) => setCustomBook({ ...customBook, author: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">오늘 활동할 쪽수 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="text-xs border border-[#E4DFD0] rounded-xl p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="예: 12-18쪽"
                    value={customBook.pages}
                    onChange={(e) => setCustomBook({ ...customBook, pages: e.target.value })}
                  />
                </div>

                {/* PDF Drag & Drop Sector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">독서 자료 PDF 업로드 (선택)</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-150 ${
                      isDragging
                        ? 'border-orange-500 bg-orange-50/40'
                        : pdfFileName
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-[#EDE8D8] bg-[#FCFBF9] hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload-input"
                    />
                    <label htmlFor="pdf-upload-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <Upload className={`w-6 h-6 ${pdfFileName ? 'text-emerald-500 animate-bounce' : 'text-slate-400'}`} />
                      {pdfFileName ? (
                        <div>
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px] mx-auto">
                            {pdfFileName}
                          </span>
                          <span className="text-[10px] text-emerald-600 block mt-0.5">반영 완료 (Gemini가 직접 독해)</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs font-semibold text-slate-700 block">PDF 파일을 드래그하여 놓으세요</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">또는 탐색기에서 선택하기</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500">혹은 직접 텍스트 붙여넣기</label>
                    <span className="text-[10px] text-slate-400">PDF가 없을 때 활용 가능</span>
                  </div>
                  <textarea
                    rows={4}
                    className="text-xs border border-[#E4DFD0] rounded-xl p-2.5 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="오늘 독서할 단락이나 교과서 텍스트 본문 단락을 여기에 복사해 넣어보세요."
                    value={customBook.textData}
                    onChange={(e) => setCustomBook({ ...customBook, textData: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* ERROR BOUNDARY DISPLAY */}
            {errorText && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <p className="leading-snug">{errorText}</p>
              </div>
            )}

            {/* ANALYZE ACTION BUTTON */}
            <button
              onClick={handleAnalyzeBook}
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-tight text-white flex items-center justify-center gap-2 shadow-xs transition-all duration-150 ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-orange-600 cursor-pointer hover:shadow-md'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "독서 지도 제작 중..." : "오늘 독서분석 & 토론 생성"}
            </button>
          </div>

          {/* Quick Classroom Guide Card */}
          <div className="bg-amber-50/50 border border-amber-200/50 rounded-3xl p-5 shadow-2xs flex flex-col gap-3">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              활동 가이드
            </h3>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4 leading-relaxed">
              <li><strong>도서 선정:</strong> 왼쪽 위에 준비된 한국 대표 5대 아동 고전이나 개개인의 PDF/텍스트를 입력하세요.</li>
              <li><strong>줄거리 숙지:</strong> 요약본을 화면에 띄우고 귀여운 <span className="font-bold">성우 목소리(TTS)</span>로 다 같이 청취해봅니다.</li>
              <li><strong>꼬리물기 대화:</strong> 3가지 맞춤 딜레마 주제 중 맘에 드는 카드를 골라 <span className="text-amber-900 font-semibold">'교실 실시간 토론판'</span>을 활성화하세요.</li>
              <li><strong>생각 수집:</strong> 어린이들의 이름과 의견을 등록한 후, 최종 <span className="font-bold underline text-amber-900">Gemini 총평</span>을 받아 학급 우수 토론으로 마무리합니다!</li>
            </ol>
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Educational Outputs & Live Discussion Board (8 Columns) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {loading ? (
              /* CHEERFUL INTERACTIVE LOADING SCREEN */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-3xl border border-[#E9E4D4] p-10 shadow-sm flex flex-col items-center justify-center min-h-[500px] text-center"
              >
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin"></div>
                  <BookOpen className="w-6 h-6 text-orange-500 absolute inset-0 m-auto animate-pulse" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  책장을 넘기며 생각하는 기단을 조율하고 있어요!
                </h3>
                <p className="text-xs text-slate-500 mb-6 max-w-sm">
                  Gemini-3.5-flash 모델이 해당 페이지를 교육 전문가의 문맥으로 한 자 한 자 분석하고 있습니다.
                </p>

                {/* Pedagogy Milestone animation box */}
                <div className="bg-slate-50 border border-[#ECE8D9] rounded-2xl p-4 py-5 max-w-md w-full">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    현재 단계
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingStep}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      className="text-xs font-semibold text-slate-800 leading-relaxed min-h-8"
                    >
                      {LOADING_STEPS[loadingStep]}
                    </motion.p>
                  </AnimatePresence>
                  <div className="flex gap-1 justify-center mt-3">
                    {LOADING_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          loadingStep === i ? 'w-4 bg-orange-500' : 'w-1.5 bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : analysisResult ? (
              /* HIGH-FIDELITY LITERARY DASHBOARD */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Book Header Segment */}
                <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-15 text-white/5 pointer-events-none transform translate-y-1/4 translate-x-1/10 font-serif text-9xl">
                    Classic
                  </div>
                  <div className="z-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold tracking-wider text-orange-300 uppercase">
                        현재 수업 보드
                      </div>
                      <h2 className="text-lg md:text-xl font-bold font-serif text-white">
                        {viewMode === "preset" ? PRESET_BOOKS[selectedPresetIndex].title : customBook.title}
                      </h2>
                      <div className="text-xs text-slate-300 mt-1">
                        저자: {viewMode === "preset" ? PRESET_BOOKS[selectedPresetIndex].author : customBook.author || "미상"} &bull; 읽은 분량: <span className="font-semibold text-orange-200">{viewMode === "preset" ? PRESET_BOOKS[selectedPresetIndex].pages : customBook.pages}쪽</span>
                      </div>
                    </div>
                  </div>

                  {/* Tab Selector Buttons */}
                  <div className="flex bg-white/10 rounded-xl p-1 z-10 w-full md:w-auto self-end md:self-auto">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        activeTab === 'summary'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      줄거리 &amp; 낱말 요약
                    </button>
                    <button
                      onClick={() => setActiveTab('topics')}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        activeTab === 'topics'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 animate-pulse" />
                      실시간 교실 토론 운영
                    </button>
                  </div>
                </div>

                {/* TAB 1 CONTENT: 1000자 요약, 어휘, 교훈 */}
                {activeTab === 'summary' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Visual 1000자 Book summary segment */}
                    <div className="bg-white rounded-3xl border border-[#E9E4D4] p-6 shadow-sm relative">
                      <div className="flex items-center justify-between mb-4 border-b border-[#ECE8D7] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-5 bg-orange-500 rounded-full"></span>
                          <h3 className="text-md font-bold text-slate-900">오늘 파트 1000자 핵심 요약</h3>
                        </div>
                        <button
                          onClick={() => handleSpeak(analysisResult.summary)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition-all duration-150 ${
                            isPlayingText === analysisResult.summary
                              ? 'bg-orange-50 text-orange-600 border-orange-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${isPlayingText === analysisResult.summary ? 'animate-bounce' : ''}`} />
                          {isPlayingText === analysisResult.summary ? "다같이 듣는 중 (정지)" : "구연동화 TTS 낭독"}
                        </button>
                      </div>

                      {/* Parchment-style display sheet */}
                      <div className="bg-[#FAF8F3] border border-[#EDEAE1] rounded-2xl p-6 relative">
                        <div className="absolute right-4 top-4 text-slate-300 opacity-60">
                          <Quote className="w-8 h-8" />
                        </div>
                        <p className="text-sm md:text-base font-serif text-slate-800 leading-relaxed text-justify indent-4 whitespace-pre-line select-text">
                          {analysisResult.summary}
                        </p>
                        <div className="text-right mt-4 text-[11px] text-slate-400 font-serif">
                          &mdash; 소리 내어 마음에 정갈하게 담아 보아요
                        </div>
                      </div>
                    </div>

                    {/* Vocabulary & Wise Sayings Two-way Split Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Interactive Vocabulary Lens Card */}
                      <div className="bg-white rounded-3xl border border-[#E9E4D4] p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-[#ECE8D7] pb-3">
                          <Languages className="w-4 h-4 text-orange-500" />
                          <h3 className="text-sm font-bold text-slate-900">독서 어휘 돋보기</h3>
                          <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full ml-auto font-medium">초등 어휘력 쑥쑥</span>
                        </div>

                        <div className="flex flex-col gap-3">
                          {analysisResult.vocab && analysisResult.vocab.length > 0 ? (
                            analysisResult.vocab.map((term, idx) => (
                              <div
                                key={idx}
                                className="bg-[#FBFBFA] border border-[#EEECE6] hover:border-orange-200 p-4 rounded-2xl transition-all duration-150 hover:shadow-2xs group"
                              >
                                <div className="flex items-baseline justify-between mb-1">
                                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors">
                                    {term.word}
                                  </h4>
                                  <button
                                    onClick={() => handleSpeak(`${term.word}. 뜻: ${term.meaning}`)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-all"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-xs text-rose-950 leading-relaxed font-medium bg-rose-50/50 px-2 py-1.5 rounded-lg mb-2">
                                  뜻풀이: {term.meaning}
                                </p>
                                <div className="text-[10px] text-slate-500 leading-relaxed pl-2 border-l-2 border-[#E5DEC4]">
                                  <strong className="text-slate-700">작품에서:</strong> {term.exampleInsideBook}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-xs">
                              추출된 배움 낱말이 없습니다.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Best Quotes and Character Building lessons */}
                      <div className="bg-white rounded-3xl border border-[#E9E4D4] p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-[#ECE8D7] pb-3">
                          <Award className="w-4 h-4 text-amber-500" />
                          <h3 className="text-sm font-bold text-slate-900">가슴에 새기는 명구절</h3>
                        </div>

                        <div className="flex flex-col gap-4">
                          {analysisResult.keyQuotes && analysisResult.keyQuotes.length > 0 ? (
                            analysisResult.keyQuotes.map((item, idx) => (
                              <div key={idx} className="flex flex-col gap-2">
                                {/* Bubble Quote */}
                                <div className="bg-[#FAF9F5] border border-[#EEEAE1] rounded-2xl p-3.5 relative">
                                  <span className="absolute -top-2 left-4 text-xs font-bold leading-none bg-orange-400 text-white px-2 py-0.5 rounded-full">
                                    {item.speaker || "명구절"}
                                  </span>
                                  <p className="text-xs font-serif text-slate-800 leading-relaxed italic pt-1 text-justify">
                                    &ldquo;{item.quote}&rdquo;
                                  </p>
                                </div>
                                {/* Teacher Explanation block */}
                                <div className="flex items-start gap-1.5 pl-2 text-xs text-slate-600">
                                  <Smile className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  <p className="leading-snug bg-amber-50/40 p-2 rounded-xl text-amber-950">
                                    <strong>생각 한 모금:</strong> {item.lesson}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-xs">
                              작품 명구절 구성을 완료하지 못했습니다.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* TAB 2 CONTENT: LIVE DISCUSSION & ACTIVE DEBATE */}
                {activeTab === 'topics' && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-6"
                  >
                    
                    {/* Horizontal 3 Debate Topic select rail */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {analysisResult.topics.map((topic, idx) => {
                        const isSelected = activeTopicIndex === idx;
                        const tOpinions = opinions.filter(op => op.topicId === topic.id);
                        
                        return (
                          <button
                            key={topic.id}
                            onClick={() => {
                              setActiveTopicIndex(idx);
                              setFeedbackError(null);
                            }}
                            className={`p-4 rounded-2xl border text-left flex flex-col justify-between cursor-pointer transition-all duration-200 relative ${
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-white shadow-md transform -translate-y-0.5'
                                : 'bg-white border-[#EBE8DB] hover:bg-slate-50 hover:-translate-y-0.5 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  isSelected ? 'bg-white text-orange-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                  토론 {idx + 1}
                                </span>
                                {tOpinions.length > 0 && (
                                  <span className={`text-[9px] font-semibold flex items-center gap-1 ${
                                    isSelected ? 'text-white' : 'text-slate-500'
                                  }`}>
                                    <MessageSquare className="w-3 h-3" />
                                    {tOpinions.length}명 대화중
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-xs md:text-sm font-black tracking-tight leading-tight lines-clamp-2 ${
                                isSelected ? 'text-white' : 'text-slate-900'
                              }`}>
                                {topic.title}
                              </h4>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <span className={`text-[10px] font-medium ${isSelected ? 'text-orange-200' : 'text-slate-400'}`}>
                                자세히 보기
                              </span>
                              <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* LIVE ACTIVE OPERATOR PANEL */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl border border-[#E9E4D4] p-5 md:p-6 shadow-sm">
                      
                      {/* Left Block inside Card: Discussion Prompt Outline (7 columns) */}
                      <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="border-b border-slate-100 pb-3">
                          <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">
                            오늘의 토론 질문지 번호: {activeTopicIndex + 1}
                          </div>
                          <h3 className="text-base font-bold text-slate-800 leading-snug">
                            {analysisResult.topics[activeTopicIndex].title}
                          </h3>
                        </div>

                        {/* Story Context & Kid Experience bridge */}
                        <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-2xl">
                          <span className="text-[10px] bg-amber-100 font-bold text-amber-800 px-2 py-0.5 rounded-full mb-1 inline-block">
                            어린이 일상 경험 유도
                          </span>
                          <p className="text-xs text-amber-950 font-medium leading-relaxed">
                            "{analysisResult.topics[activeTopicIndex].linkToExperience}"
                          </p>
                        </div>

                        {/* Starting & Consecutive Deconstructive Tail Questions (Toggled revealing state keeps classroom focus) */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                          <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">
                            꼬리에 꼬리를 무는 질문 연쇄 로드맵
                          </span>

                          <div className="flex items-start gap-2 bg-white border border-slate-200/60 p-3 rounded-xl shadow-2xs">
                            <span className="text-xs bg-slate-900 text-white font-extrabold w-5 h-5 rounded-md flex items-center justify-center shrink-0">
                              시작
                            </span>
                            <div>
                              <p className="text-xs text-slate-500 leading-none mb-1 font-bold">1단계: 마음 열기 개방형 질문</p>
                              <p className="text-xs font-extrabold text-slate-900 leading-normal">
                                {analysisResult.topics[activeTopicIndex].startingQuestion}
                              </p>
                            </div>
                            <button
                              onClick={() => handleSpeak(analysisResult.topics[activeTopicIndex].startingQuestion)}
                              className="text-slate-400 hover:text-slate-700 ml-auto p-1"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {analysisResult.topics[activeTopicIndex].tailQuestions.map((tailQ, tIdx) => (
                            <div key={tIdx} className="flex items-start gap-2 bg-orange-50/50 border border-orange-100 p-3 rounded-xl">
                              <span className="text-xs bg-orange-500 text-white font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 animate-pulse">
                                {tIdx + 1}
                              </span>
                              <div>
                                <p className="text-[10px] text-orange-700 font-bold mb-1">
                                  {tIdx === 0 ? "2단계: 생각을 한 걸음 더! (꼬리 질문)" : "3단계: 가치 대립 확장하기 (연쇄 질문)"}
                                </p>
                                <p className="text-xs text-slate-800 font-bold leading-normal">
                                  {tailQ}
                                </p>
                              </div>
                              <button
                                onClick={() => handleSpeak(tailQ)}
                                className="text-slate-400 hover:text-slate-700 ml-auto p-1"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Stances Assistance Helper Grid */}
                        <div className="bg-[#FAF9F5] rounded-2xl border border-[#EEECE6] p-4">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">토론 관점 돋보기 가이드</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                            <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100">
                              <div className="text-emerald-700 font-bold mb-0.5">찬성측 시선</div>
                              <p className="text-slate-600">{analysisResult.topics[activeTopicIndex].suggestedStances.positive}</p>
                            </div>
                            <div className="bg-rose-50/40 p-2.5 rounded-lg border border-rose-100">
                              <div className="text-rose-700 font-bold mb-0.5">반대측 시선</div>
                              <p className="text-slate-600">{analysisResult.topics[activeTopicIndex].suggestedStances.negative}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Block inside Card: Realtime Live Opinion Aggregator Room (5 columns) */}
                      <div className="lg:col-span-5 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-5">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-orange-500" />
                            학급 의견 수집기
                          </h4>
                          <span className="text-[10px] bg-slate-900 text-white font-mono px-2 py-0.5 rounded-full">
                            총 {activeTopicOpinions.length}명 참가
                          </span>
                        </div>

                        {/* Stance chart layout */}
                        {activeTopicOpinions.length > 0 && (
                          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/50 flex items-center justify-around text-center text-[10px] font-bold">
                            <div>
                              <div className="text-emerald-600 font-black text-xs">{stats.positive}</div>
                              <div className="text-slate-400">네! (찬성)</div>
                            </div>
                            <div className="h-4 w-px bg-slate-200"></div>
                            <div>
                              <div className="text-rose-600 font-black text-xs">{stats.negative}</div>
                              <div className="text-slate-400">아니오! (반대)</div>
                            </div>
                            <div className="h-4 w-px bg-slate-200"></div>
                            <div>
                              <div className="text-indigo-600 font-black text-xs">{stats.neutral}</div>
                              <div className="text-slate-400">더 고민돼요</div>
                            </div>
                          </div>
                        )}

                        {/* Input Opinion Form */}
                        <form onSubmit={handleAddOpinion} className="flex flex-col gap-2.5 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              className="text-xs border border-slate-200 rounded-xl p-2 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              placeholder="어린이 이름"
                              value={studentNameInput}
                              onChange={(e) => setStudentNameInput(e.target.value)}
                            />
                            <select
                              className="text-xs border border-slate-200 rounded-xl p-2 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              value={stanceChoice}
                              onChange={(e) => setStanceChoice(e.target.value as any)}
                            >
                              <option value="positive">네! (찬성)</option>
                              <option value="negative">아니오! (반대)</option>
                              <option value="neutral">중립·기타</option>
                            </select>
                          </div>
                          
                          <div className="flex gap-1.5 focus-within:ring-1 focus-within:ring-orange-500 rounded-xl overflow-hidden bg-white border border-slate-200 p-1">
                            <input
                              type="text"
                              required
                              className="flex-1 text-xs p-2 focus:outline-none bg-transparent"
                              placeholder="의견을 적어주세요... (예: 왕자는 외로운 마음을..."
                              value={opinionInput}
                              onChange={(e) => setOpinionInput(e.target.value)}
                            />
                            <button
                              type="submit"
                              className="bg-slate-900 hover:bg-orange-500 transition-colors text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                            >
                              등록
                            </button>
                          </div>
                        </form>

                        {/* Dynamic Opinions interactive scrollbox */}
                        <div className="flex-1 flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                          {activeTopicOpinions.length > 0 ? (
                            activeTopicOpinions.map((op) => (
                              <div
                                key={op.id}
                                className="bg-white border border-slate-200/80 p-3 rounded-xl flex flex-col gap-2 relative group hover:border-slate-300 transition-all shadow-3xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                      {op.studentName}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                      op.stance === 'positive' 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : op.stance === 'negative' 
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-indigo-50 text-indigo-700'
                                    }`}>
                                      {op.stance === 'positive' ? '찬성' : op.stance === 'negative' ? '반대' : '중립'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveOpinion(op.id)}
                                    className="opacity-10 md:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-xs text-slate-600 leading-normal font-serif italic pl-0.5">
                                  &ldquo;{op.opinion}&rdquo;
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1">
                              <Smile className="w-6 h-6 text-slate-300" />
                              어린이들의 흥미롭고 솔직한 첫 의견을<br />위 폼에서 등록해 주세요!
                            </div>
                          )}
                        </div>

                        {/* SUMMARIZE OPINIONS BACKEND ACTION: Gemini teacher feedback */}
                        {activeTopicOpinions.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                            {feedbackError && (
                              <div className="text-[10px] bg-red-50 text-red-700 p-2 rounded-lg leading-tight">
                                {feedbackError}
                              </div>
                            )}
                            <button
                              onClick={handleGetClassFeedback}
                              disabled={feedbackLoading}
                              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                feedbackLoading
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-900 border border-orange-200 shadow-2xs'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                              {feedbackLoading ? "의견 종합 중..." : "Gemini 토론 총평받기"}
                            </button>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* GEMINI COMMENTARY DISPLAY FLOOR */}
                    {topicFeedback[analysisResult.topics[activeTopicIndex].id] && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col gap-4 relative overflow-hidden"
                      >
                        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/10 -translate-y-1/10 scale-150">
                          <Award className="w-48 h-48 text-white" />
                        </div>
                        
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                          <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-orange-400">
                            <Sparkles className="w-4 h-4 animate-spin-slow" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Gemini 토론 사회 코치 총평</h4>
                            <p className="text-[10px] text-orange-300">학생들의 생각이 한 번 더 멋지게 날개 돋쳤습니다!</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light leading-relaxed">
                          
                          {/* Critique Summary */}
                          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
                            <h5 className="font-bold text-orange-200 flex items-center gap-1">
                              <span className="w-1.5 h-3 bg-orange-400 rounded-sm"></span>
                              의견 구조 요약
                            </h5>
                            <p className="text-slate-300 text-xs">
                              {topicFeedback[analysisResult.topics[activeTopicIndex].id].summaryOfOpinions}
                            </p>
                          </div>

                          {/* Classroom Praise */}
                          <div className="bg-emerald-950/40 border border-emerald-900/30 p-4 rounded-2xl flex flex-col gap-2">
                            <h5 className="font-bold text-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-3 bg-emerald-400 rounded-sm"></span>
                              칭찬의 속삭임
                            </h5>
                            <p className="text-emerald-100 italic">
                              &ldquo;{topicFeedback[analysisResult.topics[activeTopicIndex].id].praise}&rdquo;
                            </p>
                          </div>

                        </div>

                        {/* Deeper consecutive chain prompt */}
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10 mt-2">
                          <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wide block mb-1">
                            토론 심화를 위한 한걸음 다음 연쇄 발문 
                          </span>
                          <p className="text-xs font-bold text-white leading-relaxed">
                            {topicFeedback[analysisResult.topics[activeTopicIndex].id].nextDeeperQuestion}
                          </p>
                          <div className="mt-2.5 flex justify-end gap-2">
                            <button
                              onClick={() => handleSpeak(topicFeedback[analysisResult.topics[activeTopicIndex].id].nextDeeperQuestion)}
                              className="bg-white text-slate-900 font-bold px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-1 hover:bg-slate-100"
                            >
                              <Volume2 className="w-3 h-3" />
                              질문 음성 출력
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </motion.div>
                )}

              </motion.div>
            ) : (
              /* WELCOME STATE DISPLAY (Initial layout guide) */
              <div className="bg-white rounded-3xl border border-[#E9E4D4] p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-16 h-16 bg-[#FAF8F2] rounded-full flex items-center justify-center text-orange-500 mb-6 border border-[#ECE8D7] shadow-3xs">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 font-serif">
                  소중한 상상력과 논리가 배양되는 고전독서 교실
                </h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
                  오늘 토론하기 원하는 고전 명작을 왼쪽 메뉴에서 선택하고 <strong>'분석 &amp; 토론 생성'</strong> 버튼을 클릭하십시오.<br />
                  Gemini API가 1000자 요약, 가발 단어 카드, 꼬리에 꼬리를 무는 교육 딜레마를 정성껏 설계해 드릴 것입니다.
                </p>

                <div className="flex gap-2 max-w-md w-full justify-center">
                  <div className="bg-[#FAF9F5] border border-[#EDEAE1] p-4 rounded-2xl flex-1 text-left">
                    <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded-full block w-max mb-1.5">
                      프리셋 활용법
                    </span>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      어린 왕자, 홍길동전 등 아동 클래식 5선을 통해 교실 토론 기능과 총평 기입을 즉석에서 검증할 수 있습니다.
                    </p>
                  </div>
                  <div className="bg-[#FAF9F5] border border-[#EDEAE1] p-4 rounded-2xl flex-1 text-left">
                    <span className="text-[10px] bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full block w-max mb-1.5">
                      PDF/텍스트 활용법
                    </span>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      학교 도서 교재 PDF 파일이나 인터넷 텍스트를 그대로 올려서, 학급 교과서 맞춤 지도를 완성해 보세요.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>

      </main>

      {/* Footer credits and information */}
      <footer className="bg-white border-t border-[#E6DEC4] py-6 px-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} 고전독서 토론 도우미 &bull; Designed elegantly for Korean Elementary School Classrooms</p>
          <div className="flex gap-4">
            <span className="text-[#94A3B8]">독서기반 인성·비판적 사고력 교육 플랫폼</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
