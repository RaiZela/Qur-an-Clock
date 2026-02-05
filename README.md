# 🕋 Quranic Clock

A reflective Quran-centered clock designed for daily awareness, learning, and personal spirituality.  
The app combines time, Qur’an verses, prayer reminders, and personal reflection tools into one minimal experience.

---

## 🖼️ Screenshots

![Home Screen](assets\images\screenshots\home-screen.jpeg)

![Prayer Times](assets\images\screenshots\prayer-times.jpeg)

![Saved Verses](assets\images\screenshots\saved-verses.jpeg)

![Surah List](assets\images\screenshots\surah-list.jpeg)

![Selected Surah English](assets\images\screenshots\selected-surah-english.jpeg)

![Selected Surah Arabic](assets\images\screenshots\selected-surah-arabic.jpeg)

![Gratitude Journal](assets\images\screenshots\gratitude.jpeg)

![Prayer Chat](assets\images\screenshots\prayer-chat.jpeg) 

---

# ✨ Features

---

## 📖 Random Qur’an Verse Engine

The application displays a **random Qur’anic verse** that refreshes automatically every minute.  
Users can also refresh manually and save verses to their favorites.

### ✅ Functionalities
- Auto refresh every minute
- Manual refresh button
- Add/remove verse from favorites
- Fetches verse dynamically from API

### 🧠 How the Verse Calculation Works

Instead of mapping clock time to a fixed surah:ayah (e.g., 20:114), the app maps time to a **global ayah number (1..6236)** so every verse can appear.

**Algorithm:**

minutesToday = hours * 60 + minutes
dayNumber = YYYYMMDD
seed = dayNumber * 1440 + minutesToday
globalAyah = (seed % 6236) + 1


The verse is fetched from:
https://api.alquran.cloud/v1/ayah/{globalAyah}


This ensures:
- A different verse every minute
- Variation across different days
- Full coverage of the Qur’an (6236 ayāt)

---

🖼️ **Random Verse UI**

![Random Verse](assets\images\screenshots\random-verse.jpeg)

---

## 🌙 Dual Calendar Display

The clock shows both:

- 🌞 Solar (Gregorian) date
- 🌙 Lunar (Hijri) date

This allows users to stay aware of both spiritual and daily timelines.

🖼️ **Calendar View**

![Calendar](assets\images\screenshots\calendar.jpeg)

---

## 🕌 Islamic Days Calculator

The app calculates and highlights:

- Ramadan days
- Dhul Hijjah
- Day of Arafah

When selecting a special day, the app displays a short explanation/definition.

🖼️ **Islamic Days Screen**

![Islamic Days](assets\images\screenshots\islamic-days.jpeg)

---

## ⏰ Prayer Times Screen

A dedicated screen displays daily prayer times with reminder notifications.

### Current Status
- Prayer times displayed
- Notification system implemented

### 🚧 TODO
- Trigger notifications at exact scheduled time  
- Avoid firing notifications on screen load or toggle

🖼️ **Prayer Times UI**

![Prayer Times Detail](assets\images\screenshots\prayer-times.jpeg)

---

## ⭐ Saved Verses Library

Users can store favorite ayāt and revisit them later.

### Features
- Saved verses list
- Search functionality
- Quick access for reflection

🖼️ **Saved Verses**

![Saved Verses List](assets\images\screenshots\saved-verses.jpeg)

---

## 🤲 Gratitude List

A personal space to record gratitude entries.

### Features
- Add new gratitude notes
- Maintain a growing reflection list
- Minimal journaling experience

🖼️ **Gratitude Screen**

![Gratitude](assets\images\screenshots\gratitude.jpeg)

---

## 📝 Prayer Writing (Reflection Chat)

A writing space for users who feel better expressing their thoughts as prayers.

⚠️ This is **not** a messaging system, it is a private reflection space.  
(No responses are generated.)

🖼️ **Reflection Chat**

![Prayer Chat](assets\images\screenshots\prayer-chat.jpeg)

---

## 📚 Surah Reader

A browsing screen where users can select surahs and read them.

### Reading Options
- Arabic
- English translation

🖼️ **Surah List**

![Surah List](assets\images\screenshots\surah-list.jpeg)

---

# 🧱 Architecture Overview

- Verse API: **alquran.cloud**
- Time-based verse generation algorithm
- Local storage for:
  - Favorites
  - Gratitude entries
  - Prayer writing notes

---

# 🚧 Roadmap

- [ ] Fix prayer notification scheduling
- [ ] Improve offline caching
- [ ] Add advanced filtering for saved verses
- [ ] UI refinements

---

# 🤍 Philosophy

This project is built as a **quiet spiritual companion**,
not a replacement for faith or worship, but a supportive digital space for reflection, learning, and awareness.


