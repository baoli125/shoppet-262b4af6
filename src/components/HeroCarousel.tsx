import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import heroPetCare from "@/assets/hero-pet-care.jpg";
import heroAiAssistant from "@/assets/hero-ai-assistant.jpg";
import heroCommunity from "@/assets/hero-community.jpg";

interface Slide {
  id: number;
  image: string;
  titleKey: string;
  subtitleKey: string;
  buttonTextKey: string;
  buttonAction: string;
}

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { t } = useLanguage();

  const slides: Slide[] = [
    {
      id: 1,
      image: heroPetCare,
      titleKey: "hero.slide1.title",
      subtitleKey: "hero.slide1.subtitle",
      buttonTextKey: "hero.slide1.cta",
      buttonAction: "#get-started"
    },
    {
      id: 2,
      image: heroAiAssistant,
      titleKey: "hero.slide2.title",
      subtitleKey: "hero.slide2.subtitle",
      buttonTextKey: "hero.slide2.cta",
      buttonAction: "#ai-assistant"
    },
    {
      id: 3,
      image: heroCommunity,
      titleKey: "hero.slide3.title",
      subtitleKey: "hero.slide3.subtitle",
      buttonTextKey: "hero.slide3.cta",
      buttonAction: "#community"
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleButtonClick = (action: string) => {
    const element = document.querySelector(action);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden mt-14 sm:mt-16 md:mt-20">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
            </div>

            {/* Content - Mobile Optimized */}
            <div className="relative h-full container mx-auto px-3 sm:px-4 flex items-center">
              <div className="max-w-2xl text-white animate-fade-in-up">
                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight">
                  {t(slide.titleKey)}
                </h1>
                <p className="text-sm sm:text-base md:text-xl lg:text-2xl mb-4 sm:mb-6 md:mb-8 text-white/90 line-clamp-2 sm:line-clamp-none">
                  {t(slide.subtitleKey)}
                </p>
                <Button 
                  onClick={() => handleButtonClick(slide.buttonAction)}
                  className="btn-hero text-sm sm:text-base md:text-lg h-11 sm:h-12 md:h-auto px-6 sm:px-8 touch-manipulation"
                  size="lg"
                >
                  {t(slide.buttonTextKey)}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Touch Optimized */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm text-white p-2.5 sm:p-3 rounded-full transition-all hover:scale-110 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm text-white p-2.5 sm:p-3 rounded-full transition-all hover:scale-110 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
      </button>

      {/* Indicators - Touch Friendly */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all rounded-full touch-manipulation ${
              index === currentSlide
                ? "w-8 sm:w-10 h-2.5 sm:h-3 bg-white"
                : "w-2.5 sm:w-3 h-2.5 sm:h-3 bg-white/50 hover:bg-white/75 active:bg-white/90"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
