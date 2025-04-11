import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from 'lucide-react'

interface LoginPanelProps {
  onLogin: () => void;
  onClose: () => void;
}

export function LoginPanel({ onLogin, onClose }: LoginPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Use the asset protocol for loading images
  const characterImagePath = "asset://login-assets/singupimage.jpg";
  const gridImagePath = "asset://login-assets/Grid.png";

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      await window.api.login({ email, password });
      onLogin();
      onClose();
    } catch (err) {
      setError('Wrong email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login Form Component
  const LoginForm = () => (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-white tracking-tight">Welcome Back</h1>
        <p className="text-[#ecb96a] tracking-wide">Please enter your details to sign in.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-100/10 rounded-xl">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label htmlFor="email" className="block text-base font-semibold text-white tracking-wide">
            E-Mail Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 px-4 rounded-2xl bg-[#241c33] border-[#ad7e34] text-white
                       focus:ring-2 focus:ring-[#c99a4c]/50 focus:border-[#c99a4c]
                       transition-shadow hover:bg-[#2a2039]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-base font-semibold text-white tracking-wide">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 px-4 rounded-2xl bg-[#241c33] border-[#ad7e34] text-white pr-12
                         focus:ring-2 focus:ring-[#c99a4c]/50 focus:border-[#c99a4c]
                         transition-shadow hover:bg-[#2a2039]"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#ecb96a]"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 font-semibold bg-[#c084fc] hover:bg-[#a855f7] text-white 
                     rounded-2xl shadow-lg shadow-[#c084fc]/30 transition-all
                     hover:shadow-[#c084fc]/40 hover:scale-[1.01]"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center text-gray-400">
        Don't have an account yet?{" "}
        <button 
          type="button"
          onClick={() => window.api.openExternal('https://divineskins.gg/account/register')}
          className="text-[#ecb96a] font-semibold hover:text-[#c99a4c] transition-colors"
        >
          Sign Up
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl flex animate-in fade-in-50 duration-300">
        {/* Left side - Character Image */}
        <div className="hidden md:block w-2/5 relative">
          <div className="absolute inset-0">
            <img
              src={characterImagePath}
              alt="Fantasy character"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full md:w-3/5 bg-[#1a1525] relative py-10 px-8">
          {/* Grid Background with semi-circular fade */}
          <div className="absolute top-0 right-0 left-0 h-[40%] overflow-hidden">
            <div className="absolute inset-0">
              <img
                src={gridImagePath}
                alt="Grid background"
                className="w-full h-full object-cover opacity-25"
                style={{
                  maskImage: "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
                  WebkitMaskImage: "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)",
                }}
              />
            </div>
          </div>

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="relative z-10">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

