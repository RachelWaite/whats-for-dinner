# 🍽️ What's For Dinner?

> Plan smarter. Never ask again.

A mobile-first meal planning app for families. Search recipes, save your favourites, plan your week, and auto-generate a shopping list — all in one place.

---

## ✨ Features

- **Recipe Search** — search by keyword, ingredient, category, or cuisine via TheMealDB
- **Ingredient Search** — type what's in your fridge and find recipes that use it
- **Save Recipes** — heart any recipe to save it to your personal collection
- **Custom Recipes** — create and edit your own recipes with ingredients and notes
- **Weekly Meal Planner** — drag meals into Mon–Sun with adjustable servings
- **Saved Plans** — name and save weekly plans to reuse anytime
- **Smart Shopping List** — auto-generated from your week's meals, organised by supermarket aisle, with quantity combining
- **User Accounts** — sign up / sign in with email and password, all data synced to the cloud per user

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Custom CSS (no framework) |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Recipe API | TheMealDB (free tier) |
| Hosting | Firebase Hosting *(coming soon)* |

---

## 🚀 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A Firebase project with Authentication and Firestore enabled

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/whats-for-dinner.git
   cd whats-for-dinner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your Firebase config**

   Create `src/firebase.js` with your Firebase project credentials:
   ```js
   import { initializeApp } from "firebase/app";
   import { getAuth } from "firebase/auth";
   import { getFirestore } from "firebase/firestore";

   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.firebasestorage.app",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173)

---

## 🗂️ Project Structure

```
recipe-app/
├── src/
│   ├── App.jsx          # Main application (all components)
│   ├── firebase.js      # Firebase config and exports
│   └── main.jsx         # React entry point
├── public/
├── vite.config.js       # Vite config (includes API proxy setup)
├── package.json
└── README.md
```

---

## 🔐 Firestore Data Structure

All data is stored per user under `users/{uid}/`:

```
users/{uid}/
├── data/
│   ├── favourites       # { items: [...] }
│   ├── mealPlan         # { plan: { Monday: [...], ... } }
│   ├── customItems      # { items: [...] }
│   └── settings         # { maxResults: 20 }
├── savedPlans/
│   └── {docId}          # { name, plan, mealCount, savedAt }
└── customRecipes/
    └── {docId}          # { title, mealType, ingredients, notes, ... }
```

### Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🗺️ Roadmap

- [ ] Deploy to Firebase Hosting
- [ ] Dietary filters (Vegetarian, Vegan, Gluten Free, Dairy Free)
- [ ] Recipe image upload for custom recipes
- [ ] Shareable meal plans
- [ ] Household / family accounts (shared planning)
- [ ] Instacart / grocery store integration
- [ ] Native mobile app (React Native)
- [ ] Upgrade recipe API for larger database

---

## 📋 Notes

- Recipe data is provided by [TheMealDB](https://www.themealdb.com/) free API
- Firebase free tier (Spark plan) is sufficient for personal use
- The app is currently in active development

---

*Built with ☕ and a lot of "what's for dinner?" conversations.*
