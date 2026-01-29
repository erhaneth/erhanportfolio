import React, { useState } from "react";
import { Project } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

interface ProjectDisplayProps {
  project: Project;
  onClose: () => void;
}

const ProjectDisplay: React.FC<ProjectDisplayProps> = ({
  project,
  onClose,
}) => {
  const { translate, language } = useLanguage();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [buttonFlash, setButtonFlash] = useState<string | null>(null);

  const handleButtonClick = (buttonId: string, callback: () => void) => {
    setButtonFlash(buttonId);
    setTimeout(() => {
      setButtonFlash(null);
      callback();
    }, 150);
  };

  // Get translated content based on current language
  const title =
    language === "tr" && project.titleTr ? project.titleTr : project.title;
  const description =
    language === "tr" && project.descriptionTr
      ? project.descriptionTr
      : project.description;
  const role =
    language === "tr" && project.roleTr ? project.roleTr : project.role;
  const impact =
    language === "tr" && project.impactTr ? project.impactTr : project.impact;

  // Detect if demoUrl is an App Store link
  const isAppStoreLink = project.demoUrl?.includes("apps.apple.com") || project.demoUrl?.includes("itunes.apple.com");
  const demoButtonText = isAppStoreLink
    ? translate("project.viewOnAppStore")
    : translate("project.initializeDemo");

  return (
    <div className="glass-terminal border border-[#00FF41] matrix-border-glow h-full w-full flex flex-col mono relative overflow-hidden">
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00FF41] z-30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00FF41] z-30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00FF41] z-30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00FF41] z-30" />

      <div className="bg-[#00FF41] px-3 sm:px-4 py-2 flex justify-between items-center gap-2">
        <span className="text-[8px] sm:text-[10px] font-bold text-[#0d0208] tracking-widest uppercase truncate flex-shrink">
          {translate("project.dataPacket")}: {project.id}
        </span>
        <button
          onClick={onClose}
          className="text-[#0d0208] hover:text-white font-bold transition-colors text-xs sm:text-sm flex-shrink-0"
        >
          {translate("project.terminate")}
        </button>
      </div>

      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
        {project.id === "zion-mainframe" ? (
          // Live Mirror for ZION MAINFRAME - Recursive Iframe
          <div className="relative group transition-all duration-1000 border border-[#003B00]">
            <div className="scanner-line"></div>
            <div className="absolute inset-0 bg-[#00FF41]/5 pointer-events-none group-hover:bg-[#00FF41]/20 transition-all z-10"></div>
            <iframe
              src={window.location.href}
              className="w-full h-40 sm:h-48 lg:h-56 border border-[#003B00] pointer-events-none"
              title="Live Portfolio Mirror"
            />
            <div className="absolute bottom-2 right-2 text-[8px] bg-[#020202]/80 px-2 py-1 border border-[#003B00] text-[#008F11] z-10">
              LIVE MIRROR: RECURSIVE
            </div>
          </div>
        ) : (
          // Static Image for other projects
          <div className="relative group grayscale hover:grayscale-0 transition-all duration-1000 border border-[#003B00]">
            <div className="scanner-line"></div>
            <div className="absolute inset-0 bg-[#00FF41]/10 pointer-events-none group-hover:opacity-0 transition-opacity"></div>
            <img
              src={project.imageUrl}
              alt={title}
              className="w-full h-40 sm:h-48 lg:h-56 object-cover border border-[#003B00]"
            />
            <div className="absolute bottom-2 right-2 text-[8px] bg-[#020202]/80 px-2 py-1 border border-[#003B00] text-[#008F11]">
              COORD: 37.7749N / 122.4194W
            </div>
          </div>
        )}

        <div className="border-l-4 border-[#00FF41] pl-3 sm:pl-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#00FF41] tracking-tighter matrix-text-glow">
            {title.toUpperCase()}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[#008F11] font-bold uppercase tracking-widest">
              {translate("project.assignment")}:
            </span>
            <span className="text-[10px] text-[#00FF41] bg-[#003B00] px-2 py-0.5">
              {role.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-3 bg-[#00FF41]" />
              <h3 className="text-xs font-bold text-[#00FF41] uppercase tracking-widest">
                {translate("project.briefing")}
              </h3>
            </div>
            <p className="text-sm text-[#00FF41]/90 leading-relaxed font-light">
              {description}
            </p>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-[#008F11] mb-2 uppercase tracking-widest">
              {translate("project.techStack")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 border border-[#003B00] text-[#00FF41] text-[10px] font-bold hover:bg-[#00FF41] hover:text-[#0d0208] transition-all cursor-default"
                >
                  {tech.toUpperCase()}
                </span>
              ))}
            </div>
          </section>

          {impact && (
            <section className="bg-[#003B00]/10 border border-[#00FF41]/20 p-4 relative">
              <div className="absolute -top-2 left-4 px-2 bg-[#020202] text-[10px] font-bold text-[#008F11]">
                {translate("project.impact")}
              </div>
              <p className="text-xs text-[#00FF41] italic font-medium leading-relaxed">
                "{impact}"
              </p>
            </section>
          )}

          {project.codeSnippet && (
            <section>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-bold text-[#008F11] uppercase tracking-widest">
                  {translate("project.sourceCode")}
                </h3>
                <span className="text-[8px] text-[#003B00]">CRC: OK_0xF42</span>
              </div>
              <div className="relative">
                <div className="absolute top-0 right-0 w-2 h-full bg-[#00FF41]/10"></div>
                <pre className="bg-[#020202] p-4 border border-[#003B00] text-[10px] text-[#008F11] overflow-x-auto leading-tight">
                  <code>{project.codeSnippet}</code>
                </pre>
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6 bg-[#020202] border-t border-[#003B00] flex flex-col sm:flex-row gap-2 sm:gap-4">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            onClick={(e) => {
              e.preventDefault();
              handleButtonClick("github", () => {
                window.open(project.githubUrl, "_blank");
              });
            }}
            className={`flex-1 text-center py-2.5 sm:py-3 border border-[#00FF41] text-[#00FF41] text-[10px] sm:text-xs font-bold hover:bg-[#00FF41] hover:text-[#0d0208] transition-all shadow-[0_0_10px_rgba(0,255,65,0.2)] relative overflow-hidden ${
              buttonFlash === "github" ? "animate-glitch" : ""
            }`}
          >
            <span className="relative z-10">{translate("project.downloadSrc")}</span>
            {buttonFlash === "github" && (
              <div className="absolute inset-0 bg-white animate-pulse z-0"></div>
            )}
          </a>
        )}
        {project.videoUrl ? (
          <button
            onClick={() => handleButtonClick("video", () => setShowVideoModal(true))}
            className={`flex-1 py-2.5 sm:py-3 bg-[#00FF41] text-[#0d0208] text-[10px] sm:text-xs font-bold hover:bg-white hover:shadow-[0_0_20px_#00FF41] transition-all group relative overflow-hidden ${
              buttonFlash === "video" ? "animate-glitch" : ""
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              {translate("project.watchDemo")}
            </span>
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
            {buttonFlash === "video" && (
              <div className="absolute inset-0 bg-white animate-pulse z-0"></div>
            )}
          </button>
        ) : project.demoUrl ? (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              handleButtonClick("demo", () => {
                window.open(project.demoUrl, "_blank");
              });
            }}
            className={`flex-1 text-center py-2.5 sm:py-3 bg-[#00FF41] text-[#0d0208] text-[10px] sm:text-xs font-bold hover:bg-white hover:shadow-[0_0_20px_#00FF41] transition-all group relative overflow-hidden ${
              buttonFlash === "demo" ? "animate-glitch" : ""
            }`}
          >
            <span className="relative z-10">
              {demoButtonText}
            </span>
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
            {buttonFlash === "demo" && (
              <div className="absolute inset-0 bg-white animate-pulse z-0"></div>
            )}
          </a>
        ) : (
          <button
            onClick={() => handleButtonClick("demo-disabled", () => {})}
            className={`flex-1 py-2.5 sm:py-3 bg-[#00FF41] text-[#0d0208] text-[10px] sm:text-xs font-bold hover:bg-white hover:shadow-[0_0_20px_#00FF41] transition-all group relative overflow-hidden ${
              buttonFlash === "demo-disabled" ? "animate-glitch" : ""
            }`}
          >
            <span className="relative z-10">
              {demoButtonText}
            </span>
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
            {buttonFlash === "demo-disabled" && (
              <div className="absolute inset-0 bg-white animate-pulse z-0"></div>
            )}
          </button>
        )}
      </div>

      {/* Video Modal */}
      {showVideoModal && project.videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          {/* Blur backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Modal content */}
          <div
            className="relative z-10 w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-[#00FF41] hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
            >
              <span>{translate("project.terminate")}</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video container with matrix border */}
            <div className="border-2 border-[#00FF41] shadow-[0_0_30px_rgba(0,255,65,0.4)] bg-black">
              <div className="bg-[#00FF41] px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#0d0208]/30" />
                  <div className="w-3 h-3 rounded-full bg-[#0d0208]/30" />
                  <div className="w-3 h-3 rounded-full bg-[#0d0208]/30" />
                </div>
                <span className="text-[10px] font-bold text-[#0d0208] tracking-widest uppercase ml-2">
                  VIDEO_STREAM: {project.id}
                </span>
              </div>
              <video
                src={project.videoUrl}
                controls
                autoPlay
                className="w-full aspect-video"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDisplay;
