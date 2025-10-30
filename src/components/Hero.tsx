import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-jewels.jpg";

export const Hero = () => {
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 gradient-hero opacity-90"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="flex justify-center mb-6">
          <Crown className="h-16 w-16 text-accent animate-float" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 animate-fade-in">
          Les Joyaux de l'Empire
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-white/90">
          Collection exclusive des bijoux impériaux de Napoléon et Eugénie
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/catalog">
            <Button variant="gold" size="lg" className="text-lg px-8">
              <Sparkles className="mr-2 h-5 w-5" />
              Découvrir la Collection
            </Button>
          </Link>
          <Link to="/auth?mode=register">
            <Button variant="outline" size="lg" className="text-lg px-8 border-white/30 text-white hover:bg-white/10">
              Créer un Compte
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">8</div>
            <div className="text-sm text-white/80">Pièces Uniques</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">1804-1870</div>
            <div className="text-sm text-white/80">Ère Impériale</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">100%</div>
            <div className="text-sm text-white/80">Authentiques</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
};
