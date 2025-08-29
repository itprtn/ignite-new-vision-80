// Security measures for production deployment
// This file implements console mode protections to prevent unauthorized access

// Disable developer tools in production builds
export function initializeSecurity() {
  // Only apply in production
  if (process.env.NODE_ENV === 'production') {
    // Prevent screenshot shortcuts
    document.addEventListener('keydown', (e) => {
      // Prevent PrintScreen (this can't be fully disabled on most systems)
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+C, Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'I':
          case 'J':
          case 'C':
            e.preventDefault();
            return false;
        }
      }
      // Prevent Ctrl+U (view source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
    });

    // Detect if developer tools are open (basic detection)
    let devtoolsOpen = false;
    const threshold = 160;
    const check = () => window.outerHeight - window.innerHeight > threshold || window.outerWidth - window.innerWidth > threshold;
    const detectDevtools = () => {
      if (check() && !devtoolsOpen) {
        devtoolsOpen = true;
        // Obfuscate the content when devtools are detected
        document.body.style.filter = 'blur(10px)';
        document.body.style.pointerEvents = 'none';
        document.body.innerHTML = '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: Arial; text-align: center; color: red; font-size: 24px;">Unauthorized access detected</div>';
      } else if (!check() && devtoolsOpen) {
        devtoolsOpen = false;
        document.body.style.filter = '';
        document.body.style.pointerEvents = '';
      }
    };

    setInterval(detectDevtools, 500);

    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Disable F12 directly
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
    });

    // Obfuscate sensitive console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      if (!args.includes('authorized_debug')) {
        return; // Block console.log
      }
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      if (!args.includes('authorized_debug')) {
        return; // Block console.warn
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      // Only allow specific error messages
      const message = args[0]?.toString() || '';
      if (!message.includes('authorized_error')) {
        return; // Block console.error
      }
      originalError.apply(console, args);
    };

    // Prevent text selection
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    });

    // Prevent copying
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      return false;
    });
  }
}

// Additional security: Remove sensitive data from global scope
export function sanitizeEnvironment() {
  // In production, don't expose debug information
  if (process.env.NODE_ENV === 'production') {
    // Disable global error reporting
    window.onerror = () => false;
    window.onunhandledrejection = () => false;

    // Remove any potential debug globals
    delete (window as any).debug;
    delete (window as any).devtools;
    delete (window as any).console;
  }
}

// Initialize security on module load
initializeSecurity();
sanitizeEnvironment();