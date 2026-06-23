import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassNav from "../components/petos/GlassNav";
import HeroCard from "../components/petos/HeroCard";
import PetSwitcher from "../components/petos/PetSwitcher";
import SpeechBubble from "../components/ui/SpeechBubble";
import { useShell } from "../hooks/useShell";
import {
  getCheckInStatus,
  getDailyDigest,
  type CheckInStatus,
  type DailyDigest,
} from "../lib/home.mock";
import type { Pet } from "../types";

function greet(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "早安 ☀️";
  if (h >= 12 && h < 18) return "午安 🌤️";
  return "晚安 🌙";
}

function relativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, now.getTime() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  return `${day} 天前`;
}

function speciesEmoji(species: Pet["species"]): string {
  if (species === "dog") return "🐕";
  if (species === "cat") return "🐈";
  return "🐾";
}

function petVisualOf(pet: Pet) {
  const url = pet._resolved_avatar_url || pet.avatar_url || pet.image_url;
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{ width: "100%", height: "100%", borderRadius: "9999px", objectFit: "cover" }}
      />
    );
  }
  return speciesEmoji(pet.species);
}

export default function HomePetOS() {
  const navigate = useNavigate();
  const { pets, selectedPet, selectedPetId, setPetId, nickname } = useShell();

  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPet) {
      setDigest(null);
      setCheckIn(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getDailyDigest({
        id: selectedPet.id,
        name: selectedPet.name,
        species: selectedPet.species,
        breed: selectedPet.breed,
        age: selectedPet.age,
        weight_kg: selectedPet.weight_kg,
      }),
      getCheckInStatus(selectedPet.id),
    ]).then(([d, c]) => {
      if (cancelled) return;
      setDigest(d);
      setCheckIn(c);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPet?.id]);

  const greeting = useMemo(() => greet(), []);

  if (pets.length === 0) {
    return (
      <div className="petos-page">
        <div className="petos-content">
          <GlassNav />
          <div className="petos-empty-state">
            <div className="petos-empty-state__icon" aria-hidden="true">🐾</div>
            <h2 className="petos-empty-state__title">还没添加宠物</h2>
            <p className="petos-empty-state__desc">带它来认识 PetOS 吧～</p>
            <button
              type="button"
              className="petos-cta petos-empty-state__cta"
              onClick={() => navigate("/app/pets/add")}
            >
              <span>添加我的第一个宠物</span>
              <span className="petos-cta__arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPet) return null;

  const speaksText = digest?.speaks ?? "";
  const speaksMood = digest?.speaksMood ?? "normal";
  const bubbleTime = digest?.generatedAt ? relativeTime(digest.generatedAt) : "";
  const weightDisplay = selectedPet.weight_kg ?? "--";
  const hasPhoto = checkIn?.photoToday != null;

  return (
    <div className="petos-page">
      <div className="petos-content">
        <GlassNav />

        <div className="petos-greet">
          <div className="petos-greet__hi">
            {greeting}，{nickname || "你好"}
          </div>
          <div className="petos-greet__name">
            {selectedPet.name}
            <em>。</em>
          </div>
        </div>

        {pets.length > 1 ? (
          <PetSwitcher
            pets={pets}
            selectedPetId={selectedPetId}
            onSelect={setPetId}
          />
        ) : null}

        <HeroCard score={100} unit="" statusText="状态正常" petVisual={petVisualOf(selectedPet)} />

        <div className="petos-quote">
          <div className="petos-quote__who">
            {selectedPet.name} · {bubbleTime || (loading ? "加载中" : "")}
          </div>
          {speaksText ? (
            <SpeechBubble text={speaksText} mood={speaksMood} typewriter={false} />
          ) : (
            <span style={{ color: "var(--color-text-tertiary)" }}>--</span>
          )}
        </div>

        <button type="button" className="petos-cta">
          <span>{hasPhoto ? "今日已记录" : "📸 给我留个影"}</span>
          <span className="petos-cta__arrow">→</span>
        </button>

        <div className="petos-stats">
          <div className="petos-stat petos-stat--blue">
            <div className="petos-stat__lbl">7 日体重</div>
            <div className="petos-stat__val">
              {weightDisplay}
              {selectedPet.weight_kg != null && <span className="petos-stat__unit">kg</span>}
            </div>
            <div className="petos-stat__delta">—</div>
          </div>
          <div className="petos-stat petos-stat--green">
            <div className="petos-stat__lbl">今日运动</div>
            <div className="petos-stat__val">
              35<span className="petos-stat__unit">min</span>
            </div>
            <div className="petos-stat__delta">达成 ✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}
