import React from 'react';
import { Link } from 'react-router-dom'; // or your preferred routing solution

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 text-center">
      <div className="relative w-64 h-64">
        {/* Gradient background circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 blur-xl"></div>
        
        {/* Main illustration */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="text-8xl font-bold text-primary mb-4">404</div>
          <svg 
            className="w-32 h-32 text-primary animate-float" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
      </div>
      
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-lg text-muted-foreground">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      
      <div className="flex gap-4">
        <Link 
          to="/" 
          className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-soft hover:shadow-glow transition-all duration-300"
        >
          Go Home
        </Link>
        <button 
          onClick={() => window.history.back()} 
          className="px-6 py-3 rounded-full bg-accent text-accent-foreground font-medium shadow-soft hover:shadow-soft transition-all duration-300"
        >
          Go Back
        </button>
      </div>
      
      {/* Optional decorative elements */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 opacity-50">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="w-2 h-2 rounded-full bg-primary animate-pulse" 
            style={{ animationDelay: `${i * 0.2}s` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default NotFound;