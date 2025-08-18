import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
      <div className="relative w-20 h-20">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
        
        {/* Main circle with gradient border */}
        <div className="absolute inset-0 rounded-full border-[6px] border-transparent">
          <div className="absolute inset-0 rounded-full border-[6px] border-primary/20"></div>
          <div 
            className="absolute inset-0 rounded-full border-[6px] border-l-transparent border-primary animate-spin"
            style={{ 
              background: 'conic-gradient(from 0deg at 50% 50%, transparent 0%, hsl(var(--primary)/0.1) 100%)'
            }}
          ></div>
        </div>
        
        {/* Inner spinner elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-8 h-8">
            {/* Spinner dots */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `
                    translate(-50%, -50%)
                    rotate(${i * 45}deg)
                    translate(0, -12px)
                  `,
                  opacity: 0.7 + (i * 0.05),
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
            
            {/* Center dot with glow */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-glow"></div>
          </div>
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-foreground">Loading content</h3>
        <p className="text-sm text-muted-foreground">Please wait while we prepare everything</p>
      </div>
      
      {/* Progress bar with gradient */}
      <div className="w-48 h-1.5 bg-accent rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-primary rounded-full animate-progress"
          style={{ 
            backgroundSize: '200% 100%',
            animation: 'progress 2s ease-in-out infinite, gradientShift 3s ease infinite' 
          }}
        ></div>
      </div>
    </div>
  );
};

export default Loading;