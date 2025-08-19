import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, ArrowRight } from "lucide-react";

const Index = () => {
  const handleClientApp = () => {
    window.location.href = "/client.html";
  };

  const handleGuardApp = () => {
    window.location.href = "/guard.html";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <Shield className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Blindado
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional security and protection services platform
          </p>
        </div>

        {/* App Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Client App */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Client Portal</CardTitle>
              <p className="text-muted-foreground">
                Book security services and manage your protection requests
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li>• Request personal protection</li>
                <li>• Track active bookings</li>
                <li>• Manage profile and preferences</li>
                <li>• Real-time communication</li>
              </ul>
              <Button
                onClick={handleClientApp}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                Enter Client Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          {/* Guard App */}
          <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">Guard Portal</CardTitle>
              <p className="text-muted-foreground">
                Manage assignments and company operations
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li>• View active assignments</li>
                <li>• Manage company staff</li>
                <li>• Handle permits and vehicles</li>
                <li>• Apply as freelancer</li>
              </ul>
              <Button
                onClick={handleGuardApp}
                variant="secondary"
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                Enter Guard Portal
                <ArrowRight className="ml-2 h-5 w-5" />
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
