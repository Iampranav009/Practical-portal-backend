# Practical Portal Frontend

A modern, responsive frontend for the Practical Portal - a collaborative learning platform for managing practical submissions between teachers and students.

## 🚀 Live Demo

[Deployed on Vercel](https://practical-portal-frontend.vercel.app)

## ✨ Features

### 🎨 Modern UI/UX
- **Dark/Light Theme** with system preference detection
- **Mobile-first responsive design** optimized for all devices
- **Modern landing page** with role selection and feature showcase
- **Clean, intuitive navigation** with role-based access

### 🔐 Authentication
- **Firebase Authentication** integration
- **Role-based login** (Student/Teacher)
- **JWT token management** for backend API access
- **Profile completion tracking** with guided setup

### 👥 User Management
- **Teacher Dashboard** with batch management
- **Student Dashboard** with submission tracking
- **Profile management** with image upload support
- **Real-time notifications** system

### 📱 Responsive Design
- **Mobile-optimized** interface
- **Touch-friendly** interactions
- **Progressive Web App** capabilities
- **Cross-platform compatibility**

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS 4** - Utility-first CSS framework
- **shadcn/ui** - Accessible UI components
- **Firebase Auth** - Authentication service
- **Lucide React** - Modern icon library
- **Socket.io** - Real-time communication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Authentication enabled

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Iampranav009/Practical-portal-frontend.git
cd Practical-portal-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
Create `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_BASE_URL=your_backend_api_url
```

4. **Run development server**
```bash
npm run dev
```

5. **Open in browser**
Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── students/          # Student-specific pages
│   ├── teachers/          # Teacher-specific pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── landing/          # Landing page components
│   └── layout/           # Layout components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── utils/                # Helper functions
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## 🔧 Configuration

### Vercel Deployment
The project is configured for seamless Vercel deployment:
- Optimized build settings
- Automatic environment variable handling
- Edge functions support
- Global CDN distribution

### Environment Variables
Required environment variables for production:
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL

## 🎨 Theming

The app supports both dark and light themes:
- **System preference detection**
- **Manual theme toggle**
- **Persistent theme selection**
- **Smooth theme transitions**

## 📱 Mobile Features

- **Touch-optimized interface**
- **Swipe gestures** for navigation
- **Responsive breakpoints**
- **Mobile-specific components**

## 🔐 Security Features

- **CSP headers** for XSS protection
- **Secure authentication** with Firebase
- **JWT token validation**
- **Input sanitization**

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related

- [Backend API Repository](https://github.com/Iampranav009/Practical-portal-backend)
- [Project Documentation](https://github.com/Iampranav009/Practical-portal)

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: [Your Email]

---

**Built with ❤️ for better education**