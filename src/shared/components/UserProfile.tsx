"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useThemeStore, Theme } from "@/shared/stores/themeStore";

interface UserProfileProps {
  /** 설정 패널 열림 방향: 'down'(헤더) | 'up'(사이드바 푸터) */
  panelDirection?: "down" | "up";
  /** 회원 탈퇴 콜백 */
  onDeleteAccount?: () => void;
}

/**
 * UserProfile — 아바타 + 이름 + 설정 버튼/패널
 * NavigationBar와 ChatSidebar 푸터에서 공통으로 사용합니다.
 */
export function UserProfile({
  panelDirection = "down",
  onDeleteAccount,
}: UserProfileProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useThemeStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 설정 패널 외부 클릭 시 닫기
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSettingsOpen]);

  const handleThemeToggle = () => {
    const nextTheme: Theme =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(nextTheme);
  };

  const themeLabel = !mounted
    ? "테마"
    : theme === "light"
      ? "라이트 모드"
      : theme === "dark"
        ? "다크 모드"
        : "시스템 설정";

  const userName = user?.user_metadata?.full_name || user?.email || "사용자";
  const initials = userName.charAt(0).toUpperCase();

  const panelPositionClass =
    panelDirection === "up"
      ? "bottom-full right-0 mb-2"
      : "right-0 top-full mt-2";

  return (
    <div className="flex items-center gap-3">
      {/* 아바타 */}
      {user?.user_metadata?.avatar_url ? (
        <img
          src={user.user_metadata.avatar_url}
          alt="프로필"
          className="h-8 w-8 shrink-0 rounded-full"
          style={{
            outline: "2px solid var(--color-border-light)",
            outlineOffset: "1px",
          }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          {initials}
        </div>
      )}

      {/* 이름 */}
      <p
        className="min-w-0 flex-1 truncate text-sm font-medium"
        style={{ color: "var(--color-ink)" }}
      >
        {userName}
      </p>

      {/* 설정 버튼 + 패널 */}
      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => setIsSettingsOpen((prev) => !prev)}
          className="flex focus-ring shrink-0 rounded-lg p-1.5 transition-colors"
          style={{ color: "var(--color-ink-muted)" }}
          aria-label="설정"
          aria-expanded={isSettingsOpen}
        >
          <span
            className="material-symbols-outlined transition-transform duration-300"
            style={{
              fontSize: "20px",
              transform: isSettingsOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            settings
          </span>
        </button>

        {isSettingsOpen && (
          <div
            className={`settings-panel absolute ${panelPositionClass} w-56 overflow-hidden rounded-xl`}
            style={{
              background: "var(--color-paper)",
              border: "1px solid var(--color-border-light)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 50,
            }}
          >
            {/* 테마 전환 */}
            <button
              onClick={handleThemeToggle}
              className="settings-panel-item flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
            >
              <span className="settings-panel-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  {mounted && theme === "dark"
                    ? "dark_mode"
                    : mounted && theme === "system"
                      ? "desktop_windows"
                      : "light_mode"}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="font-medium"
                  style={{ color: "var(--color-ink)" }}
                >
                  테마
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-ink-muted)" }}
                >
                  {themeLabel}
                </p>
              </div>
            </button>

            <div
              style={{ height: "1px", background: "var(--color-border-light)" }}
            />

            {/* 회원 탈퇴 */}
            {onDeleteAccount && (
              <>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    onDeleteAccount();
                  }}
                  className="settings-panel-item flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
                >
                  <span className="settings-panel-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "16px" }}
                    >
                      person_remove
                    </span>
                  </span>
                  <p
                    className="font-medium"
                    style={{ color: "var(--color-ink)" }}
                  >
                    회원 탈퇴
                  </p>
                </button>
                <div
                  style={{
                    height: "1px",
                    background: "var(--color-border-light)",
                  }}
                />
              </>
            )}

            {/* 로그아웃 */}
            <button
              onClick={() => {
                setIsSettingsOpen(false);
                signOut();
              }}
              className="settings-panel-item flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
            >
              <span className="settings-panel-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  logout
                </span>
              </span>
              <p className="font-medium" style={{ color: "var(--color-ink)" }}>
                로그아웃
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
