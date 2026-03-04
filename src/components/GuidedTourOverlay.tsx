import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useGuidedTour } from "@/contexts/GuidedTourContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, Sparkles } from "lucide-react";

export const GuidedTourOverlay = () => {
  const {
    isActive,
    currentStep,
    totalSteps,
    getCurrentStep,
    nextStep,
    endTour,
  } = useGuidedTour();

  const location = useLocation();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const rafRef = useRef<number | null>(null);

  const step = getCurrentStep();

  // 1. Kiểm tra Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. Cập nhật vị trí Highlight
  const updatePosition = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return; // Bỏ qua nếu phần tử bị ẩn
    setHighlightPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  // 3. Liên tục quét tìm phần tử mục tiêu (Giúp tìm được Dropdown ngay khi nó vừa xuất hiện)
  useEffect(() => {
    if (!isActive || !step?.targetSelector) {
      setTargetElement(null);
      return;
    }

    const tryFind = () => {
      const el = document.querySelector(step.targetSelector!) as HTMLElement;
      if (el) {
        setTargetElement(el);
      }
    };

    tryFind();
    const interval = setInterval(tryFind, 200);
    return () => clearInterval(interval);
  }, [isActive, step]);

  // 4. Dùng requestAnimationFrame để vòng sáng bám sát theo Animation của web (ví dụ menu trượt xuống)
  useEffect(() => {
    if (!isActive || !targetElement) return;

    const loop = () => {
      updatePosition(targetElement);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, targetElement, updatePosition]);

  // 5. LOGIC MỚI: Theo dõi Click/Focus xuyên thấu và xử lý chuyển Step
  useEffect(() => {
    if (!isActive || !targetElement) return;

    let isAdvanced = false;

    // Xử lý khi người dùng tương tác đúng vào phần tử
    const handleInteraction = (e: Event) => {
      const target = e.target as Node;
      // Nếu nhấn trúng phần tử đang được làm sáng
      if (targetElement.contains(target) || targetElement === target) {
        if (!isAdvanced) {
          isAdvanced = true;
          // Delay 400ms để đảm bảo Dropdown/Menu trên web bung ra xong xuôi rồi mới chuyển Step 3
          setTimeout(() => {
            nextStep();
          }, 400); 
        }
      }
    };

    // Chặn mọi tương tác bấm nhầm ra ngoài vùng sáng
    const blockOutside = (e: Event) => {
      const target = e.target as Node;
      const tooltip = document.getElementById('tour-tooltip');
      
      // Cho phép click vào hộp thoại hướng dẫn hoặc phần tử được highlight
      if (tooltip?.contains(target) || targetElement.contains(target) || targetElement === target) {
        return; 
      }
      
      e.stopPropagation();
      e.preventDefault();
    };

    // Gắn sự kiện ở Phase Capture để bắt mọi loại tương tác (đặc biệt là pointerdown của Shadcn)
    document.addEventListener('pointerdown', blockOutside, true);
    document.addEventListener('mousedown', blockOutside, true);
    document.addEventListener('click', blockOutside, true);

    document.addEventListener('pointerdown', handleInteraction, true);
    document.addEventListener('click', handleInteraction, true);
    
    // Nếu đối tượng là ô nhập liệu (Input), bắt thêm sự kiện focus
    if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
      targetElement.addEventListener('focus', handleInteraction);
    }

    return () => {
      document.removeEventListener('pointerdown', blockOutside, true);
      document.removeEventListener('mousedown', blockOutside, true);
      document.removeEventListener('click', blockOutside, true);
      
      document.removeEventListener('pointerdown', handleInteraction, true);
      document.removeEventListener('click', handleInteraction, true);
      
      if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
        targetElement.removeEventListener('focus', handleInteraction);
      }
    };
  }, [isActive, targetElement, nextStep]);

  // 6. Tính toán vị trí hộp thoại
  const getTooltipPosition = () => {
    const fallback = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    if (!step) return fallback;

    if (isMobile || step.position === "center" || !targetElement) {
      return { ...fallback, maxHeight: "80vh", overflowY: "auto" as const };
    }

    const { top, left, width, height } = highlightPosition;
    const pad = 24;
    const tw = 380;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let leftPos = left + width / 2;
    let transformX = "-50%";

    if (currentStep === 1 || currentStep === 2) {
      leftPos = left - 120;
      transformX = "0";
    }

    const clampedLeft = Math.max(pad, Math.min(leftPos, vw - tw - pad));

    let finalTop = top + height + pad;
    let transformY = "0";

    if (vh - finalTop < 250 || step.position === "top") {
      finalTop = top - pad;
      transformY = "-100%";
    }

    return { 
      top: `${finalTop}px`, 
      left: `${clampedLeft}px`, 
      transform: `translate(${transformX}, ${transformY})`, 
      position: "fixed" as const 
    };
  };

  if (!isActive || !step) return null;

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden">
      {/* VÒNG TRÒN SÁNG VÀ MÀN ĐEN */}
      {targetElement && (
        <div 
          className="fixed transition-all duration-300 pointer-events-none"
          style={{
            top: highlightPosition.top - 12, 
            left: highlightPosition.left - 12, 
            width: highlightPosition.width +