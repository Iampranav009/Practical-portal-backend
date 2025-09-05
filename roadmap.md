

You are building a **full-stack web application called Practical Portal (PlayWeb)**. Follow these instructions strictly.

---

## ⚙️ Tech Stack

* **Frontend**: React (Next.js recommended), TailwindCSS, shadcn/ui components.
* **Backend**: Node.js 15 with Express.js.
* **Database**: MySQL (Hostinger).
* **Authentication**: Firebase Authentication (Role-based: Student / Teacher).
* **Real-Time Updates**: WebSocket (Socket.IO).
* **Deployment**: Vercel/Netlify for frontend, Hostinger/Render for backend.
* **Design Principle**: Mobile-first (optimized for Nexus 15), responsive on desktop.

---

## 📂 Database Schema

**Users Table** → (user\_id, name, email, role \[student/teacher], created\_at)
**Batches Table** → (batch\_id, teacher\_id, name, college\_name, description, password, profile\_image, created\_at)
**Batch\_Members Table** → (id, batch\_id, student\_id, joined\_at)
**Submissions Table** → (submission\_id, batch\_id, student\_id, content, file\_url, status \[pending/accepted/rejected], created\_at)

---

## 🔑 Core Features

### 1. Authentication & Roles

* Firebase login (Student / Teacher roles).
* Secure session management.

### 2. Batch/Classroom Management (Teacher)

* Teacher can **create, edit, delete batches**.
* Batch fields: Name, College Name, Description, Profile Image, Password.
* Generate shareable **link + password** for student access.

### 3. Batch Joining (Student)

* Students join using **link + password**.
* Store membership in **Batch\_Members table**.

### 4. Feed System

* **Batch Feed** → Shows submissions for that class.
* **Explore Feed** → Public feed across multiple batches (filter by batch name).
* **Post button** → Students can post practical code/output (text + optional file).

### 5. Submissions

* Teachers can **Accept ✅ / Reject ❌**.
* Students get **real-time updates** via Socket.IO.
* Submission history stored in DB.

### 6. Dashboards

* **Teacher Dashboard** → Manage batches, view submissions, accept/reject.
* **Student Dashboard** → Joined batches, submission history, feeds.

### 7. Responsive UI

* Mobile-first with Tailwind.
* Modern, clean, Gen-Z friendly.
* Use shadcn/ui for components (cards, buttons, forms).

---

## 📑 Pages to Implement

1. **Landing Page** → App intro, login/register.
2. **Login / Signup Page** → Firebase auth.
3. **Teacher Dashboard**

   * Manage Batches (CRUD).
   * View Submissions.
   * Accept/Reject Submissions.
4. **Student Dashboard**

   * View Joined Batches.
   * Submission History.
   * Batch Feed.
5. **Batch Page**

   * For both Teacher & Student.
   * Shows feed, members, posts.
6. **Explore Feed Page** → Search/filter across public batches.
7. **Submission Page** → Post new practical (text + file).

---

## 🔄 Development Rules

1. Always follow **database schema + role-based access**.
2. Keep code modular and clean.
3. Use **Socket.IO for real-time updates** (submission status changes).
4. Always use **Tailwind + shadcn/ui** for UI components.
5. Ensure **secure Firebase auth integration**.
6. Optimize for **scalability & mobile-first design**.

---

## 🛠️ Output Format for Cursor

* Generate **Next.js pages** for frontend.
* Generate **Express.js routes/controllers** for backend.
* Generate **MySQL migrations & queries**.
* Provide **API endpoints** that connect frontend & backend.
* Always document the code with **clear comments**.
* Maintain **role-based access control** in APIs.

---


