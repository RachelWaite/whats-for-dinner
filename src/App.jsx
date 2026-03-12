import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #FAF7F2; --warm: #F2EDE4; --terracotta: #C4622D; --terracotta-light: #E07A4A;
    --forest: #2D4A3E; --ink: #1A1A18; --muted: #8A8580; --border: #E0D8CC;
    --card: #FFFFFF; --shadow: 0 2px 16px rgba(26,26,24,0.08); --red: #D94F4F;
  }
  body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--ink); min-height: 100vh; }

  /* ── MOBILE BASE ── */
  .app { max-width: 430px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; background: var(--cream); position: relative; }
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; background: var(--card); border-top: 1px solid var(--border); display: flex; z-index: 100; }
  .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 0 6px; border: none; background: none; cursor: pointer; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.03em; text-transform: uppercase; transition: color 0.2s; }
  .nav-btn.active { color: var(--terracotta); }
  .nav-icon { font-size: 18px; line-height: 1; }
  .side-nav { display: none; }
  .page-header { padding: 52px 20px 14px; }
  .page-content { flex: 1; padding: 0 16px 100px; }

  /* ── DESKTOP RESPONSIVE ── */
  @media (min-width: 768px) {
    body { background: var(--warm); }
    .app { max-width: 100vw; flex-direction: row; background: transparent; min-height: 100vh; }
    .bottom-nav { display: none; }
    .side-nav { display: flex; flex-direction: column; width: 220px; flex-shrink: 0; background: var(--card); border-right: 1px solid var(--border); position: fixed; top: 0; left: 0; height: 100vh; padding: 28px 0 20px; box-shadow: var(--shadow); z-index: 100; overflow-y: auto; }
    .side-nav-logo { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--ink); padding: 0 22px 24px; border-bottom: 1px solid var(--border); margin-bottom: 10px; line-height: 1.3; }
    .side-nav-logo em { color: var(--terracotta); font-style: italic; }
    .side-nav-btn { display: flex; align-items: center; gap: 11px; padding: 11px 22px; border: none; background: none; cursor: pointer; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; width: 100%; text-align: left; transition: all 0.15s; border-right: 3px solid transparent; }
    .side-nav-btn:hover { background: var(--warm); color: var(--ink); }
    .side-nav-btn.active { color: var(--terracotta); background: #FDF2EC; border-right-color: var(--terracotta); }
    .side-nav-btn .nav-icon { font-size: 18px; }
    .side-nav-bottom { margin-top: auto; padding: 16px 22px 0; border-top: 1px solid var(--border); }
    .main-area { margin-left: 220px; flex: 1; min-height: 100vh; display: flex; flex-direction: column; background: var(--cream); }
    .page-header { padding: 40px 32px 16px; max-width: 1100px; }
    .page-content { padding: 0 32px 60px; }
    .modal { max-width: 520px; border-radius: 20px; margin: auto; }
    .modal-overlay { align-items: center; }
  }

  /* ── AUTH ── */
  .auth-wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 24px; background: var(--cream); }
  .auth-logo { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: var(--ink); margin-bottom: 4px; text-align: center; line-height: 1.2; }
  .auth-logo em { color: var(--terracotta); font-style: italic; }
  .auth-tagline { font-size: 13px; color: var(--muted); margin-bottom: 32px; text-align: center; }
  .auth-card { background: var(--card); border-radius: 24px; padding: 28px 24px; width: 100%; max-width: 380px; box-shadow: var(--shadow); }
  .auth-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; margin-bottom: 20px; }
  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 12px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .field input { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); outline: none; background: var(--cream); transition: border-color 0.2s; }
  .field input:focus { border-color: var(--terracotta); }
  .auth-error { background: #FEE2E2; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: var(--red); margin-bottom: 14px; }
  .auth-switch { text-align: center; margin-top: 16px; font-size: 13px; color: var(--muted); }
  .auth-switch button { background: none; border: none; color: var(--terracotta); font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; }

  /* ── BUTTONS ── */
  .btn { padding: 9px 18px; border-radius: 50px; border: none; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; justify-content: center; }
  .btn-primary { background: var(--terracotta); color: white; } .btn-primary:hover { background: var(--terracotta-light); }
  .btn-outline { background: transparent; color: var(--terracotta); border: 1.5px solid var(--terracotta); }
  .btn-ghost { background: var(--warm); color: var(--ink); }
  .btn-forest { background: var(--forest); color: white; }
  .btn-danger { background: #FEE2E2; color: var(--red); }
  .btn-sm { padding: 6px 12px; font-size: 12px; } .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-full { width: 100%; padding: 14px; font-size: 15px; border-radius: 14px; }

  /* ── INPUTS ── */
  .search-box { background: var(--card); border: 1.5px solid var(--border); border-radius: 14px; display: flex; align-items: center; gap: 10px; padding: 12px 14px; margin-bottom: 14px; box-shadow: var(--shadow); }
  .search-box input { flex: 1; border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); background: none; }
  .search-box input::placeholder { color: var(--muted); }

  /* ── CHIPS ── */
  .filter-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; margin-bottom: 14px; flex-wrap: wrap; }
  .filter-row::-webkit-scrollbar { display: none; }
  .filter-chip { white-space: nowrap; padding: 6px 13px; border-radius: 50px; border: 1.5px solid var(--border); background: var(--card); font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
  .filter-chip.active { background: var(--terracotta); border-color: var(--terracotta); color: white; }
  .filter-label { font-size: 11px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }

  /* ── RECIPE CARD ── */
  .recipe-card { background: var(--card); border-radius: 18px; margin-bottom: 14px; overflow: hidden; box-shadow: var(--shadow); }
  .recipe-card-img-wrap { position: relative; width: 100%; height: 170px; overflow: hidden; background: var(--warm); }
  .recipe-card-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .recipe-card-body { padding: 13px 15px 15px; }
  .recipe-card-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; margin-bottom: 5px; line-height: 1.25; }
  .recipe-card-meta { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
  .meta-tag { font-size: 11px; color: var(--muted); }
  .source-badge { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.92); border-radius: 50px; padding: 3px 9px; font-size: 10px; font-weight: 600; color: var(--terracotta); text-transform: uppercase; }
  .fav-badge { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.92); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 15px; cursor: pointer; border: none; }

  /* ── CUSTOM RECIPE CARD ── */
  .custom-recipe-card { background: var(--card); border-radius: 18px; margin-bottom: 14px; overflow: hidden; box-shadow: var(--shadow); border-left: 4px solid var(--forest); }
  .custom-recipe-body { padding: 14px 15px 15px; }
  .meal-type-chip { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 50px; font-size: 11px; font-weight: 600; background: var(--forest); color: white; margin-bottom: 8px; }

  /* ── EMPTY / SKELETON ── */
  .empty-state { text-align: center; padding: 50px 20px; color: var(--muted); }
  .empty-state .emoji { font-size: 44px; margin-bottom: 10px; }
  .empty-state h3 { font-family: 'Playfair Display', serif; font-size: 19px; color: var(--ink); margin-bottom: 6px; }
  .empty-state p { font-size: 13px; line-height: 1.6; }
  .skeleton { background: linear-gradient(90deg, var(--warm) 25%, var(--border) 50%, var(--warm) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 18px; height: 260px; margin-bottom: 14px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── MODAL ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(26,26,24,0.5); z-index: 200; display: flex; align-items: flex-end; justify-content: center; backdrop-filter: blur(3px); }
  .modal { background: var(--card); border-radius: 24px 24px 0 0; width: 100%; max-width: 430px; max-height: 90vh; overflow-y: auto; padding: 22px 20px 48px; animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .modal-handle { width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto 18px; }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 21px; font-weight: 700; margin-bottom: 10px; }
  .modal-img { width: 100%; height: 190px; object-fit: cover; border-radius: 14px; margin-bottom: 14px; }
  .modal-section-title { font-size: 11px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  .ingredient-list { list-style: none; }
  .ingredient-list li { padding: 7px 0; border-bottom: 1px solid var(--warm); font-size: 14px; display: flex; justify-content: space-between; gap: 12px; }
  .ingredient-list li:last-child { border-bottom: none; }

  /* ── TABS ── */
  .tab-row { display: flex; background: var(--warm); border-radius: 12px; padding: 3px; margin-bottom: 14px; }
  .tab-btn { flex: 1; padding: 7px 4px; border: none; background: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .tab-btn.active { background: var(--card); color: var(--ink); box-shadow: var(--shadow); }

  /* ── PLAN ── */
  .week-day { background: var(--card); border-radius: 16px; margin-bottom: 10px; overflow: hidden; box-shadow: var(--shadow); }
  .week-day-header { padding: 11px 15px; display: flex; justify-content: space-between; align-items: center; background: var(--warm); }
  .day-name { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; }
  .day-meals { padding: 0 15px; }
  .planned-meal { display: flex; align-items: center; gap: 11px; padding: 9px 0; border-bottom: 1px solid var(--warm); cursor: pointer; transition: opacity 0.15s; }
  .planned-meal:hover { opacity: 0.75; }
  .planned-meal:last-child { border-bottom: none; }
  .planned-meal-thumb { width: 42px; height: 42px; border-radius: 10px; background: var(--warm); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 20px; overflow: hidden; }
  .planned-meal-info { flex: 1; min-width: 0; }
  .planned-meal-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .planned-meal-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .serving-control { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
  .serving-btn { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--border); background: none; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--terracotta); font-weight: 700; }
  .serving-count { font-size: 13px; font-weight: 600; min-width: 18px; text-align: center; }
  .servings-row { display: flex; align-items: center; gap: 10px; background: var(--warm); border-radius: 12px; padding: 10px 14px; margin-bottom: 12px; }
  .servings-label { font-size: 13px; flex: 1; }
  .plan-select { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 8px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; background: var(--card); color: var(--ink); outline: none; }

  /* ── SAVED PLANS ── */
  .saved-plan-card { background: var(--card); border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow); }
  .saved-plan-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .saved-plan-meta { font-size: 12px; color: var(--muted); margin-bottom: 12px; }
  .saved-plan-preview { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 12px; }
  .plan-preview-chip { background: var(--warm); border-radius: 6px; padding: 3px 8px; font-size: 11px; color: var(--ink); }
  .saved-plan-actions { display: flex; gap: 8px; }
  .save-plan-bar { background: var(--card); border-radius: 14px; padding: 14px; margin-bottom: 14px; box-shadow: var(--shadow); display: flex; gap: 10px; align-items: center; }
  .save-plan-bar input { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 9px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); outline: none; background: var(--cream); }
  .save-plan-bar input:focus { border-color: var(--terracotta); }

  /* ── SHOPPING ── */
  .shopping-item { display: flex; align-items: center; gap: 11px; padding: 10px 13px; background: var(--card); border-radius: 12px; margin-bottom: 6px; box-shadow: var(--shadow); cursor: pointer; transition: opacity 0.2s; }
  .shopping-item.checked { opacity: 0.4; }
  .shopping-item.checked .item-name { text-decoration: line-through; }
  .check-box { width: 22px; height: 22px; border-radius: 6px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 13px; transition: all 0.2s; }
  .check-box.checked { background: var(--forest); border-color: var(--forest); color: white; }
  .item-name { flex: 1; font-size: 14px; }
  .item-qty { font-size: 12px; color: var(--muted); text-align: right; }
  .shop-category-header { display: flex; align-items: center; gap: 8px; margin: 18px 0 8px; }
  .shop-category-label { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; }
  .shop-category-line { flex: 1; height: 1px; background: var(--border); }
  .custom-item-box { background: var(--card); border: 1.5px solid var(--border); border-radius: 14px; display: flex; align-items: center; gap: 10px; padding: 10px 14px; margin-bottom: 16px; box-shadow: var(--shadow); }
  .custom-item-box input { flex: 1; border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); background: none; }
  .custom-item-box input::placeholder { color: var(--muted); }
  .add-item-btn { background: var(--terracotta); color: white; border: none; border-radius: 10px; padding: 7px 13px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
  .custom-badge { font-size: 10px; background: var(--warm); color: var(--muted); border-radius: 4px; padding: 2px 5px; font-weight: 500; margin-left: 4px; }
  .remove-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 16px; padding: 0 2px; flex-shrink: 0; }

  /* ── MISC ── */
  .stat-row { display: flex; gap: 10px; margin-bottom: 14px; }
  .stat-box { flex: 1; background: var(--card); border-radius: 13px; padding: 12px; text-align: center; box-shadow: var(--shadow); }
  .stat-num { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: var(--terracotta); }
  .stat-lbl { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
  .divider { height: 1px; background: var(--border); margin: 13px 0; }
  .category-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .category-card { background: var(--card); border-radius: 13px; padding: 13px; text-align: center; box-shadow: var(--shadow); cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
  .category-card.active { border-color: var(--terracotta); background: #FDF2EC; }
  .cat-emoji { font-size: 26px; margin-bottom: 5px; }
  .cat-name { font-size: 12px; font-weight: 500; }
  .yt-btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 15px; background: #FF0000; color: white; border: none; border-radius: 50px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; margin-bottom: 10px; text-decoration: none; }
  .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: var(--ink); color: white; padding: 10px 20px; border-radius: 50px; font-size: 13px; font-weight: 500; z-index: 300; animation: toastIn 0.3s ease; white-space: nowrap; }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  .user-row { display: flex; align-items: center; gap: 10px; background: var(--warm); border-radius: 14px; padding: 12px 14px; margin-top: 8px; }
  .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--terracotta); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 36px; background: var(--cream); }
  .page-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; line-height: 1.1; }
  .page-title em { font-style: italic; color: var(--terracotta); }
  .page-subtitle { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .section-divider { display: flex; align-items: center; gap: 8px; margin: 18px 0 10px; }
  .section-divider span { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: var(--ink); }
  .section-divider-line { flex: 1; height: 1px; background: var(--border); }
  .form-label { display: block; font-size: 11px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; margin-top: 14px; }
  .form-input { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 11px 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); outline: none; background: var(--cream); transition: border-color 0.2s; }
  .form-input:focus { border-color: var(--terracotta); }
  .form-textarea { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 11px 14px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); outline: none; background: var(--cream); resize: vertical; min-height: 80px; transition: border-color 0.2s; }
  .form-textarea:focus { border-color: var(--terracotta); }
  .ingredient-input-row { display: flex; gap: 8px; margin-bottom: 8px; }
  .ingredient-input-row input { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 9px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); outline: none; background: var(--cream); }
  .ingredient-input-row input:focus { border-color: var(--terracotta); }
  .meal-type-selector { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
  .meal-type-btn { padding: 6px 14px; border-radius: 50px; border: 1.5px solid var(--border); background: var(--card); font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.2s; }
  .meal-type-btn.active { background: var(--forest); border-color: var(--forest); color: white; }
  .results-count { font-size: 12px; color: var(--muted); margin-bottom: 12px; font-style: italic; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const CATEGORIES = [
  {name:"breakfast",emoji:"🍳"},{name:"lunch",emoji:"🥪"},
  {name:"dinner",emoji:"🍽️"},{name:"snack",emoji:"🍎"},
  {name:"teatime",emoji:"🫖"},
];
const AREAS = ["American","Asian","British","Caribbean","Central Europe","Chinese","Eastern Europe","French","Indian","Italian","Japanese","Kosher","Mediterranean","Mexican","Middle Eastern","Nordic","South American","South East Asian"];
const SPOON_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY;
const SPOON = "/api/spoonacular";
const EMPTY_PLAN = () => { const p={}; DAYS.forEach(d=>p[d]=[]); return p; };
const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snack","School Lunchbox","Other"];
const MEAL_TYPE_EMOJI = {Breakfast:"🍳",Lunch:"🥪",Dinner:"🍽️",Snack:"🍎","School Lunchbox":"🎒",Other:"✨"};
const NAV_ITEMS = [
  {id:"home",icon:"🏠",label:"Home"},
  {id:"search",icon:"🔍",label:"Search"},
  {id:"favs",icon:"❤️",label:"Recipes"},
  {id:"savedplans",icon:"📋",label:"Plans"},
  {id:"plan",icon:"📅",label:"This Week"},
  {id:"shop",icon:"🛒",label:"Shop"},
  {id:"settings",icon:"⚙️",label:"Settings"},
];

// ─────────────────────────────────────────────────────────────────────────────
// EDAMAM API (via Firebase Cloud Function proxy)
// ─────────────────────────────────────────────────────────────────────────────
const FUNCTIONS_BASE = import.meta.env.DEV
  ? "http://127.0.0.1:5001/whats-for-dinner-ab2c4/us-central1"
  : "https://us-central1-whats-for-dinner-ab2c4.cloudfunctions.net";

function parseEdamamRecipe(r) {
  const recipe = r.recipe || r;
  const ingredients = (recipe.ingredients||[]).map(i=>({ name:i.food||"", amount:`${i.quantity?Number(i.quantity).toFixed(1):""} ${i.measure&&i.measure!=="<unit>"?i.measure:""}`.trim() }));
  const nutrition = recipe.totalNutrients ? {
    calories: Math.round(recipe.calories||0),
    protein:  Math.round(recipe.totalNutrients.PROCNT?.quantity||0),
    carbs:    Math.round(recipe.totalNutrients.CHOCDF?.quantity||0),
    fat:      Math.round(recipe.totalNutrients.FAT?.quantity||0),
    fiber:    Math.round(recipe.totalNutrients.FIBTG?.quantity||0),
    sugar:    Math.round(recipe.totalNutrients.SUGAR?.quantity||0),
  } : null;
  const id = (r._links?.self?.href || recipe.uri || "").split("#recipe_").pop();
  return {
    id,
    title: recipe.label||"",
    cuisine: recipe.cuisineType?.[0]||"",
    category: recipe.mealType?.[0]||recipe.dishType?.[0]||"",
    image: recipe.image||"",
    url: recipe.url||"",
    source: "Edamam",
    ingredients,
    steps: [],
    servings: recipe.yield||4,
    readyInMinutes: recipe.totalTime||null,
    nutrition,
  };
}
async function edamamSearch({query,ingredient,cuisine,mealType,maxResults=20}) {
  const params = new URLSearchParams({ from:0, to:maxResults });
  if(query) params.set("q", query);
  else params.set("q", ingredient||cuisine||mealType||"");
  if(cuisine) params.set("cuisineType", cuisine);
  if(mealType) params.set("mealType", mealType);
  const r = await fetch(`${FUNCTIONS_BASE}/edamamSearch?${params}`);
  const d = await r.json();
  if(d.error) throw new Error(d.error);
  return (d.hits||[]).map(parseEdamamRecipe);
}
async function edamamFetchById(id) {
  const r = await fetch(`${FUNCTIONS_BASE}/edamamById?id=${encodeURIComponent(id)}`);
  const d = await r.json();
  if(d.error) throw new Error(d.error);
  return parseEdamamRecipe(d);
}

// ─────────────────────────────────────────────────────────────────────────────
// QUANTITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function scaleAmount(str, ratio) {
  if (!str || ratio === 1) return str || "";
  return str.replace(/[\d.\/]+/g, n => { const v=n.includes("/")?n.split("/").reduce((a,b)=>parseFloat(a)/parseFloat(b)):parseFloat(n); const s=v*ratio; return s%1===0?s:s.toFixed(1); });
}
const UNIT_ALIASES = { g:["g","gram","grams"],kg:["kg","kilogram","kilograms"],ml:["ml","milliliter","millilitre","milliliters","millilitres"],l:["l","liter","litre","liters","litres"],tsp:["tsp","teaspoon","teaspoons","t"],tbsp:["tbsp","tablespoon","tablespoons","tbs","tb"],cup:["cup","cups","c"],oz:["oz","ounce","ounces"],lb:["lb","lbs","pound","pounds"] };
const UNIT_TO_CANONICAL = {};
Object.entries(UNIT_ALIASES).forEach(([c,a])=>a.forEach(x=>UNIT_TO_CANONICAL[x.toLowerCase()]=c));
const TO_BASE = {kg:[1000,"g"],l:[1000,"ml"],tbsp:[3,"tsp"],cup:[48,"tsp"],oz:[28.35,"g"],lb:[453.6,"g"]};
function parseAmount(str) {
  if (!str) return null; str = str.trim();
  const fm=str.match(/^(\d+\s+)?(\d+)\/(\d+)/); let value=0,rest=str;
  if (fm) { value=(fm[1]?parseInt(fm[1]):0)+parseInt(fm[2])/parseInt(fm[3]); rest=str.slice(fm[0].length).trim(); }
  else { const nm=str.match(/^[\d.]+/); if(nm){value=parseFloat(nm[0]);rest=str.slice(nm[0].length).trim();}else return null; }
  const wm=rest.match(/^([a-zA-Z]+)/); const rawUnit=wm?wm[1].toLowerCase():""; const unit=UNIT_TO_CANONICAL[rawUnit]||rawUnit;
  return {value,unit};
}
function combineAmounts(amountStrings) {
  const buckets={},unparsed=[];
  amountStrings.forEach(str=>{ const p=parseAmount(str); if(!p||p.value===0){if(str)unparsed.push(str);return;} let{value,unit}=p; if(TO_BASE[unit]){value*=TO_BASE[unit][0];unit=TO_BASE[unit][1];} buckets[unit]=(buckets[unit]||0)+value; });
  const parts=Object.entries(buckets).map(([unit,total])=>{ let display=total,displayUnit=unit; if(unit==="g"&&total>=1000){display=total/1000;displayUnit="kg";} if(unit==="ml"&&total>=1000){display=total/1000;displayUnit="l";} if(unit==="tsp"&&total>=48){display=total/48;displayUnit="cup";}else if(unit==="tsp"&&total>=3){display=total/3;displayUnit="tbsp";} const rounded=display%1===0?display:parseFloat(display.toFixed(1)); return displayUnit?`${rounded} ${displayUnit}`:`${rounded}`; });
  return [...parts,...unparsed].join(" + ")||amountStrings.join(" + ");
}

// ─────────────────────────────────────────────────────────────────────────────
// GROCERY CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
const GROCERY_CATEGORIES = [
  {key:"produce",label:"Fruit & Veg",emoji:"🥦",keywords:["onion","garlic","tomato","potato","carrot","celery","pepper","capsicum","zucchini","courgette","spinach","lettuce","cabbage","mushroom","leek","broccoli","cauliflower","cucumber","eggplant","aubergine","pumpkin","squash","sweet potato","corn","pea","bean","lemon","lime","orange","apple","banana","avocado","ginger","chilli","chili","herb","parsley","coriander","cilantro","basil","thyme","rosemary","mint","spring onion","scallion","beetroot","radish","asparagus","kale","chard","fennel","mango","pineapple","strawberry","blueberry","raspberry","grape","watermelon","peach","plum","cherry"]},
  {key:"meat",label:"Meat & Seafood",emoji:"🥩",keywords:["chicken","beef","lamb","pork","mince","steak","bacon","sausage","prosciutto","ham","turkey","duck","veal","liver","kidney","fish","salmon","tuna","cod","prawn","shrimp","crab","lobster","mussel","clam","squid","octopus","anchovy","sardine","sea bass","tilapia","trout","snapper","meatball","chorizo","pancetta"]},
  {key:"dairy",label:"Dairy & Eggs",emoji:"🧀",keywords:["milk","cream","butter","cheese","yogurt","yoghurt","egg","parmesan","mozzarella","cheddar","feta","ricotta","brie","gouda","mascarpone","sour cream","creme fraiche","ghee","whipping cream","double cream","single cream"]},
  {key:"bakery",label:"Bakery & Bread",emoji:"🍞",keywords:["bread","flour","yeast","bun","roll","pita","tortilla","wrap","crouton","breadcrumb","sourdough","baguette","ciabatta","naan","roti","pasta","noodle","spaghetti","penne","fettuccine","linguine","lasagne","rice noodle","udon","soba"]},
  {key:"grocery",label:"Grocery & Pantry",emoji:"🛒",keywords:[]},
];
function categoriseIngredient(name) { const lower=name.toLowerCase(); for(const cat of GROCERY_CATEGORIES){if(cat.key==="grocery")continue;if(cat.keywords.some(k=>lower.includes(k)))return cat.key;} return "grocery"; }

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const userDoc = (uid, path) => doc(db, "users", uid, ...path.split("/"));
async function fsGet(uid, path) { try { const snap=await getDoc(userDoc(uid,path)); return snap.exists()?snap.data():null; } catch { return null; } }
async function fsSet(uid, path, data) { try { await setDoc(userDoc(uid,path), data); } catch(e) { console.error(e); } }
async function fsGetCollection(uid, path) { try { const snap=await getDocs(collection(db,"users",uid,...path.split("/"))); return snap.docs.map(d=>({id:d.id,...d.data()})); } catch { return []; } }
async function fsAddToCollection(uid, path, data) { try { const ref=await addDoc(collection(db,"users",uid,...path.split("/")), {...data,createdAt:serverTimestamp()}); return ref.id; } catch(e) { console.error(e); return null; } }
async function fsDeleteDoc(uid, path) { try { await deleteDoc(userDoc(uid,path)); } catch(e) { console.error(e); } }

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => { const u=onAuthStateChanged(auth,u=>setUser(u||null)); return u; }, []);
  if (user===undefined) return <div className="loading-screen"><style>{css}</style>🍽️</div>;
  if (!user) return <><style>{css}</style><AuthScreen/></>;
  return <><style>{css}</style><MainApp user={user}/></>;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState("");
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const friendly = code => ({ "auth/email-already-in-use":"An account with this email already exists.", "auth/invalid-email":"Please enter a valid email address.", "auth/weak-password":"Password must be at least 6 characters.", "auth/user-not-found":"No account found with that email.", "auth/wrong-password":"Incorrect password — please try again.", "auth/invalid-credential":"Incorrect email or password.", "auth/too-many-requests":"Too many attempts. Please try again later." }[code] || "Something went wrong — please try again.");
  const submit = async () => {
    setError(""); setLoading(true);
    if (!email||!password){setError("Please fill in all fields.");setLoading(false);return;}
    try { if(mode==="register"){if(password!==confirm){setError("Passwords don't match.");setLoading(false);return;} await createUserWithEmailAndPassword(auth,email,password);}else{await signInWithEmailAndPassword(auth,email,password);} } catch(e){setError(friendly(e.code));}
    setLoading(false);
  };
  return (
    <div className="auth-wrap">
      <div className="auth-logo">What's for <em>Dinner?</em></div>
      <div className="auth-tagline">Plan smarter. Never ask again.</div>
      <div className="auth-card">
        <div className="auth-title">{mode==="login"?"Welcome back 👋":"Create your account"}</div>
        {error&&<div className="auth-error">{error}</div>}
        <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        {mode==="register"&&<div className="field"><label>Confirm Password</label><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>}
        <button className="btn btn-primary btn-full" onClick={submit} disabled={loading} style={{marginTop:4}}>{loading?"Please wait…":mode==="login"?"Sign In":"Create Account"}</button>
        <div className="auth-switch">{mode==="login"?<>Don't have an account? <button onClick={()=>{setMode("register");setError("");}}>Sign up free</button></>:<>Already have an account? <button onClick={()=>{setMode("login");setError("");}}>Sign in</button></>}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
function MainApp({ user }) {
  const uid = user.uid;
  const [tab,setTab]=useState("home");
  const todayName = DAYS[new Date().getDay()===0?6:new Date().getDay()-1];
  const [defaultServings,setDefaultServings]=useState(4);
  const [favourites,setFavourites]=useState([]);
  const [customRecipes,setCustomRecipes]=useState([]);
  const [mealPlan,setMealPlan]=useState(EMPTY_PLAN());
  const [savedPlans,setSavedPlans]=useState([]);
  const [customItems,setCustomItems]=useState([]);
  const [checked,setChecked]=useState({});
  const [recipes,setRecipes]=useState([]);
  const [loading,setLoading]=useState(false);
  const [dataLoading,setDataLoading]=useState(true);
  // Search state
  const [searchMode,setSearchMode]=useState("keyword");
  const [query,setQuery]=useState("");
  const [ingredientQuery,setIngredientQuery]=useState("");
  const [activeCategory,setActiveCategory]=useState("");
  const [activeArea,setActiveArea]=useState("");
  const [maxResults,setMaxResults]=useState(20);
  const [nutritionDisplay,setNutritionDisplay]=useState("calories"); // "none","calories","full"
  // Modals
  const [selected,setSelected]=useState(null);
  const [showCustomForm,setShowCustomForm]=useState(false);
  const [editingRecipe,setEditingRecipe]=useState(null);
  const [editingSavedPlan,setEditingSavedPlan]=useState(null);
  const [newPlanSeed,setNewPlanSeed]=useState(null);
  const [recipePrefs,setRecipePrefs]=useState({});
  const [archivePrompt,setArchivePrompt]=useState(null); // {plan, suggestedName}
  const [toast,setToast]=useState(null);

  // Returns the Monday date string for the current week e.g. "2026-03-09"
  const getWeekStamp = () => { const d=new Date(); const day=d.getDay(); const diff=d.getDate()-(day===0?6:day-1); const mon=new Date(d.setDate(diff)); return mon.toISOString().split("T")[0]; };
  const getWeekLabel = stamp => { const d=new Date(stamp+"T00:00:00"); return `Week of ${d.toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})}`; };

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),2400); };

  useEffect(()=>{ (async()=>{ setDataLoading(true); const[f,p,sp,ci,cr,settings,prefs]=await Promise.all([fsGet(uid,"data/favourites"),fsGet(uid,"data/mealPlan"),fsGetCollection(uid,"savedPlans"),fsGet(uid,"data/customItems"),fsGetCollection(uid,"customRecipes"),fsGet(uid,"data/settings"),fsGet(uid,"data/recipePrefs")]); if(f?.items)setFavourites(f.items); if(sp.length)setSavedPlans(sp.sort((a,b)=>(b.savedAt?.seconds||0)-(a.savedAt?.seconds||0))); if(ci?.items)setCustomItems(ci.items); if(cr.length)setCustomRecipes(cr.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))); if(settings?.maxResults)setMaxResults(settings.maxResults); if(settings?.defaultServings)setDefaultServings(settings.defaultServings); if(settings?.nutritionDisplay)setNutritionDisplay(settings.nutritionDisplay); if(prefs?.map)setRecipePrefs(prefs.map);
    // Check if week has changed — auto-archive old plan if so
    const currentStamp=getWeekStamp();
    if(p?.plan&&p?.weekStamp&&p.weekStamp!==currentStamp){
      const hasMeals=Object.values(p.plan).some(d=>d.length>0);
      if(hasMeals){ setArchivePrompt({plan:p.plan,suggestedName:getWeekLabel(p.weekStamp)}); }
      // Reset this week regardless
      await fsSet(uid,"data/mealPlan",{plan:EMPTY_PLAN(),weekStamp:currentStamp});
      setMealPlan(EMPTY_PLAN());
    } else {
      if(p?.plan)setMealPlan(p.plan);
      // Stamp the week if not yet stamped
      if(p&&!p.weekStamp){ await fsSet(uid,"data/mealPlan",{plan:p.plan||EMPTY_PLAN(),weekStamp:currentStamp}); }
    }
    setDataLoading(false); })(); },[uid]);

  const confirmArchive = async (name) => {
    if(!name.trim()){setArchivePrompt(null);return;}
    const totalMeals=Object.values(archivePrompt.plan).reduce((s,d)=>s+d.length,0);
    const id=await fsAddToCollection(uid,"savedPlans",{name:name.trim(),plan:archivePrompt.plan,mealCount:totalMeals,archived:true});
    if(id){ setSavedPlans(prev=>[{id,name:name.trim(),plan:archivePrompt.plan,mealCount:totalMeals,savedAt:{seconds:Date.now()/1000},archived:true},...prev]); showToast(`📦 Last week archived as "${name.trim()}"`); }
    setArchivePrompt(null);
  };
  const saveFavs = async v => { setFavourites(v); await fsSet(uid,"data/favourites",{items:v}); };
  const saveDefaultServings = async v => { setDefaultServings(v); await fsSet(uid,"data/settings",{maxResults,defaultServings:v}); };
  const saveRecipePref = async (recipeId, mealType) => { const updated={...recipePrefs,[recipeId]:mealType}; setRecipePrefs(updated); await fsSet(uid,"data/recipePrefs",{map:updated}); };
  const savePlan = async v => { setMealPlan(v); await fsSet(uid,"data/mealPlan",{plan:v,weekStamp:getWeekStamp()}); };
  const saveCustomItems = async v => { setCustomItems(v); await fsSet(uid,"data/customItems",{items:v}); };
  const saveMaxResults = async v => { setMaxResults(v); await fsSet(uid,"data/settings",{maxResults:v,defaultServings,nutritionDisplay}); };
  const saveNutritionDisplay = async v => { setNutritionDisplay(v); await fsSet(uid,"data/settings",{maxResults,defaultServings,nutritionDisplay:v}); };
  const isFav = id => favourites.some(f=>f.id===id);
  const toggleFav = recipe => { if(isFav(recipe.id)){saveFavs(favourites.filter(f=>f.id!==recipe.id));showToast("Removed from saved recipes");}else{saveFavs([...favourites,recipe]);showToast("❤️ Saved to recipes!");} };
  const addToPlan = (recipe,day,servings) => { const s=servings??recipe.servings??defaultServings; savePlan({...mealPlan,[day]:[...mealPlan[day],{...recipe,plannedServings:s}]}); showToast(`✅ Added to this week's plan!`); };
  const addToExistingPlan = async (savedPlan, recipe, days) => {
    const updated = JSON.parse(JSON.stringify(savedPlan.plan));
    days.forEach(day => { updated[day]=[...updated[day],{...recipe,plannedServings:recipe.servings??defaultServings}]; });
    const totalMeals=Object.values(updated).reduce((s,d)=>s+d.length,0);
    await setDoc(doc(db,"users",uid,"savedPlans",savedPlan.id),{name:savedPlan.name,plan:updated,mealCount:totalMeals,savedAt:serverTimestamp()},{merge:true});
    setSavedPlans(prev=>prev.map(p=>p.id===savedPlan.id?{...p,plan:updated,mealCount:totalMeals}:p));
    showToast(`✅ Added to "${savedPlan.name}"!`);
  };
  const removeFromPlan = (day,idx) => savePlan({...mealPlan,[day]:mealPlan[day].filter((_,i)=>i!==idx)});
  const updateServings = (day,idx,delta) => { const u={...mealPlan}; u[day][idx]={...u[day][idx],plannedServings:Math.max(1,u[day][idx].plannedServings+delta)}; savePlan(u); };
  const clearPlan = () => savePlan(EMPTY_PLAN());
  const saveCurrentPlan = async name => {
    if(!name.trim())return;
    const totalMeals=Object.values(mealPlan).reduce((s,d)=>s+d.length,0);
    if(!totalMeals){showToast("Add some meals to the plan first!");return;}
    const id=await fsAddToCollection(uid,"savedPlans",{name:name.trim(),plan:mealPlan,mealCount:totalMeals});
    if(id){setSavedPlans(prev=>[{id,name:name.trim(),plan:mealPlan,mealCount:totalMeals,savedAt:{seconds:Date.now()/1000}},...prev]);showToast(`✅ "${name.trim()}" saved!`);}
  };
  const loadSavedPlan = sp => { savePlan(sp.plan); showToast(`📅 "${sp.name}" loaded!`); setTab("plan"); };
  const deleteSavedPlan = async id => { await fsDeleteDoc(uid,`savedPlans/${id}`); setSavedPlans(prev=>prev.filter(p=>p.id!==id)); showToast("Plan deleted"); };
  const saveSavedPlanEdits = async (id, updatedPlan, name) => { const totalMeals=Object.values(updatedPlan).reduce((s,d)=>s+d.length,0); await setDoc(doc(db,"users",uid,"savedPlans",id),{name,plan:updatedPlan,mealCount:totalMeals,savedAt:serverTimestamp()},{merge:true}); setSavedPlans(prev=>prev.map(p=>p.id===id?{...p,name,plan:updatedPlan,mealCount:totalMeals}:p)); setEditingSavedPlan(null); showToast("✅ Plan updated!"); };
  const saveCustomRecipe = async recipe => { const id=await fsAddToCollection(uid,"customRecipes",recipe); if(id){setCustomRecipes(prev=>[{...recipe,id,createdAt:{seconds:Date.now()/1000}},...prev]);showToast("✅ Custom recipe saved!");setShowCustomForm(false);} };
  const deleteCustomRecipe = async id => { await fsDeleteDoc(uid,`customRecipes/${id}`); setCustomRecipes(prev=>prev.filter(r=>r.id!==id)); showToast("Recipe deleted"); };
  const editCustomRecipe = async (id, updated) => { await setDoc(doc(db,"users",uid,"customRecipes",id),{...updated,updatedAt:serverTimestamp()},{merge:true}); setCustomRecipes(prev=>prev.map(r=>r.id===id?{...r,...updated}:r)); setEditingRecipe(null); showToast("✅ Recipe updated!"); };
  const addCustomItem = v => { if(!v.trim())return; saveCustomItems([...customItems,{id:Date.now().toString(),name:v.trim()}]); };
  const removeCustomItem = id => saveCustomItems(customItems.filter(i=>i.id!==id));

  const handleSearch = async () => {
    setLoading(true); setRecipes([]);
    try {
      let results=[];
      if(searchMode==="keyword"&&query.trim()){
        results=await edamamSearch({query:query.trim(),maxResults});
      } else if(searchMode==="ingredient"&&ingredientQuery.trim()){
        results=await edamamSearch({ingredient:ingredientQuery.trim(),maxResults});
      } else if(searchMode==="category"&&activeCategory){
        results=await edamamSearch({mealType:activeCategory.toLowerCase(),maxResults});
      } else if(searchMode==="cuisine"&&activeArea){
        results=await edamamSearch({cuisine:activeArea.toLowerCase(),maxResults});
      }
      setRecipes(results);
      if(!results.length) showToast("No recipes found — try something else!");
    } catch(e){
      console.error(e);
      const msg = e.message?.includes("quota") ? "Monthly API limit reached!" : "Search failed — please try again";
      showToast(msg);
    }
    setLoading(false);
  };

  const totalMeals = Object.values(mealPlan).reduce((s,d)=>s+d.length,0);
  const shoppingList = (() => {
    const map={};
    Object.values(mealPlan).forEach(meals=>meals.forEach(meal=>{ const ratio=meal.plannedServings/meal.servings; meal.ingredients.forEach(ing=>{ const key=ing.name.toLowerCase().trim(); if(!map[key])map[key]={name:ing.name,rawAmounts:[],category:categoriseIngredient(ing.name)}; map[key].rawAmounts.push(scaleAmount(ing.amount,ratio)); }); }));
    return Object.values(map).map(item=>({...item,displayAmount:combineAmounts(item.rawAmounts)})).sort((a,b)=>a.name.localeCompare(b.name));
  })();
  const shoppingByCategory = GROCERY_CATEGORIES.map(cat=>({...cat,items:shoppingList.filter(i=>i.category===cat.key)})).filter(cat=>cat.items.length>0);

  if (dataLoading) return <div className="loading-screen">🍽️</div>;

  const pages = (
    <>
      {toast&&<div className="toast">{toast}</div>}

      {/* ── HOME ── */}
      {tab==="home"&&<>
        <div className="page-header">
          <div className="page-title">What's for <em>dinner?</em></div>
          <div className="page-subtitle">{new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
        <div className="page-content">
          {totalMeals===0?(
            // Empty state — no plan set
            <div style={{textAlign:"center",paddingTop:20}}>
              <div style={{fontSize:56,marginBottom:12}}>🍽️</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:8}}>No meals planned yet</h3>
              <p style={{color:"var(--muted)",fontSize:14,marginBottom:28,lineHeight:1.6}}>Search for recipes to try, or load one of your saved weekly plans to get started.</p>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <button className="btn btn-primary btn-full" onClick={()=>setTab("search")}>🔍 Search Recipes</button>
                <button className="btn btn-forest btn-full" onClick={()=>setTab("savedplans")}>📋 Select a Saved Plan</button>
              </div>
            </div>
          ):(
            <>
              {/* Today highlight */}
              <div style={{background:"var(--terracotta)",borderRadius:16,padding:"16px 18px",marginBottom:20,color:"#fff"}}>
                <div style={{fontSize:12,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",opacity:0.85,marginBottom:10}}>Today · {todayName}</div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>Today's Meals</div>
                {["Breakfast","Lunch","School Lunchbox","Dinner","Other"].map(type=>{
                  const meals=(mealPlan[todayName]||[]).filter(m=>(m.mealType||"Other")===type);
                  return(
                    <div key={type} style={{marginBottom:10}}>
                      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",opacity:0.75,marginBottom:4}}>{MEAL_TYPE_EMOJI[type]} {type}</div>
                      {meals.length>0?meals.map((meal,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"8px 10px",marginBottom:i<meals.length-1?6:0,cursor:"pointer"}} onClick={()=>setSelected(meal)}>
                          {meal.image&&<img src={meal.image} alt={meal.title} style={{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{meal.title}</div>
                            {meal.mealType==="School Lunchbox"&&meal.lunchboxContents&&<div style={{fontSize:11,opacity:0.85,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{meal.lunchboxContents}</div>}
                          </div>
                        </div>
                      )):(
                        <div style={{fontSize:12,opacity:0.65,fontStyle:"italic"}}>None selected</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rest of the week — compact */}
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,marginBottom:12}}>This <em>week</em></div>
              {DAYS.filter(d=>d!==todayName).map(day=>(
                <div key={day} style={{marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{day}</div>
                  {mealPlan[day]&&mealPlan[day].length>0?(
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {mealPlan[day].map((meal,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"var(--card)",borderRadius:10,padding:"8px 10px",boxShadow:"var(--shadow)",cursor:"pointer"}} onClick={()=>setSelected(meal)}>
                          {meal.image&&<img src={meal.image} alt={meal.title} style={{width:34,height:34,borderRadius:7,objectFit:"cover",flexShrink:0}}/>}
                          <div style={{flex:1,minWidth:0,fontSize:13,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{meal.title}</div>
                        </div>
                      ))}
                    </div>
                  ):(
                    <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",paddingLeft:2}}>Nothing planned</div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </>}

      {/* ── SEARCH ── */}
      {tab==="search"&&<>
        <div className="page-header">
          <div className="page-title">What's for <em>dinner?</em></div>
          <div className="page-subtitle">300,000+ recipes — search, filter, discover</div>
        </div>
        <div className="page-content">

          {/* Search mode tabs — 5 modes */}
          <div className="tab-row">
            {[["keyword","🔍 Keyword"],["ingredient","🥬 Ingredient"],["category","🗂 Category"],["cuisine","🌍 Cuisine"]].map(([m,l])=>(
              <button key={m} className={`tab-btn ${searchMode===m?"active":""}`} onClick={()=>setSearchMode(m)}>{l}</button>
            ))}
          </div>

          {/* Search input per mode */}
          {searchMode==="keyword"&&<div className="search-box"><span>🔍</span><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()} placeholder="e.g. chicken tikka, pasta, stir fry…"/></div>}

          {searchMode==="ingredient"&&(
            <div>
              <div className="search-box">
                <span>🥬</span>
                <input value={ingredientQuery} onChange={e=>setIngredientQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()} placeholder="e.g. aubergine, salmon, chickpeas…"/>
                {ingredientQuery&&<button onClick={()=>setIngredientQuery("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:16}}>✕</button>}
              </div>
              <div style={{background:"var(--warm)",borderRadius:12,padding:"10px 14px",fontSize:12,color:"var(--muted)",marginBottom:14,lineHeight:1.5}}>
                💡 Got half an aubergine in the fridge? Find every recipe that uses it — great for using up what you've got.
              </div>
              <div style={{marginBottom:10}}>
                <div className="filter-label">Popular picks</div>
                <div className="filter-row">
                  {["Chicken","Salmon","Aubergine","Chickpeas","Spinach","Mushroom","Sweet Potato","Lemon","Coconut Milk","Halloumi"].map(ing=>(
                    <button key={ing} className={`filter-chip ${ingredientQuery===ing?"active":""}`} onClick={()=>setIngredientQuery(v=>v===ing?"":ing)}>{ing}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {searchMode==="category"&&<div className="category-grid">{CATEGORIES.map(c=><div key={c.name} className={`category-card ${activeCategory===c.name?"active":""}`} onClick={()=>setActiveCategory(v=>v===c.name?"":c.name)}><div className="cat-emoji">{c.emoji}</div><div className="cat-name">{c.name}</div></div>)}</div>}
          {searchMode==="cuisine"&&<><div className="filter-label">Select a cuisine</div><div className="filter-row">{AREAS.map(a=><button key={a} className={`filter-chip ${activeArea===a?"active":""}`} onClick={()=>setActiveArea(v=>v===a?"":a)}>{a}</button>)}</div></>}

          <div style={{display:"flex",alignItems:"center",gap:10,background:"var(--warm)",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
            <span style={{fontSize:13,flex:1,color:"var(--muted)"}}>Max results per search</span>
            <select className="plan-select" style={{maxWidth:80,flex:"none"}} value={maxResults} onChange={e=>saveMaxResults(Number(e.target.value))}>
              {[8,12,16,20,30,50].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <button className="btn btn-primary btn-full" style={{marginBottom:18}} onClick={handleSearch} disabled={loading}>{loading?"Searching…":"Search Recipes"}</button>

          {loading&&<><div className="skeleton"/><div className="skeleton"/></>}

          {!loading&&recipes.length>0&&(
            <div className="results-count">{recipes.length} recipe{recipes.length!==1?"s":""} found</div>
          )}

          {!loading&&!recipes.length&&<div className="empty-state"><div className="emoji">🍳</div><h3>What are you craving?</h3><p>Search by keyword, find recipes using a specific ingredient, browse by category, or explore a cuisine</p></div>}

          {recipes.map(r=><RecipeCard key={r.id} recipe={r} isFav={isFav(r.id)} onFav={()=>toggleFav(r)} onView={()=>setSelected(r)} onAddToThisWeek={(selDays,mealType)=>selDays.forEach(d=>addToPlan({...r,mealType},d))} onAddToNewPlan={(selDays,mealType)=>{ const seed=EMPTY_PLAN(); selDays.forEach(d=>seed[d]=[{...r,mealType,plannedServings:r.servings??defaultServings}]); setNewPlanSeed({plan:seed}); }} onAddToExistingPlan={(sp,selDays,mealType)=>addToExistingPlan(sp,{...r,mealType},selDays)} savedPlans={savedPlans} days={DAYS} savedMealType={recipePrefs[r.id]} onSaveMealType={mt=>saveRecipePref(r.id,mt)} nutritionDisplay={nutritionDisplay}/>)}
        </div>
      </>}

      {/* ── SAVED RECIPES ── */}
      {tab==="favs"&&<>
        <div className="page-header"><div className="page-title">Saved <em>recipes</em></div><div className="page-subtitle">{favourites.length} from search · {customRecipes.length} your own</div></div>
        <div className="page-content">
          <button className="btn btn-forest btn-full" style={{marginBottom:18}} onClick={()=>setShowCustomForm(true)}>✏️ Create your own recipe</button>
          {customRecipes.length>0&&<><div className="section-divider"><span>My Recipes</span><div className="section-divider-line"/></div>{customRecipes.map(r=><CustomRecipeCard key={r.id} recipe={r} onAddToThisWeek={selDays=>selDays.forEach(d=>addToPlan(r,d))} onAddToNewPlan={selDays=>{ const seed=EMPTY_PLAN(); selDays.forEach(d=>seed[d]=[{...r,plannedServings:r.servings??defaultServings}]); setNewPlanSeed({plan:seed}); }} onAddToExistingPlan={(sp,selDays)=>addToExistingPlan(sp,r,selDays)} savedPlans={savedPlans} onDelete={()=>deleteCustomRecipe(r.id)} onEdit={()=>setEditingRecipe(r)} days={DAYS}/>)}</>}
          <div className="section-divider"><span>Saved from Search</span><div className="section-divider-line"/></div>
          {!favourites.length?<div className="empty-state" style={{padding:"30px 0"}}><div className="emoji">❤️</div><h3>No saved recipes yet</h3><p>Search for recipes and tap the heart to save them here</p></div>:favourites.map(r=><RecipeCard key={r.id} recipe={r} isFav={true} onFav={()=>toggleFav(r)} onView={()=>setSelected(r)} onAddToThisWeek={(selDays,mealType)=>selDays.forEach(d=>addToPlan({...r,mealType},d))} onAddToNewPlan={(selDays,mealType)=>{ const seed=EMPTY_PLAN(); selDays.forEach(d=>seed[d]=[{...r,mealType,plannedServings:r.servings??defaultServings}]); setNewPlanSeed({plan:seed}); }} onAddToExistingPlan={(sp,selDays,mealType)=>addToExistingPlan(sp,{...r,mealType},selDays)} savedPlans={savedPlans} days={DAYS} savedMealType={recipePrefs[r.id]} onSaveMealType={mt=>saveRecipePref(r.id,mt)} nutritionDisplay={nutritionDisplay}/>)}
        </div>
      </>}

      {/* ── SAVED PLANS ── */}
      {tab==="savedplans"&&<>
        <div className="page-header"><div className="page-title">Saved <em>plans</em></div><div className="page-subtitle">{savedPlans.length} plan{savedPlans.length!==1?"s":""} saved</div></div>
        <div className="page-content">
          <button className="btn btn-forest btn-full" style={{marginBottom:18}} onClick={()=>setNewPlanSeed({plan:EMPTY_PLAN()})}>✨ Create New Plan</button>
          {!savedPlans.length?<div className="empty-state"><div className="emoji">📋</div><h3>No saved plans yet</h3><p>Create a new plan above, or add recipes to This Week and save it from there</p></div>:savedPlans.map(sp=><SavedPlanCard key={sp.id} plan={sp} onLoad={()=>loadSavedPlan(sp)} onDelete={()=>deleteSavedPlan(sp.id)} onEdit={()=>setEditingSavedPlan(sp)}/>)}
        </div>
      </>}

      {/* ── THIS WEEK ── */}
      {tab==="plan"&&<>
        <div className="page-header">
          <div className="page-title">This <em>week</em></div>
          <div className="page-subtitle">{totalMeals?`${totalMeals} meal${totalMeals!==1?"s":""} planned · tap a day to expand`:"No meals planned yet"}</div>
        </div>
        <div className="page-content">
          {!totalMeals?(
            <div style={{textAlign:"center",paddingTop:20}}>
              <div style={{fontSize:56,marginBottom:12}}>📅</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:8}}>Nothing planned yet</h3>
              <p style={{color:"var(--muted)",fontSize:14,marginBottom:28,lineHeight:1.6}}>Load one of your saved plans to get started, or head to Search to find recipes to add.</p>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <button className="btn btn-primary btn-full" onClick={()=>setTab("savedplans")}>📋 Load a Saved Plan</button>
                <button className="btn btn-forest btn-full" onClick={()=>setTab("search")}>🔍 Search Recipes</button>
              </div>
            </div>
          ):(
            <>
              <SavePlanBar onSave={saveCurrentPlan}/>
              <button className="btn btn-danger btn-sm" style={{marginBottom:14,width:"100%"}} onClick={()=>{if(window.confirm("Clear the whole week?"))clearPlan();}}>🗑 Clear entire week</button>
              {DAYS.map(day=>(
                <ThisWeekDay key={day} day={day} meals={mealPlan[day]||[]}
                  onMealClick={meal=>{ if(meal.source==="custom")setEditingRecipe(meal); else setSelected(meal); }}
                  onUpdateServings={(idx,delta)=>updateServings(day,idx,delta)}
                  onRemove={idx=>removeFromPlan(day,idx)}
                />
              ))}
            </>
          )}
        </div>
      </>}

      {/* ── SHOPPING ── */}
      {tab==="shop"&&<>
        <div className="page-header"><div className="page-title">Shopping <em>list</em></div><div className="page-subtitle">{shoppingList.length} ingredient{shoppingList.length!==1?"s":""} across {totalMeals} meal{totalMeals!==1?"s":""}</div></div>
        <div className="page-content">
          <div className="custom-item-box"><span>✏️</span><CustomItemInput onAdd={addCustomItem}/></div>
          {(shoppingList.length===0&&customItems.length===0)?<div className="empty-state"><div className="emoji">🛒</div><h3>List is empty</h3><p>Add meals to your weekly plan and the shopping list will appear here automatically</p></div>:<>
            <div className="stat-row">
              <div className="stat-box"><div className="stat-num">{shoppingList.length+customItems.length}</div><div className="stat-lbl">Items</div></div>
              <div className="stat-box"><div className="stat-num">{totalMeals}</div><div className="stat-lbl">Meals</div></div>
              <div className="stat-box"><div className="stat-num">{Object.values(checked).filter(Boolean).length}</div><div className="stat-lbl">Got it</div></div>
            </div>
            <button className="btn btn-ghost" style={{width:"100%",marginBottom:12,borderRadius:12}} onClick={()=>setChecked({})}>Clear all checks</button>
            {shoppingByCategory.map(cat=>(
              <div key={cat.key}>
                <div className="shop-category-header"><span style={{fontSize:16}}>{cat.emoji}</span><span className="shop-category-label">{cat.label}</span><div className="shop-category-line"/></div>
                {cat.items.map((item,i)=>(
                  <div key={i} className={`shopping-item ${checked[item.name]?"checked":""}`} onClick={()=>setChecked(c=>({...c,[item.name]:!c[item.name]}))}>
                    <div className={`check-box ${checked[item.name]?"checked":""}`}>{checked[item.name]&&"✓"}</div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-qty">{item.displayAmount}</div>
                  </div>
                ))}
              </div>
            ))}
            {customItems.length>0&&<>
              <div className="shop-category-header"><span style={{fontSize:16}}>📝</span><span className="shop-category-label">My Extra Items</span><div className="shop-category-line"/></div>
              {customItems.map(item=>(
                <div key={item.id} className={`shopping-item ${checked[item.id]?"checked":""}`} onClick={()=>setChecked(c=>({...c,[item.id]:!c[item.id]}))}>
                  <div className={`check-box ${checked[item.id]?"checked":""}`}>{checked[item.id]&&"✓"}</div>
                  <div className="item-name">{item.name}<span className="custom-badge">custom</span></div>
                  <button className="remove-btn" onClick={e=>{e.stopPropagation();removeCustomItem(item.id);}}>×</button>
                </div>
              ))}
            </>}
          </>}
          <div className="divider" style={{marginTop:28}}/>
          <div className="user-row">
            <div className="user-avatar">{user.email[0].toUpperCase()}</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{user.email}</div><div style={{fontSize:11,color:"var(--muted)"}}>Signed in</div></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setTab("settings")}>⚙️ Settings</button>
          </div>
        </div>
      </>}

      {/* ── SETTINGS ── */}
      {tab==="settings"&&<>
        <div className="page-header"><div className="page-title">Your <em>settings</em></div><div className="page-subtitle">Preferences for your account</div></div>
        <div className="page-content">
          <div className="recipe-card" style={{marginBottom:16}}>
            <div className="recipe-card-body">
              <div className="modal-section-title" style={{marginBottom:4}}>Default servings</div>
              <p style={{fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.5}}>When you add a recipe to your plan, this is the default number of servings used. Custom recipes can override this with their own serves value.</p>
              <div className="servings-row">
                <span className="servings-label">Servings</span>
                <button className="serving-btn" onClick={()=>saveDefaultServings(Math.max(1,defaultServings-1))}>−</button>
                <span className="serving-count" style={{fontSize:15,fontWeight:700,minWidth:26,textAlign:"center"}}>{defaultServings}</span>
                <button className="serving-btn" onClick={()=>saveDefaultServings(defaultServings+1)}>+</button>
              </div>
            </div>
          </div>
          <div className="recipe-card" style={{marginBottom:16}}>
            <div className="recipe-card-body">
              <div className="modal-section-title" style={{marginBottom:4}}>Max search results</div>
              <p style={{fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.5}}>How many recipes to load per search.</p>
              <select className="plan-select" style={{width:"100%"}} value={maxResults} onChange={e=>saveMaxResults(Number(e.target.value))}>
                {[8,12,16,20,30,50].map(n=><option key={n} value={n}>{n} results</option>)}
              </select>
            </div>
          </div>
          <div className="recipe-card" style={{marginBottom:16}}>
            <div className="recipe-card-body">
              <div className="modal-section-title" style={{marginBottom:4}}>Recipe card nutrition</div>
              <p style={{fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.5}}>Choose how much nutrition info to show on recipe cards. Full details are always available inside the recipe.</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[{val:"none",label:"None — keep cards clean"},{val:"calories",label:"Calories only"},{val:"full",label:"Calories + Protein / Carbs / Fat"}].map(opt=>(
                  <label key={opt.val} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13}}>
                    <input type="radio" name="nutritionDisplay" value={opt.val} checked={nutritionDisplay===opt.val} onChange={()=>saveNutritionDisplay(opt.val)} style={{accentColor:"var(--terracotta)"}}/>
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="divider" style={{marginTop:28}}/>
          <div className="user-row">
            <div className="user-avatar">{user.email[0].toUpperCase()}</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{user.email}</div><div style={{fontSize:11,color:"var(--muted)"}}>Signed in</div></div>
            <button className="btn btn-ghost btn-sm" onClick={()=>signOut(auth)}>Sign out</button>
          </div>
        </div>
      </>}

      {archivePrompt&&<ArchivePromptModal suggestedName={archivePrompt.suggestedName} onConfirm={confirmArchive} onSkip={()=>setArchivePrompt(null)}/>}
      {selected&&<RecipeModal recipe={selected} isFav={isFav(selected.id)} onClose={()=>setSelected(null)} onFav={()=>toggleFav(selected)} onAddToPlan={(day,s)=>{addToPlan(selected,day,s);setSelected(null);}} days={DAYS} defaultServings={defaultServings}/>}
      {showCustomForm&&<CustomRecipeFormModal onClose={()=>setShowCustomForm(false)} onSave={saveCustomRecipe}/>}
      {editingRecipe&&<CustomRecipeFormModal recipe={editingRecipe} isEdit onClose={()=>setEditingRecipe(null)} onSave={async data=>{ await editCustomRecipe(editingRecipe.id,data); }}/>}
      {editingSavedPlan&&<EditSavedPlanModal plan={editingSavedPlan} onClose={()=>setEditingSavedPlan(null)} onSave={(updatedPlan,name)=>saveSavedPlanEdits(editingSavedPlan.id,updatedPlan,name)} favourites={favourites} customRecipes={customRecipes} days={DAYS} defaultServings={defaultServings}/>}
      {newPlanSeed&&<EditSavedPlanModal plan={{id:null,name:"New Plan",plan:newPlanSeed.plan}} isNew onClose={()=>setNewPlanSeed(null)} onSave={async(updatedPlan,name)=>{ const totalMeals=Object.values(updatedPlan).reduce((s,d)=>s+d.length,0); const id=await fsAddToCollection(uid,"savedPlans",{name,plan:updatedPlan,mealCount:totalMeals}); if(id){setSavedPlans(prev=>[{id,name,plan:updatedPlan,mealCount:totalMeals,savedAt:{seconds:Date.now()/1000}},...prev]);showToast(`✅ "${name}" saved!`);} setNewPlanSeed(null); }} favourites={favourites} customRecipes={customRecipes} days={DAYS} defaultServings={defaultServings}/>}
    </>
  );

  return (
    <div className="app">
      <nav className="side-nav">
        <div className="side-nav-logo" style={{cursor:"pointer"}} onClick={()=>setTab("home")}>What's for <em>Dinner?</em></div>
        {NAV_ITEMS.map(n=>(
          <button key={n.id} className={`side-nav-btn ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
            <span className="nav-icon">{n.icon}</span>{n.label}
          </button>
        ))}
        <div className="side-nav-bottom">
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div className="user-avatar" style={{width:28,height:28,fontSize:12}}>{user.email[0].toUpperCase()}</div>
            <div style={{fontSize:12,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{user.email}</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{width:"100%"}} onClick={()=>signOut(auth)}>Sign out</button>
        </div>
      </nav>
      <div className="main-area">{pages}</div>
      <nav className="bottom-nav">
        {NAV_ITEMS.map(n=>(
          <button key={n.id} className={`nav-btn ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
            <span className="nav-icon">{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function SavePlanBar({onSave}){
  const [name,setName]=useState("");
  return(<div className="save-plan-bar"><input value={name} onChange={e=>setName(e.target.value)} placeholder='Name this plan… e.g. "Week A – Light"' onKeyDown={e=>e.key==="Enter"&&(onSave(name),setName(""))}/><button className="btn btn-forest btn-sm" style={{flexShrink:0}} onClick={()=>{onSave(name);setName("");}}>Save plan</button></div>);
}

function ThisWeekDay({day,meals,onMealClick,onUpdateServings,onRemove}){
  const [expanded,setExpanded]=useState(meals.length>0);
  useEffect(()=>{ if(meals.length>0)setExpanded(true); },[meals.length]);
  const hasMeals=meals.length>0;
  return(
    <div className="week-day" style={{marginBottom:8,borderRadius:14,overflow:"hidden",boxShadow:"var(--shadow)",background:"var(--card)"}}>
      <div className="week-day-header" style={{cursor:"pointer",padding:"12px 15px",display:"flex",alignItems:"center",justifyContent:"space-between"}} onClick={()=>setExpanded(e=>!e)}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="day-name">{day}</div>
          {hasMeals&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {meals.map((m,i)=>(
                <span key={i} style={{fontSize:10,background:"var(--warm)",borderRadius:20,padding:"2px 7px",color:"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100}}>
                  {MEAL_TYPE_EMOJI[m.mealType]||"🍽️"} {m.title}
                </span>
              ))}
            </div>
          )}
          {!hasMeals&&<span style={{fontSize:12,color:"var(--muted)"}}>Nothing planned</span>}
        </div>
        <span style={{fontSize:12,color:"var(--muted)",flexShrink:0}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded&&(
        <div className="day-meals" style={{padding:"0 15px 12px"}}>
          {!hasMeals?(
            <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",paddingTop:4}}>No meals — go to Search or Recipes to add some.</div>
          ):meals.map((meal,idx)=>(
            <div key={idx} className="planned-meal" onClick={()=>onMealClick(meal)}>
              <div className="planned-meal-thumb">
                {meal.image?<img src={meal.image} alt={meal.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(MEAL_TYPE_EMOJI[meal.mealType]||"🍽️")}
              </div>
              <div className="planned-meal-info">
                <div className="planned-meal-name">{meal.title}</div>
                <div className="planned-meal-sub">{meal.mealType||meal.cuisine||meal.category} · {meal.plannedServings} serving{meal.plannedServings!==1?"s":""}</div>
              </div>
              <div className="serving-control" onClick={e=>e.stopPropagation()}>
                <button className="serving-btn" onClick={()=>onUpdateServings(idx,-1)}>−</button>
                <span className="serving-count">{meal.plannedServings}</span>
                <button className="serving-btn" onClick={()=>onUpdateServings(idx,1)}>+</button>
                <button className="serving-btn" style={{color:"var(--muted)"}} onClick={()=>onRemove(idx)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SavedPlanCard({plan,onLoad,onDelete,onEdit}){
  const allMeals=Object.values(plan.plan).flat();
  const preview=[...new Set(allMeals.map(m=>m.title))].slice(0,5);
  const seconds=plan.savedAt?.seconds||plan.savedAt?.toDate?.()?.getTime()/1000||Date.now()/1000;
  const date=new Date(seconds*1000).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"});
  return(
    <div className="saved-plan-card">
      <div className="saved-plan-name">{plan.name}</div>
      <div className="saved-plan-meta">💾 Saved {date} · {plan.mealCount} meal{plan.mealCount!==1?"s":""}</div>
      <div className="saved-plan-preview">{preview.map((t,i)=><span key={i} className="plan-preview-chip">{t}</span>)}{allMeals.length>preview.length&&<span className="plan-preview-chip">+{allMeals.length-preview.length} more</span>}</div>
      <div className="saved-plan-actions">
        <button className="btn btn-forest btn-sm" style={{flex:1}} onClick={onLoad}>📅 Load this week</button>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>👁 View / Edit</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function CustomItemInput({onAdd}){
  const [val,setVal]=useState("");
  const submit=()=>{if(!val.trim())return;onAdd(val);setVal("");};
  return<><input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Add your own item… (e.g. toilet paper)"/><button className="add-item-btn" onClick={submit}>Add</button></>;
}

function NutritionPills({nutrition,display,servings=1,plannedServings=1}){
  if(!nutrition||display==="none")return null;
  const scale=plannedServings/servings;
  const cal=Math.round(nutrition.calories*scale);
  if(display==="calories") return(
    <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
      <span style={{fontSize:11,background:"#FFF3E0",color:"#E65100",borderRadius:20,padding:"3px 9px",fontWeight:600}}>🔥 {cal} kcal</span>
    </div>
  );
  return(
    <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
      <span style={{fontSize:11,background:"#FFF3E0",color:"#E65100",borderRadius:20,padding:"3px 9px",fontWeight:600}}>🔥 {cal} kcal</span>
      <span style={{fontSize:11,background:"#E8F5E9",color:"#2E7D32",borderRadius:20,padding:"3px 9px",fontWeight:600}}>P {Math.round(nutrition.protein*scale)}g</span>
      <span style={{fontSize:11,background:"#E3F2FD",color:"#1565C0",borderRadius:20,padding:"3px 9px",fontWeight:600}}>C {Math.round(nutrition.carbs*scale)}g</span>
      <span style={{fontSize:11,background:"#FFF8E1",color:"#F57F17",borderRadius:20,padding:"3px 9px",fontWeight:600}}>F {Math.round(nutrition.fat*scale)}g</span>
    </div>
  );
}

function RecipeCard({recipe,isFav,onFav,onView,onAddToThisWeek,onAddToNewPlan,onAddToExistingPlan,savedPlans=[],days,savedMealType,onSaveMealType,nutritionDisplay="calories"}){
  const DAY_SHORT={Monday:"M",Tuesday:"T",Wednesday:"W",Thursday:"T",Friday:"F",Saturday:"S",Sunday:"S"};
  const [selectedDays,setSelectedDays]=useState([]);
  const [mealType,setMealType]=useState(savedMealType||"");
  const [showDropdown,setShowDropdown]=useState(false);
  const [showMealTypePicker,setShowMealTypePicker]=useState(false);
  const toggleDay=d=>setSelectedDays(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]);
  const handlePlanClick=()=>{
    if(!selectedDays.length)return;
    if(!mealType){setShowMealTypePicker(true);return;}
    setShowDropdown(true);
  };
  const handleMealTypeSelect=mt=>{ setMealType(mt); onSaveMealType(mt); setShowMealTypePicker(false); setShowDropdown(true); };
  const execute=action=>{
    const mt=mealType;
    if(action==="thisweek")onAddToThisWeek(selectedDays,mt);
    else if(action==="newplan")onAddToNewPlan(selectedDays,mt);
    else if(action?.startsWith?.("existing:")){const sp=savedPlans.find(p=>p.id===action.split(":")[1]);if(sp)onAddToExistingPlan(sp,selectedDays,mt);}
    setSelectedDays([]);setShowDropdown(false);setShowMealTypePicker(false);
  };
  return(
    <div className="recipe-card">
      <div className="recipe-card-img-wrap">
        {recipe.image?<img src={recipe.image} alt={recipe.title} loading="lazy"/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52}}>🍽️</div>}
        <div className="source-badge">{recipe.cuisine||recipe.category}</div>
        <button className="fav-badge" onClick={e=>{e.stopPropagation();onFav();}}>{isFav?"❤️":"🤍"}</button>
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-title">{recipe.title}</div>
        <div className="recipe-card-meta">{recipe.cuisine&&<span className="meta-tag">🌍 {recipe.cuisine}</span>}{recipe.category&&<span className="meta-tag">🗂 {recipe.category}</span>}<span className="meta-tag">🥄 {recipe.ingredients.length} ingredients</span>{recipe.readyInMinutes&&<span className="meta-tag">⏱ {recipe.readyInMinutes}m</span>}</div>
        <NutritionPills nutrition={recipe.nutrition} display={nutritionDisplay} servings={recipe.servings||4}/>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
          {["Breakfast","Lunch","Dinner","Snack"].map(mt=>(
            <button key={mt} onClick={()=>{setMealType(mt);onSaveMealType(mt);setShowMealTypePicker(false);}}
              style={{fontSize:11,padding:"3px 8px",borderRadius:20,border:"1px solid",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                borderColor:mealType===mt?"var(--terracotta)":"var(--border)",
                background:mealType===mt?"var(--terracotta)":"transparent",
                color:mealType===mt?"#fff":"var(--muted)",fontWeight:mealType===mt?600:400}}>
              {MEAL_TYPE_EMOJI[mt]} {mt}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
          {days.map(d=>(
            <button key={d} onClick={()=>toggleDay(d)}
              style={{width:28,height:28,borderRadius:"50%",border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",
                borderColor:selectedDays.includes(d)?"var(--forest)":"var(--border)",
                background:selectedDays.includes(d)?"var(--forest)":"transparent",
                color:selectedDays.includes(d)?"#fff":"var(--muted)"}}>
              {DAY_SHORT[d]}
            </button>
          ))}
          <button className="btn btn-forest btn-sm" style={{marginLeft:4,flexShrink:0}} onClick={handlePlanClick} disabled={!selectedDays.length}>Add to a Weekly Plan</button>
        </div>
        {showMealTypePicker&&(
          <div style={{background:"var(--warm)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
            <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>What meal is this?</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["Breakfast","Lunch","Dinner","Snack"].map(mt=>(
                <button key={mt} className="btn btn-ghost btn-sm" onClick={()=>handleMealTypeSelect(mt)}>{MEAL_TYPE_EMOJI[mt]} {mt}</button>
              ))}
            </div>
          </div>
        )}
        {showDropdown&&(
          <div style={{background:"var(--warm)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--ink)",marginBottom:8}}>Add to which plan?</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <button className="btn btn-forest btn-sm" style={{textAlign:"left",justifyContent:"flex-start"}} onClick={()=>execute("thisweek")}>📅 This week's plan</button>
              <button className="btn btn-ghost btn-sm" style={{textAlign:"left",justifyContent:"flex-start"}} onClick={()=>execute("newplan")}>✨ New plan</button>
              {savedPlans.length>0&&<>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2,marginBottom:2}}>Existing saved plans:</div>
                {savedPlans.map(sp=>(
                  <button key={sp.id} className="btn btn-ghost btn-sm" style={{textAlign:"left",justifyContent:"flex-start"}} onClick={()=>execute(`existing:${sp.id}`)}>📋 {sp.name}</button>
                ))}
              </>}
              <button className="btn btn-ghost btn-sm" style={{color:"var(--muted)",fontSize:11,marginTop:2}} onClick={()=>{setShowDropdown(false);setSelectedDays([]);}}>Cancel</button>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={onFav}>{isFav?"Unsave":"Save"}</button>
          <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={onView}>View Recipe</button>
        </div>
      </div>
    </div>
  );
}

function CustomRecipeCard({recipe,onAddToThisWeek,onAddToNewPlan,onAddToExistingPlan,savedPlans=[],onDelete,onEdit,days}){
  const DAY_SHORT={Monday:"M",Tuesday:"T",Wednesday:"W",Thursday:"T",Friday:"F",Saturday:"S",Sunday:"S"};
  const [selectedDays,setSelectedDays]=useState([]);
  const [showDropdown,setShowDropdown]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const emoji=MEAL_TYPE_EMOJI[recipe.mealType]||"🍽️";
  const toggleDay=d=>setSelectedDays(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]);
  const execute=action=>{
    if(action==="thisweek")onAddToThisWeek(selectedDays);
    else if(action==="newplan")onAddToNewPlan(selectedDays);
    else if(action?.startsWith?.("existing:")){const sp=savedPlans.find(p=>p.id===action.split(":")[1]);if(sp)onAddToExistingPlan(sp,selectedDays);}
    setSelectedDays([]);setShowDropdown(false);
  };
  return(
    <div className="custom-recipe-card">
      <div className="custom-recipe-body">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div>
            {recipe.mealType&&<div className="meal-type-chip">{emoji} {recipe.mealType}</div>}
            <div className="recipe-card-title" style={{marginTop:4}}>{recipe.title}</div>
            {recipe.mealType==="School Lunchbox"&&recipe.lunchboxContents&&<div style={{fontSize:12,color:"var(--muted)",marginTop:4,lineHeight:1.5}}>🎒 {recipe.lunchboxContents}</div>}
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:8}}>
            <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏️ Edit</button>
            <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
          </div>
        </div>
        {recipe.ingredients?.length>0&&<>
          <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>🥄 {recipe.ingredients.length} ingredient{recipe.ingredients.length!==1?"s":""}</div>
          {expanded&&<ul className="ingredient-list" style={{marginBottom:10}}>{recipe.ingredients.map((ing,i)=><li key={i}><span>{ing.name}</span><span style={{color:"var(--muted)"}}>{ing.amount}</span></li>)}</ul>}
        </>}
        {recipe.notes&&expanded&&<div style={{background:"var(--warm)",borderRadius:10,padding:"10px 12px",fontSize:13,marginBottom:10,lineHeight:1.6}}>📝 {recipe.notes}</div>}
        {(recipe.ingredients?.length>0||recipe.notes)&&<button className="btn btn-ghost btn-sm" style={{marginBottom:10,width:"100%"}} onClick={()=>setExpanded(e=>!e)}>{expanded?"Hide details ▲":"Show details ▼"}</button>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:showDropdown?8:0}}>
          {days.map(d=>(
            <button key={d} onClick={()=>toggleDay(d)}
              style={{width:28,height:28,borderRadius:"50%",border:"1px solid",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",
                borderColor:selectedDays.includes(d)?"var(--forest)":"var(--border)",
                background:selectedDays.includes(d)?"var(--forest)":"transparent",
                color:selectedDays.includes(d)?"#fff":"var(--muted)"}}>
              {DAY_SHORT[d]}
            </button>
          ))}
          <button className="btn btn-forest btn-sm" style={{marginLeft:4,flexShrink:0}} onClick={()=>{if(selectedDays.length)setShowDropdown(true);}} disabled={!selectedDays.length}>Add to a Weekly Plan</button>
        </div>
        {showDropdown&&(
          <div style={{background:"var(--warm)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--ink)",marginBottom:8}}>Add to which plan?</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <button className="btn btn-forest btn-sm" style={{textAlign:"left",justifyContent:"flex-start"}} onClick={()=>execute("thisweek")}>📅 This week's plan</button>
              <button className="btn btn-ghost btn-sm" style={{textAlign:"left",justifyContent:"flex-start"}} onClick={()=>execute("newplan")}>✨ New plan</button>
              {savedPlans.length>0&&<>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2,marginBottom:2}}>Existing saved plans:</div>
                {savedPlans.map(sp=>(
                  <button key={sp.id} className="btn btn-ghost btn-sm" style={{textAlign:"left",justifyContent:"flex-start"}} onClick={()=>execute(`existing:${sp.id}`)}>📋 {sp.name}</button>
                ))}
              </>}
              <button className="btn btn-ghost btn-sm" style={{color:"var(--muted)",fontSize:11,marginTop:2}} onClick={()=>{setShowDropdown(false);setSelectedDays([]);}}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeModal({recipe,isFav,onClose,onFav,onAddToPlan,days,defaultServings=4}){
  const [modTab,setModTab]=useState("ingredients");
  const [day,setDay]=useState("Monday");
  const [servings,setServings]=useState(recipe.servings||defaultServings);
  const ratio=servings/(recipe.servings||defaultServings);
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:10}}>
          <button className="btn btn-ghost btn-sm" onClick={onFav}>{isFav?"❤️ Saved":"🤍 Save"}</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        {recipe.image&&<img className="modal-img" src={recipe.image} alt={recipe.title}/>}
        <div className="modal-title">{recipe.title}</div>
        <div className="recipe-card-meta" style={{marginBottom:10}}>
          {recipe.cuisine&&<span className="meta-tag">🌍 {recipe.cuisine}</span>}
          {recipe.category&&<span className="meta-tag">🗂 {recipe.category}</span>}
          <span className="meta-tag">🥄 {recipe.ingredients.length} ingredients</span>
          {recipe.readyInMinutes&&<span className="meta-tag">⏱ {recipe.readyInMinutes}m</span>}
        </div>
        {recipe.nutrition&&(
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            {[
              {label:"Calories",val:Math.round(recipe.nutrition.calories*ratio),unit:"kcal",bg:"#FFF3E0",color:"#E65100"},
              {label:"Protein",val:Math.round(recipe.nutrition.protein*ratio),unit:"g",bg:"#E8F5E9",color:"#2E7D32"},
              {label:"Carbs",val:Math.round(recipe.nutrition.carbs*ratio),unit:"g",bg:"#E3F2FD",color:"#1565C0"},
              {label:"Fat",val:Math.round(recipe.nutrition.fat*ratio),unit:"g",bg:"#FFF8E1",color:"#F57F17"},
              {label:"Fibre",val:Math.round(recipe.nutrition.fiber*ratio),unit:"g",bg:"#F3E5F5",color:"#6A1B9A"},
              {label:"Sugar",val:Math.round(recipe.nutrition.sugar*ratio),unit:"g",bg:"#FCE4EC",color:"#880E4F"},
            ].map(n=>(
              <div key={n.label} style={{background:n.bg,borderRadius:10,padding:"8px 12px",textAlign:"center",minWidth:64}}>
                <div style={{fontSize:15,fontWeight:700,color:n.color}}>{n.val}{n.unit}</div>
                <div style={{fontSize:10,color:n.color,opacity:0.8}}>{n.label}</div>
              </div>
            ))}
          </div>
        )}
        {recipe.url&&<a className="yt-btn" href={recipe.url} target="_blank" rel="noreferrer">🔗 View Original Recipe</a>}
        <div className="divider"/>
        <div className="servings-row"><span className="servings-label">Adjust servings</span><button className="serving-btn" onClick={()=>setServings(s=>Math.max(1,s-1))}>−</button><span className="serving-count" style={{fontSize:15,fontWeight:700,minWidth:26,textAlign:"center"}}>{servings}</span><button className="serving-btn" onClick={()=>setServings(s=>s+1)}>+</button></div>
        <div className="tab-row"><button className={`tab-btn ${modTab==="ingredients"?"active":""}`} onClick={()=>setModTab("ingredients")}>Ingredients</button><button className={`tab-btn ${modTab==="steps"?"active":""}`} onClick={()=>setModTab("steps")}>Steps</button></div>
        {modTab==="ingredients"&&<ul className="ingredient-list">{recipe.ingredients.map((ing,i)=><li key={i}><span>{ing.name}</span><span style={{color:"var(--muted)"}}>{scaleAmount(ing.amount,ratio)}</span></li>)}</ul>}
        {modTab==="steps"&&<ol style={{paddingLeft:20}}>{recipe.steps.map((step,i)=><li key={i} style={{marginBottom:13,fontSize:14,lineHeight:1.7}}><strong style={{color:"var(--terracotta)"}}>Step {i+1}.</strong> {step}</li>)}</ol>}
        <div className="divider"/>
        <div className="modal-section-title">Add to Meal Plan</div>
        <div style={{display:"flex",gap:8}}>
          <select className="plan-select" value={day} onChange={e=>setDay(e.target.value)}>{days.map(d=><option key={d}>{d}</option>)}</select>
          <button className="btn btn-forest" style={{flexShrink:0}} onClick={()=>onAddToPlan(day,servings)}>Add to {day}</button>
        </div>
      </div>
    </div>
  );
}

function CustomRecipeFormModal({recipe,isEdit,onClose,onSave}){
  const [title,setTitle]=useState(recipe?.title||"");
  const [mealType,setMealType]=useState(recipe?.mealType||"Lunch");
  const [servings,setServings]=useState(recipe?.servings||4);
  const [lunchboxContents,setLunchboxContents]=useState(recipe?.lunchboxContents||"");
  const [ingredients,setIngredients]=useState(recipe?.ingredients?.length?recipe.ingredients:[{name:"",amount:""}]);
  const [notes,setNotes]=useState(recipe?.notes||"");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const isLunchbox=mealType==="School Lunchbox";
  const updateIngredient=(i,field,val)=>{ const u=[...ingredients]; u[i]={...u[i],[field]:val}; setIngredients(u); };
  const addIngredientRow=()=>setIngredients(p=>[...p,{name:"",amount:""}]);
  const removeIngredientRow=i=>setIngredients(p=>p.filter((_,idx)=>idx!==i));
  const handleSave=async()=>{
    if(!title.trim()){setError("Please enter a recipe name.");return;}
    setSaving(true);
    const cleanIngredients=ingredients.filter(i=>i.name.trim()).map(i=>({name:i.name.trim(),amount:i.amount.trim()}));
    await onSave({ title:title.trim(), mealType, ingredients:cleanIngredients, notes:notes.trim(), lunchboxContents:isLunchbox?lunchboxContents.trim():"", source:"custom", servings, cuisine:"", category:isLunchbox?"Lunch":mealType, image:"", youtube:"", steps:notes?[notes.trim()]:[], id:recipe?.id||`custom-${Date.now()}` });
    setSaving(false);
  };
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div className="modal-title" style={{marginBottom:0}}>{isEdit?"Edit recipe":"Create a recipe"}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        {error&&<div style={{background:"#FEE2E2",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--red)",marginBottom:12}}>{error}</div>}
        <label className="form-label">Recipe name *</label>
        <input className="form-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder={isLunchbox?'e.g. "Monday Lunchbox"':'e.g. "Recipe Name"'}/>
        <label className="form-label">Meal type</label>
        <div className="meal-type-selector">{MEAL_TYPES.map(t=><button key={t} className={`meal-type-btn ${mealType===t?"active":""}`} onClick={()=>setMealType(t)}>{MEAL_TYPE_EMOJI[t]} {t}</button>)}</div>

        {isLunchbox&&(
          <>
            <div className="section-divider" style={{marginTop:18}}>
              <span>What they're getting</span><div className="section-divider-line"/>
            </div>
            <div style={{background:"var(--warm)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"var(--muted)",marginBottom:10,lineHeight:1.5}}>
              🎒 Describe what's in the lunchbox — this shows on your home page so you can see at a glance what's packed.
            </div>
            <textarea className="form-textarea" value={lunchboxContents} onChange={e=>setLunchboxContents(e.target.value)} placeholder="e.g. Ham and cheese sandwich, chips, banana, yoghurt…" style={{marginBottom:4}}/>
          </>
        )}

        <label className="form-label" style={{marginTop:14}}>Default servings for this recipe</label>
        <div className="servings-row" style={{marginBottom:4}}>
          <button className="serving-btn" onClick={()=>setServings(s=>Math.max(1,s-1))}>−</button>
          <span className="serving-count" style={{fontSize:15,fontWeight:700,minWidth:26,textAlign:"center"}}>{servings}</span>
          <button className="serving-btn" onClick={()=>setServings(s=>s+1)}>+</button>
          <span style={{fontSize:12,color:"var(--muted)",marginLeft:8}}>serves {servings}</span>
        </div>
        <div className="section-divider" style={{marginTop:18}}>
          <span>{isLunchbox?"Shopping ingredients":"Ingredients"}</span><div className="section-divider-line"/>
          <span style={{fontSize:12,color:"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontWeight:400}}>optional</span>
        </div>
        {isLunchbox&&<div style={{background:"var(--warm)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"var(--muted)",marginBottom:10,lineHeight:1.5}}>🛒 These go to your shopping list — add individual items with amounts (e.g. bread, butter, ham).</div>}
        {ingredients.map((ing,i)=>(
          <div key={i} className="ingredient-input-row">
            <input value={ing.name} onChange={e=>updateIngredient(i,"name",e.target.value)} placeholder="Ingredient name"/>
            <input value={ing.amount} onChange={e=>updateIngredient(i,"amount",e.target.value)} placeholder="Amount" style={{maxWidth:100}}/>
            {ingredients.length>1&&<button className="remove-btn" onClick={()=>removeIngredientRow(i)} style={{fontSize:20}}>×</button>}
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" style={{marginBottom:4}} onClick={addIngredientRow}>+ Add ingredient</button>
        {!isLunchbox&&<>
          <div className="section-divider" style={{marginTop:16}}>
            <span>Notes / Steps</span><div className="section-divider-line"/>
            <span style={{fontSize:12,color:"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontWeight:400}}>optional</span>
          </div>
          <textarea className="form-textarea" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any prep notes, cooking steps, or reminders…"/>
        </>}
        <button className="btn btn-primary btn-full" style={{marginTop:20}} onClick={handleSave} disabled={saving}>{saving?"Saving…":isEdit?"Save Changes":"Save Recipe"}</button>
      </div>
    </div>
  );
}

function EditSavedPlanModal({plan,isNew,onClose,onSave,favourites,customRecipes,days,defaultServings=4}){
  const [name,setName]=useState(plan.name);
  const [editPlan,setEditPlan]=useState(JSON.parse(JSON.stringify(plan.plan)));
  const [saving,setSaving]=useState(false);
  const [openSlot,setOpenSlot]=useState(null); // "Monday-Breakfast" etc
  const allRecipes=[...favourites,...customRecipes];

  const PLAN_MEAL_TYPES=[
    {label:"Breakfast",emoji:"🍳",types:["Breakfast"]},
    {label:"Lunch",emoji:"🥪",types:["Lunch","School Lunchbox"]},
    {label:"Dinner",emoji:"🍽️",types:["Dinner"]},
    {label:"Snacks",emoji:"🍎",types:["Snack"]},
    {label:"Other",emoji:"✨",types:["Other",null,undefined,""]},
  ];

  const getMealsForType=(day,types)=>
    (editPlan[day]||[]).map((m,i)=>({...m,_idx:i}))
      .filter(m=>types.includes(m.mealType)||(types.includes(null)&&!m.mealType));

  const removeFromDay=(day,idx)=>{ const u={...editPlan}; u[day]=u[day].filter((_,i)=>i!==idx); setEditPlan({...u}); };
  const updateDayServings=(day,idx,delta)=>{ const u={...editPlan}; u[day][idx]={...u[day][idx],plannedServings:Math.max(1,(u[day][idx].plannedServings||defaultServings)+delta)}; setEditPlan({...u}); };
  const addRecipeToDay=(day,recipe,mealTypeHint)=>{
    const u={...editPlan};
    u[day]=[...u[day],{...recipe,plannedServings:recipe.servings||defaultServings,mealType:recipe.mealType||mealTypeHint}];
    setEditPlan({...u});
    setOpenSlot(null);
  };
  const handleSave=async()=>{ setSaving(true); await onSave(editPlan,name); setSaving(false); };

  const slotKey=(day,label)=>`${day}-${label}`;

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxHeight:"90vh",overflowY:"auto"}}>
        <div className="modal-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div className="modal-title" style={{marginBottom:0}}>{isNew?"Create a new plan":"View / Edit plan"}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        {isNew&&(
          <div style={{background:"var(--warm)",borderRadius:12,padding:"12px 14px",marginBottom:16,fontSize:13,color:"var(--muted)",lineHeight:1.6}}>
            📋 Select the meals you'd like for the week — breakfast, lunch, dinner and snacks. Your saved and custom recipes will appear automatically in the dropdown below each day. You can also head to the <strong>Search</strong> or <strong>Recipes</strong> tabs to find more ideas and add them directly to a plan from there.
          </div>
        )}
        <label className="form-label">Plan name</label>
        <input className="form-input" value={name} onChange={e=>setName(e.target.value)} style={{marginBottom:18}}/>

        {days.map(day=>(
          <div key={day} style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--terracotta)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10,paddingBottom:4,borderBottom:"1px solid var(--border)"}}>{day}</div>

            {PLAN_MEAL_TYPES.map(({label,emoji,types})=>{
              const meals=getMealsForType(day,types);
              const key=slotKey(day,label);
              const isOpen=openSlot===key;
              const filtered=allRecipes.filter(r=>types.includes(r.mealType)||(types.includes(null)&&!r.mealType));
              const dropdownRecipes=filtered.length>0?filtered:allRecipes;
              return(
                <div key={label} style={{marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{emoji} {label}</div>

                  {meals.length>0&&meals.map(meal=>(
                    <div key={meal._idx} style={{display:"flex",alignItems:"center",gap:8,background:"var(--warm)",borderRadius:10,padding:"8px 10px",marginBottom:6}}>
                      {meal.image&&<img src={meal.image} alt={meal.title} style={{width:32,height:32,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
                      {!meal.image&&<span style={{fontSize:18,flexShrink:0}}>{emoji}</span>}
                      <div style={{flex:1,minWidth:0,fontSize:13,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{meal.title}</div>
                      <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                        <button className="serving-btn" style={{width:22,height:22,fontSize:14}} onClick={()=>updateDayServings(day,meal._idx,-1)}>−</button>
                        <span style={{fontSize:12,minWidth:16,textAlign:"center"}}>{meal.plannedServings||defaultServings}</span>
                        <button className="serving-btn" style={{width:22,height:22,fontSize:14}} onClick={()=>updateDayServings(day,meal._idx,1)}>+</button>
                        <button className="btn btn-danger btn-sm" style={{padding:"2px 8px",fontSize:11}} onClick={()=>removeFromDay(day,meal._idx)}>✕</button>
                      </div>
                    </div>
                  ))}

                  {!isOpen&&(
                    <div onClick={()=>setOpenSlot(key)}
                      style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",padding:"7px 10px",borderRadius:8,border:"1px dashed var(--border)",cursor:"pointer",background:"transparent",transition:"background 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--warm)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {meals.length===0?`No ${label.toLowerCase()} selected — tap to add`:"+ Add another"}
                    </div>
                  )}

                  {isOpen&&(
                    <div style={{marginTop:4}}>
                      {allRecipes.length>0?(
                        <select className="plan-select" style={{width:"100%",fontSize:12}} autoFocus defaultValue=""
                          onChange={e=>{ const r=allRecipes.find(r=>r.id===e.target.value); if(r)addRecipeToDay(day,r,types[0]); e.target.value=""; }}
                          onBlur={()=>setOpenSlot(null)}>
                          <option value="" disabled>Select a saved or custom recipe, or visit Search / Recipes to find new ideas…</option>
                          {dropdownRecipes.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}
                          {filtered.length>0&&dropdownRecipes.length<allRecipes.length&&<>
                            <option disabled>── All recipes ──</option>
                            {allRecipes.filter(r=>!filtered.find(f=>f.id===r.id)).map(r=><option key={r.id} value={r.id}>{r.title}</option>)}
                          </>}
                        </select>
                      ):(
                        <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic"}}>No saved recipes yet — head to Search or Recipes to find and save some first.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <button className="btn btn-primary btn-full" style={{marginTop:8}} onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save Changes"}</button>
      </div>
    </div>
  );
}

function ArchivePromptModal({suggestedName,onConfirm,onSkip}){
  const [name,setName]=useState(suggestedName);
  return(
    <div className="modal-overlay">
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div style={{fontSize:36,textAlign:"center",marginBottom:12}}>📦</div>
        <div className="modal-title" style={{textAlign:"center"}}>New week, fresh start!</div>
        <p style={{fontSize:14,color:"var(--muted)",textAlign:"center",marginBottom:20,lineHeight:1.6}}>
          A new week has started. Would you like to archive last week's plan before clearing it?
        </p>
        <label className="form-label">Archive name</label>
        <input className="form-input" value={name} onChange={e=>setName(e.target.value)} style={{marginBottom:16}}/>
        <button className="btn btn-primary btn-full" style={{marginBottom:10}} onClick={()=>onConfirm(name)}>📦 Archive & Start Fresh</button>
        <button className="btn btn-ghost btn-sm" style={{width:"100%",color:"var(--muted)"}} onClick={onSkip}>Skip — don't archive</button>
      </div>
    </div>
  );
}