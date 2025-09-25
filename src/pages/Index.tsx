import { useState, useEffect } from "react";
import { Shield, Star, Clock, Award, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Guard {
  id: string;
  photo_url: string | null;
  rating: number;
  city: string;
  hourly_rate_mxn_cents: number;
  armed_hourly_surcharge_mxn_cents: number;
  company_id?: string | null;
  skills?: unknown;
}

const Index = () => {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuards = async () => {
      try {
        const { data } = await supabase
          .rpc('get_public_guards');
        if (data) setGuards(((data || []) as unknown as Guard[]).slice(0, 6));
      } catch (error) {
        console.error('Error fetching guards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuards();
  }, []);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const valueProps = [
    {
      icon: Shield,
      title: "Professional Security",
      titleEs: "Seguridad Profesional",
      description: "Licensed and trained protection specialists",
      descriptionEs: "Especialistas en protección licenciados y entrenados"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      titleEs: "Disponibilidad 24/7",
      description: "Round-the-clock protection when you need it",
      descriptionEs: "Protección las 24 horas cuando la necesites"
    },
    {
      icon: Award,
      title: "Verified Guards",
      titleEs: "Guardias Verificados",
      description: "Background checked and certified professionals",
      descriptionEs: "Profesionales verificados y certificados"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <Shield className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Blindado
            </h1>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Protección Personal Segura y Confiable
          </h2>
          <p className="text-xl text-muted-foreground mb-2">
            Secure Personal Protection
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with professional security specialists for personal protection services
          </p>
          
          {/* Prominent CTA */}
          <Button
            onClick={() => window.location.href = "/client.html"}
            size="lg"
            className="h-16 px-8 text-lg font-semibold rounded-[32px] bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl"
          >
            Book a Protector / Reservar un Escolta
          </Button>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {valueProps.map((prop, index) => (
            <Card key={index} className="h-[92px] flex items-center p-6 border-2 hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <prop.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{prop.title}</h3>
                  <p className="text-xs text-muted-foreground">{prop.titleEs}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Featured Protectors Carousel */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Featured Protectors</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 h-80 bg-muted rounded-lg animate-pulse snap-center" />
              ))
            ) : (
              guards.map((guard) => (
                <Card key={guard.id} className="flex-shrink-0 w-64 snap-center border-2 hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="aspect-square w-full mb-4 bg-muted rounded-lg overflow-hidden">
                      {guard.photo_url ? (
                        <img 
                          src={guard.photo_url} 
                          alt="Protector" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shield className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{guard.rating}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{guard.city}</p>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {formatPrice(guard.hourly_rate_mxn_cents)}/hr
                      </p>
                      {guard.armed_hourly_surcharge_mxn_cents > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +{formatPrice(guard.armed_hourly_surcharge_mxn_cents)}/hr armed
                        </p>
                      )}
                    </div>
                    
                    {guard.company_id && (
                      <div className="flex items-center gap-1 mt-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-muted-foreground">Company Verified</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* App Access Section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">For Clients</h3>
              <p className="text-muted-foreground mb-4">
                Book protection services and manage your security needs
              </p>
              <Button
                onClick={() => window.location.href = "/client.html"}
                className="w-full"
              >
                Client Portal
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">For Guards</h3>
              <p className="text-muted-foreground mb-4">
                Join our network of professional security specialists
              </p>
              <Button
                onClick={() => window.location.href = "/guard.html"}
                variant="secondary"
                className="w-full"
              >
                Guard Portal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Professional security services • Licensed and insured • 24/7 support</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
