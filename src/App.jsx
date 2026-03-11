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
  {name:"Beef",emoji:"🥩"},{name:"Chicken",emoji:"🍗"},{name:"Seafood",emoji:"🐟"},
  {name:"Vegetarian",emoji:"🥦"},{name:"Pasta",emoji:"🍝"},{name:"Dessert",emoji:"🍰"},
  {name:"Breakfast",emoji:"🍳"},{name:"Side",emoji:"🥗"},{name:"Lamb",emoji:"🍖"},
  {name:"Miscellaneous",emoji:"🍽️"},
];
const AREAS = ["American","British","Canadian","Chinese","French","Greek","Indian","Italian","Japanese","Mexican","Moroccan","Spanish","Thai","Turkish"];
const BASE = "https://www.themealdb.com/api/json/v1/1";
const EMPTY_PLAN = () => { const p={}; DAYS.forEach(d=>p[d]=[]); return p; };
const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snack","Other"];
const MEAL_TYPE_EMOJI = {Breakfast:"🍳",Lunch:"🥪",Dinner:"🍽️",Snack:"🍎",Other:"✨"};
const NAV_ITEMS = [
  {id:"search",icon:"🔍",label:"Search"},
  {id:"favs",icon:"❤️",label:"Recipes"},
  {id:"savedplans",icon:"📋",label:"Plans"},
  {id:"plan",icon:"📅",label:"This Week"},
  {id:"shop",icon:"🛒",label:"Shop"},
];

// ─────────────────────────────────────────────────────────────────────────────
// MEALDB API
// ─────────────────────────────────────────────────────────────────────────────
function parseMeal(m) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = m[`strIngredient${i}`]; const measure = m[`strMeasure${i}`];
    if (name && name.trim()) ingredients.push({ name: name.trim(), amount: measure ? measure.trim() : "" });
  }
  return { id: m.idMeal, title: m.strMeal, cuisine: m.strArea||"", category: m.strCategory||"", image: m.strMealThumb||"", youtube: m.strYoutube||"", url: "", source: "MealDB", ingredients, steps: (m.strInstructions||"").split(/\r?\n/).filter(s=>s.trim().length>15), servings: 4 };
}
async function fetchById(id) { const r=await fetch(`${BASE}/lookup.php?i=${id}`); const d=await r.json(); return d.meals?parseMeal(d.meals[0]):null; }

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
  const [tab,setTab]=useState("search");
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
  // Modals
  const [selected,setSelected]=useState(null);
  const [showCustomForm,setShowCustomForm]=useState(false);
  const [editingRecipe,setEditingRecipe]=useState(null);
  const [toast,setToast]=useState(null);

  useEffect(()=>{ (async()=>{ setDataLoading(true); const[f,p,sp,ci,cr,settings]=await Promise.all([fsGet(uid,"data/favourites"),fsGet(uid,"data/mealPlan"),fsGetCollection(uid,"savedPlans"),fsGet(uid,"data/customItems"),fsGetCollection(uid,"customRecipes"),fsGet(uid,"data/settings")]); if(f?.items)setFavourites(f.items); if(p?.plan)setMealPlan(p.plan); if(sp.length)setSavedPlans(sp.sort((a,b)=>(b.savedAt?.seconds||0)-(a.savedAt?.seconds||0))); if(ci?.items)setCustomItems(ci.items); if(cr.length)setCustomRecipes(cr.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))); if(settings?.maxResults)setMaxResults(settings.maxResults); setDataLoading(false); })(); },[uid]);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),2400); };
  const saveFavs = async v => { setFavourites(v); await fsSet(uid,"data/favourites",{items:v}); };
  const savePlan = async v => { setMealPlan(v); await fsSet(uid,"data/mealPlan",{plan:v}); };
  const saveCustomItems = async v => { setCustomItems(v); await fsSet(uid,"data/customItems",{items:v}); };
  const saveMaxResults = async v => { setMaxResults(v); await fsSet(uid,"data/settings",{maxResults:v}); };
  const isFav = id => favourites.some(f=>f.id===id);
  const toggleFav = recipe => { if(isFav(recipe.id)){saveFavs(favourites.filter(f=>f.id!==recipe.id));showToast("Removed from saved recipes");}else{saveFavs([...favourites,recipe]);showToast("❤️ Saved to recipes!");} };
  const addToPlan = (recipe,day,servings=4) => { savePlan({...mealPlan,[day]:[...mealPlan[day],{...recipe,plannedServings:servings}]}); showToast(`Added to ${day}!`); };
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
  const saveCustomRecipe = async recipe => { const id=await fsAddToCollection(uid,"customRecipes",recipe); if(id){setCustomRecipes(prev=>[{...recipe,id,createdAt:{seconds:Date.now()/1000}},...prev]);showToast("✅ Custom recipe saved!");setShowCustomForm(false);} };
  const deleteCustomRecipe = async id => { await fsDeleteDoc(uid,`customRecipes/${id}`); setCustomRecipes(prev=>prev.filter(r=>r.id!==id)); showToast("Recipe deleted"); };
  const editCustomRecipe = async (id, updated) => { await setDoc(doc(db,"users",uid,"customRecipes",id),{...updated,updatedAt:serverTimestamp()},{merge:true}); setCustomRecipes(prev=>prev.map(r=>r.id===id?{...r,...updated}:r)); setEditingRecipe(null); showToast("✅ Recipe updated!"); };
  const addCustomItem = v => { if(!v.trim())return; saveCustomItems([...customItems,{id:Date.now().toString(),name:v.trim()}]); };
  const removeCustomItem = id => saveCustomItems(customItems.filter(i=>i.id!==id));

  const handleSearch = async () => {
    setLoading(true); setRecipes([]);
    try {
      let raw=[];
      if(searchMode==="keyword"&&query.trim()){
        const r=await fetch(`${BASE}/search.php?s=${encodeURIComponent(query)}`);
        const d=await r.json(); raw=(d.meals||[]).map(parseMeal);
      } else if(searchMode==="ingredient"&&ingredientQuery.trim()){
        const r=await fetch(`${BASE}/filter.php?i=${encodeURIComponent(ingredientQuery.trim())}`);
        const d=await r.json();
        const ids=(d.meals||[]).slice(0,maxResults);
        raw=await Promise.all(ids.map(m=>fetchById(m.idMeal)));
        raw=raw.filter(Boolean);
      } else if(searchMode==="category"&&activeCategory){
        const r=await fetch(`${BASE}/filter.php?c=${encodeURIComponent(activeCategory)}`);
        const d=await r.json();
        raw=await Promise.all((d.meals||[]).slice(0,maxResults).map(m=>fetchById(m.idMeal)));
        raw=raw.filter(Boolean);
      } else if(searchMode==="cuisine"&&activeArea){
        const r=await fetch(`${BASE}/filter.php?a=${encodeURIComponent(activeArea)}`);
        const d=await r.json();
        raw=await Promise.all((d.meals||[]).slice(0,maxResults).map(m=>fetchById(m.idMeal)));
        raw=raw.filter(Boolean);
      }

      // Apply active smart filters as post-processing
      const filtered=raw;
      setRecipes(filtered);
      if(!filtered.length) showToast("No recipes found — try something else!");
    } catch(e){ console.error(e); showToast("Search failed — check your connection"); }
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

          {recipes.map(r=><RecipeCard key={r.id} recipe={r} isFav={isFav(r.id)} onFav={()=>toggleFav(r)} onView={()=>setSelected(r)} onAddToPlan={day=>addToPlan(r,day)} days={DAYS}/>)}
        </div>
      </>}

      {/* ── SAVED RECIPES ── */}
      {tab==="favs"&&<>
        <div className="page-header"><div className="page-title">Saved <em>recipes</em></div><div className="page-subtitle">{favourites.length} from search · {customRecipes.length} your own</div></div>
        <div className="page-content">
          <button className="btn btn-forest btn-full" style={{marginBottom:18}} onClick={()=>setShowCustomForm(true)}>✏️ Create your own recipe</button>
          {customRecipes.length>0&&<><div className="section-divider"><span>My Recipes</span><div className="section-divider-line"/></div>{customRecipes.map(r=><CustomRecipeCard key={r.id} recipe={r} onAddToPlan={day=>addToPlan(r,day)} onDelete={()=>deleteCustomRecipe(r.id)} onEdit={()=>setEditingRecipe(r)} days={DAYS}/>)}</>}
          <div className="section-divider"><span>Saved from Search</span><div className="section-divider-line"/></div>
          {!favourites.length?<div className="empty-state" style={{padding:"30px 0"}}><div className="emoji">❤️</div><h3>No saved recipes yet</h3><p>Search for recipes and tap the heart to save them here</p></div>:favourites.map(r=><RecipeCard key={r.id} recipe={r} isFav={true} onFav={()=>toggleFav(r)} onView={()=>setSelected(r)} onAddToPlan={day=>addToPlan(r,day)} days={DAYS}/>)}
        </div>
      </>}

      {/* ── SAVED PLANS ── */}
      {tab==="savedplans"&&<>
        <div className="page-header"><div className="page-title">Saved <em>plans</em></div><div className="page-subtitle">{savedPlans.length} plan{savedPlans.length!==1?"s":""} saved</div></div>
        <div className="page-content">
          {!savedPlans.length?<div className="empty-state"><div className="emoji">📋</div><h3>No saved plans yet</h3><p>Build a week in the Plan tab, name it, and save it here to reuse anytime</p></div>:savedPlans.map(sp=><SavedPlanCard key={sp.id} plan={sp} onLoad={()=>loadSavedPlan(sp)} onDelete={()=>deleteSavedPlan(sp.id)}/>)}
        </div>
      </>}

      {/* ── THIS WEEK ── */}
      {tab==="plan"&&<>
        <div className="page-header"><div className="page-title">This <em>week</em></div><div className="page-subtitle">{totalMeals} meal{totalMeals!==1?"s":""} planned · tap a meal to view recipe</div></div>
        <div className="page-content">
          <SavePlanBar onSave={saveCurrentPlan}/>
          {totalMeals>0&&<button className="btn btn-danger btn-sm" style={{marginBottom:14,width:"100%"}} onClick={()=>{if(window.confirm("Clear the whole week?"))clearPlan();}}>🗑 Clear entire week</button>}
          {!totalMeals&&<div className="empty-state" style={{paddingTop:20}}><div className="emoji">📅</div><h3>Plan is empty</h3><p>Go to Saved Recipes and add meals to days, or load a saved plan</p></div>}
          {DAYS.map(day=>(
            <div key={day} className="week-day">
              <div className="week-day-header"><div className="day-name">{day}</div><div style={{fontSize:11,color:"var(--muted)"}}>{mealPlan[day].length} meal{mealPlan[day].length!==1?"s":""}</div></div>
              {!mealPlan[day].length?<div style={{padding:"10px 15px",color:"var(--muted)",fontSize:12}}>No meals planned</div>:
              <div className="day-meals">{mealPlan[day].map((meal,idx)=>(
                <div key={idx} className="planned-meal" onClick={()=>{ if(meal.source==="custom")setEditingRecipe(meal); else setSelected(meal); }}>
                  <div className="planned-meal-thumb">
                    {meal.image?<img src={meal.image} alt={meal.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(MEAL_TYPE_EMOJI[meal.mealType]||"🍽️")}
                  </div>
                  <div className="planned-meal-info">
                    <div className="planned-meal-name">{meal.title}</div>
                    <div className="planned-meal-sub">{meal.mealType||meal.cuisine||meal.category} · {meal.plannedServings} serving{meal.plannedServings!==1?"s":""} · tap to view</div>
                  </div>
                  <div className="serving-control" onClick={e=>e.stopPropagation()}>
                    <button className="serving-btn" onClick={()=>updateServings(day,idx,-1)}>−</button>
                    <span className="serving-count">{meal.plannedServings}</span>
                    <button className="serving-btn" onClick={()=>updateServings(day,idx,1)}>+</button>
                    <button className="serving-btn" style={{color:"var(--muted)"}} onClick={()=>removeFromPlan(day,idx)}>×</button>
                  </div>
                </div>
              ))}</div>}
            </div>
          ))}
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
            <button className="btn btn-ghost btn-sm" onClick={()=>signOut(auth)}>Sign out</button>
          </div>
        </div>
      </>}

      {selected&&<RecipeModal recipe={selected} isFav={isFav(selected.id)} onClose={()=>setSelected(null)} onFav={()=>toggleFav(selected)} onAddToPlan={(day,s)=>{addToPlan(selected,day,s);setSelected(null);}} days={DAYS}/>}
      {showCustomForm&&<CustomRecipeFormModal onClose={()=>setShowCustomForm(false)} onSave={saveCustomRecipe}/>}
      {editingRecipe&&<CustomRecipeFormModal recipe={editingRecipe} isEdit onClose={()=>setEditingRecipe(null)} onSave={async data=>{ await editCustomRecipe(editingRecipe.id,data); }}/>}
    </>
  );

  return (
    <div className="app">
      <nav className="side-nav">
        <div className="side-nav-logo">What's for <em>Dinner?</em></div>
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

function SavedPlanCard({plan,onLoad,onDelete}){
  const allMeals=Object.values(plan.plan).flat();
  const preview=[...new Set(allMeals.map(m=>m.title))].slice(0,5);
  const seconds=plan.savedAt?.seconds||plan.savedAt?.toDate?.()?.getTime()/1000||Date.now()/1000;
  const date=new Date(seconds*1000).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"});
  return(
    <div className="saved-plan-card">
      <div className="saved-plan-name">{plan.name}</div>
      <div className="saved-plan-meta">💾 Saved {date} · {plan.mealCount} meal{plan.mealCount!==1?"s":""}</div>
      <div className="saved-plan-preview">{preview.map((t,i)=><span key={i} className="plan-preview-chip">{t}</span>)}{allMeals.length>preview.length&&<span className="plan-preview-chip">+{allMeals.length-preview.length} more</span>}</div>
      <div className="saved-plan-actions"><button className="btn btn-forest btn-sm" style={{flex:1}} onClick={onLoad}>📅 Load this week</button><button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button></div>
    </div>
  );
}

function CustomItemInput({onAdd}){
  const [val,setVal]=useState("");
  const submit=()=>{if(!val.trim())return;onAdd(val);setVal("");};
  return<><input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Add your own item… (e.g. toilet paper)"/><button className="add-item-btn" onClick={submit}>Add</button></>;
}

function RecipeCard({recipe,isFav,onFav,onView,onAddToPlan,days}){
  const [day,setDay]=useState("Monday");
  return(
    <div className="recipe-card">
      <div className="recipe-card-img-wrap">
        {recipe.image?<img src={recipe.image} alt={recipe.title} loading="lazy"/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52}}>🍽️</div>}
        <div className="source-badge">{recipe.cuisine||recipe.category}</div>
        <button className="fav-badge" onClick={e=>{e.stopPropagation();onFav();}}>{isFav?"❤️":"🤍"}</button>
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-title">{recipe.title}</div>
        <div className="recipe-card-meta">{recipe.cuisine&&<span className="meta-tag">🌍 {recipe.cuisine}</span>}{recipe.category&&<span className="meta-tag">🗂 {recipe.category}</span>}<span className="meta-tag">🥄 {recipe.ingredients.length} ingredients</span></div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <select className="plan-select" value={day} onChange={e=>setDay(e.target.value)}>{days.map(d=><option key={d}>{d}</option>)}</select>
          <button className="btn btn-forest btn-sm" onClick={()=>onAddToPlan(day)} style={{flexShrink:0}}>+ Plan</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={onFav}>{isFav?"Unsave":"Save ❤️"}</button>
          <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={onView}>View Recipe</button>
        </div>
      </div>
    </div>
  );
}

function CustomRecipeCard({recipe,onAddToPlan,onDelete,onEdit,days}){
  const [day,setDay]=useState("Monday");
  const [expanded,setExpanded]=useState(false);
  const emoji=MEAL_TYPE_EMOJI[recipe.mealType]||"🍽️";
  return(
    <div className="custom-recipe-card">
      <div className="custom-recipe-body">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div>
            {recipe.mealType&&<div className="meal-type-chip">{emoji} {recipe.mealType}</div>}
            <div className="recipe-card-title" style={{marginTop:4}}>{recipe.title}</div>
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
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select className="plan-select" value={day} onChange={e=>setDay(e.target.value)}>{days.map(d=><option key={d}>{d}</option>)}</select>
          <button className="btn btn-forest btn-sm" onClick={()=>onAddToPlan(day)} style={{flexShrink:0}}>+ Plan</button>
        </div>
      </div>
    </div>
  );
}

function RecipeModal({recipe,isFav,onClose,onFav,onAddToPlan,days}){
  const [modTab,setModTab]=useState("ingredients");
  const [day,setDay]=useState("Monday");
  const [servings,setServings]=useState(recipe.servings||4);
  const ratio=servings/(recipe.servings||4);
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
        <div className="recipe-card-meta" style={{marginBottom:10}}>{recipe.cuisine&&<span className="meta-tag">🌍 {recipe.cuisine}</span>}{recipe.category&&<span className="meta-tag">🗂 {recipe.category}</span>}<span className="meta-tag">🥄 {recipe.ingredients.length} ingredients</span></div>
        {recipe.youtube&&<a className="yt-btn" href={recipe.youtube} target="_blank" rel="noreferrer">▶ Watch on YouTube</a>}
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
  const [ingredients,setIngredients]=useState(recipe?.ingredients?.length?recipe.ingredients:[{name:"",amount:""}]);
  const [notes,setNotes]=useState(recipe?.notes||"");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const updateIngredient=(i,field,val)=>{ const u=[...ingredients]; u[i]={...u[i],[field]:val}; setIngredients(u); };
  const addIngredientRow=()=>setIngredients(p=>[...p,{name:"",amount:""}]);
  const removeIngredientRow=i=>setIngredients(p=>p.filter((_,idx)=>idx!==i));
  const handleSave=async()=>{
    if(!title.trim()){setError("Please enter a recipe name.");return;}
    setSaving(true);
    const cleanIngredients=ingredients.filter(i=>i.name.trim()).map(i=>({name:i.name.trim(),amount:i.amount.trim()}));
    await onSave({ title:title.trim(), mealType, ingredients:cleanIngredients, notes:notes.trim(), source:"custom", servings:1, cuisine:"", category:mealType, image:"", youtube:"", steps:notes?[notes.trim()]:[], id:recipe?.id||`custom-${Date.now()}` });
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
        <input className="form-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder='e.g. "Recipe Name"'/>
        <label className="form-label">Meal type</label>
        <div className="meal-type-selector">{MEAL_TYPES.map(t=><button key={t} className={`meal-type-btn ${mealType===t?"active":""}`} onClick={()=>setMealType(t)}>{MEAL_TYPE_EMOJI[t]} {t}</button>)}</div>
        <div className="section-divider" style={{marginTop:18}}>
          <span>Ingredients</span><div className="section-divider-line"/>
          <span style={{fontSize:12,color:"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontWeight:400}}>optional</span>
        </div>
        {ingredients.map((ing,i)=>(
          <div key={i} className="ingredient-input-row">
            <input value={ing.name} onChange={e=>updateIngredient(i,"name",e.target.value)} placeholder="Ingredient name"/>
            <input value={ing.amount} onChange={e=>updateIngredient(i,"amount",e.target.value)} placeholder="Amount" style={{maxWidth:100}}/>
            {ingredients.length>1&&<button className="remove-btn" onClick={()=>removeIngredientRow(i)} style={{fontSize:20}}>×</button>}
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" style={{marginBottom:4}} onClick={addIngredientRow}>+ Add ingredient</button>
        <div className="section-divider" style={{marginTop:16}}>
          <span>Notes / Steps</span><div className="section-divider-line"/>
          <span style={{fontSize:12,color:"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontWeight:400}}>optional</span>
        </div>
        <textarea className="form-textarea" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any prep notes, cooking steps, or reminders…"/>
        <button className="btn btn-primary btn-full" style={{marginTop:20}} onClick={handleSave} disabled={saving}>{saving?"Saving…":isEdit?"Save Changes":"Save Recipe"}</button>
      </div>
    </div>
  );
}